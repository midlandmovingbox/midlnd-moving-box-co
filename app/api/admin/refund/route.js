import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { refundPayment } from '../../../../lib/square';

// Refunds a payment that belongs to this reservation (the original rental payment
// or one of its extra charges). Logged in `charges` as a NEGATIVE amount.
export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const { reservationId, paymentId, amount, reason } = await request.json();
    const amountNum = parseFloat(amount);
    if (!reservationId || !paymentId || !amountNum || amountNum <= 0) {
      return NextResponse.json({ error: 'Missing reservation, payment, or valid amount' }, { status: 400 });
    }

    const { data: reservation } = await supabaseAdmin.from('reservations').select('*').eq('id', reservationId).single();
    if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

    let paymentTotal = null;
    if (paymentId === reservation.square_payment_id) {
      paymentTotal = Number(reservation.total);
    } else {
      const { data: charge } = await supabaseAdmin
        .from('charges')
        .select('*')
        .eq('reservation_id', reservationId)
        .eq('square_payment_id', paymentId)
        .gt('amount', 0)
        .maybeSingle();
      if (charge) paymentTotal = Number(charge.amount);
    }
    if (paymentTotal === null) {
      return NextResponse.json({ error: 'That payment does not belong to this reservation' }, { status: 400 });
    }

    // Don't allow refunding more than the payment minus earlier refunds (Square enforces this too).
    const { data: prior } = await supabaseAdmin
      .from('charges')
      .select('amount')
      .eq('reservation_id', reservationId)
      .lt('amount', 0)
      .like('note', `%[${paymentId}]%`);
    const alreadyRefunded = (prior || []).reduce((sum, c) => sum + Math.abs(Number(c.amount)), 0);
    if (amountNum + alreadyRefunded > paymentTotal + 0.001) {
      return NextResponse.json(
        { error: `Only $${(paymentTotal - alreadyRefunded).toFixed(2)} is left to refund on that payment` },
        { status: 400 }
      );
    }

    const refund = await refundPayment({
      paymentId,
      amountCents: Math.round(amountNum * 100),
      idempotencyKey: randomUUID(),
      reason: reason || 'Refund',
    });

    const { data: row, error: insertError } = await supabaseAdmin
      .from('charges')
      .insert({
        reservation_id: reservationId,
        amount: -amountNum,
        note: `Refund${reason ? ': ' + reason : ''} [${paymentId}]`,
        square_payment_id: refund.id,
      })
      .select()
      .single();
    if (insertError) {
      console.error('CRITICAL: refund succeeded but log insert failed', insertError, refund.id);
      return NextResponse.json({ error: 'Refund succeeded in Square but logging failed. Refund ID: ' + refund.id }, { status: 500 });
    }
    return NextResponse.json({ success: true, charge: row });
  } catch (err) {
    console.error('refund error:', err);
    return NextResponse.json({ error: err.message || 'Could not process refund' }, { status: 500 });
  }
}
