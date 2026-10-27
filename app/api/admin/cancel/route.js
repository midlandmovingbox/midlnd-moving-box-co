import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { loadReservation, chargeAndLog } from '../../../../lib/charges';
import { refundPayment } from '../../../../lib/square';
import { POLICY, taxed } from '../../../../lib/policy';
import { emailCancelled } from '../../../../lib/email';

// Cancels a request/reservation before delivery. If it was already charged, refunds the rental
// (minus the cancellation fee when it's a late cancel). If not yet charged and late, charges the fee.
export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const { reservationId, late } = await request.json();
    const r = await loadReservation(reservationId);
    if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    if (!['requested', 'confirmed'].includes(r.status)) return NextResponse.json({ error: 'Only pending or confirmed reservations can be cancelled' }, { status: 400 });
    if (r.delivered_at) return NextResponse.json({ error: 'Already delivered. Use pickup/fees instead.' }, { status: 400 });

    const fee = late ? taxed(POLICY.cancelFee) : 0; // includes sales tax
    let refunded = 0;
    if (r.square_payment_id) {
      refunded = Math.round((Number(r.total) - fee) * 100) / 100;
      if (refunded > 0) {
        const refund = await refundPayment({
          paymentId: r.square_payment_id,
          amountCents: Math.round(refunded * 100),
          idempotencyKey: randomUUID(),
          reason: late ? 'Late cancellation (fee kept)' : 'Cancellation',
        });
        await supabaseAdmin.from('charges').insert({
          reservation_id: r.id,
          amount: -refunded,
          note: `Refund: cancellation [${r.square_payment_id}]`,
          square_payment_id: refund.id,
        });
      }
    } else if (fee > 0) {
      await chargeAndLog(r, fee, 'Cancellation fee incl. sales tax (less than 72 hours notice)');
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Money moved but status update failed. Check Square.' }, { status: 500 });
    await emailCancelled(data, { fee, refunded });
    return NextResponse.json({ success: true, reservation: data });
  } catch (err) {
    console.error('cancel error:', err);
    return NextResponse.json({ error: err.message || 'Could not cancel' }, { status: 500 });
  }
}
