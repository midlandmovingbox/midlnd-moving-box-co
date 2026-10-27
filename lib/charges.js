// Server-side helpers shared by the admin routes.
import { randomUUID } from 'crypto';
import { supabaseAdmin } from './supabaseAdmin';
import { chargeStoredCard } from './square';

export async function loadReservation(id) {
  const { data } = await supabaseAdmin.from('reservations').select('*').eq('id', id).single();
  return data || null;
}

// Charges the card on file and logs it in the `charges` table. Throws on any failure.
export async function chargeAndLog(reservation, amount, note) {
  if (!reservation.square_card_id) throw new Error('No card on file for this reservation');
  const payment = await chargeStoredCard({
    cardId: reservation.square_card_id,
    customerId: reservation.square_customer_id,
    amountCents: Math.round(amount * 100),
    idempotencyKey: randomUUID(),
    note,
  });
  const { data, error } = await supabaseAdmin
    .from('charges')
    .insert({ reservation_id: reservation.id, amount, note, square_payment_id: payment.id })
    .select()
    .single();
  if (error) {
    console.error('CRITICAL: charge succeeded but log failed', error, payment.id);
    throw new Error('Charge succeeded in Square but logging failed. Payment ID: ' + payment.id);
  }
  return data;
}

export function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const int = (v) => Math.max(0, parseInt(v, 10) || 0);
