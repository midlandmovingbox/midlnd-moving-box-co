import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { chargeStoredCard } from '../../../../lib/square';

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { reservationId, amount, note } = await request.json();
    const amountNum = parseFloat(amount);
    if (!reservationId || !amountNum || amountNum <= 0) {
      return NextResponse.json({ error: 'Missing reservationId or invalid amount' }, { status: 400 });
    }

    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    if (!reservation.square_card_id) {
      return NextResponse.json({ error: 'No card on file for this reservation' }, { status: 400 });
    }

    const payment = await chargeStoredCard({
      cardId: reservation.square_card_id,
      customerId: reservation.square_customer_id,
      amountCents: Math.round(amountNum * 100),
      idempotencyKey: randomUUID(),
      note: note || `Additional charge — ${reservation.package}`,
    });

    const { data: charge, error: insertError } = await supabaseAdmin
      .from('charges')
      .insert({
        reservation_id: reservationId,
        amount: amountNum,
        note: note || null,
        square_payment_id: payment.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('CRITICAL: additional charge succeeded but log insert failed', insertError, payment.id);
      return NextResponse.json(
        { error: 'Charge succeeded but logging it failed. Payment ID: ' + payment.id },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, charge });
  } catch (err) {
    console.error('additional charge error:', err);
    return NextResponse.json({ error: err.message || 'Could not process charge' }, { status: 500 });
  }
}
