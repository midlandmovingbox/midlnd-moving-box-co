import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { loadReservation, chargeAndLog, addDays, int } from '../../../../lib/charges';
import { POLICY, expectedEquipment, tripFeeFor, taxOn } from '../../../../lib/policy';
import { emailFees } from '../../../../lib/email';

// Fees are always calculated here from lib/policy.js, never trusted from the browser.
export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const body = await request.json();
    const r = await loadReservation(body.reservationId);
    if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

    const exp = expectedEquipment(r);
    const totes = r.delivered_totes ?? exp.totes;
    const items = [];
    let update = null;
    let intro = '';

    if (body.type === 'inspection') {
      if (!['confirmed', 'returned'].includes(r.status)) return NextResponse.json({ error: 'Reservation must be confirmed or returned' }, { status: 400 });
      const dt = int(body.damagedTotes), dd = int(body.damagedDollies), dirty = int(body.dirtyTotes);
      if (dt) items.push({ label: `${dt} damaged/unusable tote${dt > 1 ? 's' : ''}`, amount: dt * POLICY.toteDamaged });
      if (dd) items.push({ label: `${dd} damaged ${dd > 1 ? 'dollies' : 'dolly'}`, amount: dd * POLICY.dollyDamaged });
      if (dirty) items.push({ label: `${dirty} very dirty tote${dirty > 1 ? 's' : ''}`, amount: dirty * POLICY.toteDirty });
      intro = 'We inspected your returned equipment and found the following:';
    } else if (body.type === 'notready') {
      if (r.status !== 'confirmed') return NextResponse.json({ error: 'Reservation must be confirmed' }, { status: 400 });
      items.push({ label: `Equipment not ready at pickup: 1 extra week x ${totes} totes @ $${POLICY.extensionPerToteWeek.toFixed(2)}`, amount: totes * POLICY.extensionPerToteWeek });
      if (body.returnTrip) items.push({ label: 'Return-trip fee', amount: tripFeeFor(r.to_address || r.address) });
      if (body.newPickupDate) update = { pickup_date: body.newPickupDate };
      intro = "Your equipment wasn't ready when we arrived for pickup.";
    } else if (body.type === 'extension') {
      if (r.status !== 'confirmed') return NextResponse.json({ error: 'Reservation must be confirmed' }, { status: 400 });
      const weeks = Math.min(8, int(body.weeks));
      if (!weeks) return NextResponse.json({ error: 'Enter the number of weeks' }, { status: 400 });
      items.push({ label: `Rental extension: ${weeks} week${weeks > 1 ? 's' : ''} x ${totes} totes @ $${POLICY.extensionPerToteWeek.toFixed(2)}`, amount: weeks * totes * POLICY.extensionPerToteWeek });
      update = { pickup_date: addDays(r.pickup_date, weeks * 7) };
      intro = `As agreed, we extended your rental by ${weeks} week${weeks > 1 ? 's' : ''}. Your new pickup date is ${update.pickup_date}.`;
    } else {
      return NextResponse.json({ error: 'Unknown fee type' }, { status: 400 });
    }

    // Sales tax applies to everything
    const taxable = items.reduce((sum, i) => sum + i.amount, 0);
    const tax = taxOn(taxable);
    if (tax > 0) items.push({ label: 'Texas sales tax (8.25%)', amount: tax });
    const total = Math.round(items.reduce((sum, i) => sum + i.amount, 0) * 100) / 100;
    if (!total) return NextResponse.json({ error: 'Nothing to charge' }, { status: 400 });

    const note = items.map((i) => i.label).join('; ');
    const charge = await chargeAndLog(r, total, note);

    let reservation = r;
    if (update) {
      const { data } = await supabaseAdmin.from('reservations').update(update).eq('id', r.id).select().single();
      if (data) reservation = data;
    }
    await emailFees(reservation, { intro, items, total });
    return NextResponse.json({ success: true, charge, reservation });
  } catch (err) {
    console.error('fees error:', err);
    return NextResponse.json({ error: err.message || 'Could not process fee' }, { status: 500 });
  }
}
