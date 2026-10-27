import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { loadReservation, chargeAndLog } from '../../../../lib/charges';
import { POLICY, taxed } from '../../../../lib/policy';
import { emailRescheduled } from '../../../../lib/email';

export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const { reservationId, deliveryDate, pickupDate, late } = await request.json();
    const r = await loadReservation(reservationId);
    if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    if (r.status !== 'confirmed') return NextResponse.json({ error: 'Only confirmed reservations can be rescheduled' }, { status: 400 });
    if (!deliveryDate || !pickupDate || pickupDate < deliveryDate) {
      return NextResponse.json({ error: 'Enter valid dates (pickup after delivery)' }, { status: 400 });
    }

    let feeCharged = 0;
    if (late) {
      feeCharged = taxed(POLICY.rescheduleFee);
      await chargeAndLog(r, feeCharged, 'Reschedule fee incl. sales tax (less than 72 hours notice)');
    }
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ delivery_date: deliveryDate, pickup_date: pickupDate })
      .eq('id', reservationId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Could not update dates' + (feeCharged ? ' (fee was already charged)' : '') }, { status: 500 });
    await emailRescheduled(data, feeCharged);
    return NextResponse.json({ success: true, reservation: data });
  } catch (err) {
    console.error('reschedule error:', err);
    return NextResponse.json({ error: err.message || 'Could not reschedule' }, { status: 500 });
  }
}
