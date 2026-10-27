import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { emailDeclined } from '../../../../lib/email';
import { DECLINE_REASONS } from '../../../../lib/declineReasons';

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { reservationId, reason, note } = await request.json();
  if (!reservationId) {
    return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
  }
  if (!reason || !DECLINE_REASONS[reason]) {
    return NextResponse.json({ error: 'Pick a reason' }, { status: 400 });
  }
  const cleanNote = (note || '').trim().slice(0, 1000);
  if (reason === 'other' && !cleanNote) {
    return NextResponse.json({ error: 'Add a note explaining the reason' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update({ status: 'declined', decline_reason: reason, decline_note: cleanNote || null })
    .eq('id', reservationId)
    .eq('status', 'requested')
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Could not decline (is it still pending?)' }, { status: 500 });
  }

  await emailDeclined(data, DECLINE_REASONS[reason].text, cleanNote);

  return NextResponse.json({ success: true, reservation: data });
}
