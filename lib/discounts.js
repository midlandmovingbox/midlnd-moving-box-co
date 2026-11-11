// Server-side only: looking up and validating a discount code.
import { supabaseAdmin } from './supabaseAdmin';
import { normalizeCode } from './discountMath';

const chicagoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });

// Uses = requests that still count (declined and cancelled ones free the use back up).
export async function countUses(code) {
  const { count } = await supabaseAdmin
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('discount_code', code)
    .in('status', ['requested', 'confirmed', 'returned']);
  return count || 0;
}

// Returns { row } when usable, or { error } with a customer-friendly message.
export async function resolveCode(raw) {
  const code = normalizeCode(raw);
  if (!code) return { error: 'Enter a code' };
  const { data: row, error } = await supabaseAdmin.from('discount_codes').select('*').eq('code', code).maybeSingle();
  if (error) return { error: 'Codes are not available right now' };
  if (!row || !row.active) return { error: "That code isn't valid" };
  if (row.expires_on && row.expires_on < chicagoToday()) return { error: 'That code has expired' };
  if (row.max_uses != null && (await countUses(code)) >= row.max_uses) return { error: 'That code has been fully used' };
  return { row };
}
