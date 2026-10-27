import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { emailDeclined } from '../../../../lib/email';

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { reservationId } = await request.json();
  if (!reservationId) {
    return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status: 'declined' })
    .eq('id', reservationId)
    .eq('status', 'requested')
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Could not update reservation' }, { status: 500 });
  }

  await emailDeclined(data);

  return NextResponse.json({ success: true, reservation: data });
}
