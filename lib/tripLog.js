import { supabaseAdmin } from './supabaseAdmin';

// Best effort: a logging problem must never block a delivery or pickup.
export async function logTrip(reservationId, kind, minutes, miles) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  const mi = Math.max(0, Number(miles) || 0);
  if (!m && !mi) return;
  try {
    await supabaseAdmin.from('trip_log').insert({ reservation_id: reservationId, kind, minutes: m, miles: mi, logged_on: new Date().toISOString().slice(0, 10) });
  } catch (err) {
    console.error('trip log failed', err);
  }
}
