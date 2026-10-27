import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

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
    .update({ status: 'returned' })
    .eq('id', reservationId)
    .eq('status', 'confirmed')
    .select()
    .single();
  if (error || !data) {
    return NextResponse.json({ error: 'Could not mark returned (must be confirmed)' }, { status: 400 });
  }
  return NextResponse.json({ success: true, reservation: data });
}
