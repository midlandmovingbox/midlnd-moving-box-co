import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { loadReservation, chargeAndLog, int } from '../../../../lib/charges';
import { POLICY, expectedEquipment, taxOn } from '../../../../lib/policy';
import { emailPickup } from '../../../../lib/email';

// Records what was picked up. Anything short of what was delivered is charged automatically.
export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const { reservationId, totes, dollies } = await request.json();
    const r = await loadReservation(reservationId);
    if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    if (r.status !== 'confirmed') return NextResponse.json({ error: 'Only confirmed reservations can be picked up' }, { status: 400 });

    const expected = expectedEquipment(r);
    const deliveredTotes = r.delivered_totes ?? expected.totes;
    const deliveredDollies = r.delivered_dollies ?? expected.dollies;
    const pickedTotes = int(totes);
    const pickedDollies = int(dollies);
    const missingTotes = Math.max(0, deliveredTotes - pickedTotes);
    const missingDollies = Math.max(0, deliveredDollies - pickedDollies);
    const subtotal = missingTotes * POLICY.toteMissing + missingDollies * POLICY.dollyMissing;
    const tax = taxOn(subtotal);
    const fee = Math.round((subtotal + tax) * 100) / 100;

    const items = [];
    if (missingTotes) items.push({ label: `${missingTotes} missing tote${missingTotes > 1 ? 's' : ''}`, amount: missingTotes * POLICY.toteMissing });
    if (missingDollies) items.push({ label: `${missingDollies} missing doll${missingDollies > 1 ? 'ies' : 'y'}`, amount: missingDollies * POLICY.dollyMissing });

    if (tax > 0) items.push({ label: 'Texas sales tax (8.25%)', amount: tax });

    let charge = null;
    if (fee > 0) {
      charge = await chargeAndLog(r, fee, `Missing at pickup: ${items.map((i) => i.label).join(', ')}`);
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update({ picked_up_at: new Date().toISOString(), picked_up_totes: pickedTotes, picked_up_dollies: pickedDollies, status: 'returned' })
      .eq('id', reservationId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: 'Pickup saved failed after charging. Check the Charges list.' }, { status: 500 });

    await emailPickup(data, { deliveredTotes, deliveredDollies, items, fee });
    return NextResponse.json({ success: true, reservation: data, charge });
  } catch (err) {
    console.error('pickup error:', err);
    return NextResponse.json({ error: err.message || 'Could not record pickup' }, { status: 500 });
  }
}
