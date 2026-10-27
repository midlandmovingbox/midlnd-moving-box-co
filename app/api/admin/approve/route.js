import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { chargeStoredCard } from '../../../../lib/square';
import { emailConfirmed } from '../../../../lib/email';

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { reservationId } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
    }

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    if (reservation.status !== 'requested') {
      return NextResponse.json({ error: `Reservation is already ${reservation.status}` }, { status: 409 });
    }

    const payment = await chargeStoredCard({
      cardId: reservation.square_card_id,
      customerId: reservation.square_customer_id,
      amountCents: Math.round(reservation.total * 100),
      idempotencyKey: randomUUID(),
      note: `${reservation.package} rental — ${reservation.delivery_date} to ${reservation.pickup_date}`,
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'confirmed', square_payment_id: payment.id })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('CRITICAL: charge succeeded but status update failed', updateError, payment.id);
      return NextResponse.json(
        { error: 'Charge succeeded but the reservation record failed to update. Check Square dashboard for payment ' + payment.id },
        { status: 500 }
      );
    }

    await emailConfirmed(updated);

    return NextResponse.json({ success: true, reservation: updated });
  } catch (err) {
    console.error('approve error:', err);
    return NextResponse.json({ error: err.message || 'Could not charge the card' }, { status: 500 });
  }
}
