import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { loadReservation, int } from '../../../../lib/charges';
import { emailDelivered } from '../../../../lib/email';

// Records what was delivered and emails the customer the count (starts their 24-hour window).
export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { reservationId, totes, dollies } = await request.json();
  const r = await loadReservation(reservationId);
  if (!r) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  if (r.status !== 'confirmed') return NextResponse.json({ error: 'Only confirmed reservations can be delivered' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ delivered_at: new Date().toISOString(), delivered_totes: int(totes), delivered_dollies: int(dollies) })
    .eq('id', reservationId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: 'Could not save delivery' }, { status: 500 });
  await emailDelivered(data);
  return NextResponse.json({ success: true, reservation: data });
}
