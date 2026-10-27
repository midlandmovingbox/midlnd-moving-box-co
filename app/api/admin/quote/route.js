import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { computeTotals } from '../../../../lib/constants';
import { emailQuote } from '../../../../lib/email';

// Sets the out-of-area fee on a request, recalculates tax + total, and emails the
// customer asking them to reply OK. Nothing is charged here.
export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { reservationId, fee } = await request.json();
  const feeNum = parseFloat(fee);
  if (!reservationId || isNaN(feeNum) || feeNum < 0) {
    return NextResponse.json({ error: 'Enter a valid fee (0 or more)' }, { status: 400 });
  }

  const { data: r } = await supabaseAdmin.from('reservations').select('*').eq('id', reservationId).single();
  if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  if (r.status !== 'requested') {
    return NextResponse.json({ error: 'Only pending requests can be quoted' }, { status: 400 });
  }

  const surcharge = Number(r.delivery_surcharge) + Number(r.pickup_surcharge) + feeNum;
  const { subtotal, tax, total } = computeTotals(r.package, r.addons, surcharge);

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ quote_fee: feeNum, subtotal, tax, total, needs_quote: false, quote_sent_at: new Date().toISOString() })
    .eq('id', reservationId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Could not save quote' }, { status: 500 });

  await emailQuote(data);
  return NextResponse.json({ success: true, reservation: data });
}
