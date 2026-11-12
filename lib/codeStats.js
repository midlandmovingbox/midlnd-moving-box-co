// Server-side: every discount code with how it is performing.
import { supabaseAdmin } from './supabaseAdmin';

const COUNTED = ['requested', 'confirmed', 'returned'];
const r2 = (n) => Math.round(n * 100) / 100;

export async function loadCodeStats() {
  const { data: codes, error } = await supabaseAdmin.from('discount_codes').select('*').order('created_at', { ascending: false });
  if (error) return { missingTable: true, codes: [] };

  const { data: reservations } = await supabaseAdmin.from('reservations').select('id,status,total,discount_code,discount_amount,square_payment_id,created_at');
  const { data: charges } = await supabaseAdmin.from('charges').select('amount,note');
  const refundedBy = {};
  for (const c of charges || []) {
    if (Number(c.amount) < 0) {
      const m = String(c.note || '').match(/\[([^\]]+)\]/);
      if (m) refundedBy[m[1]] = (refundedBy[m[1]] || 0) + Math.abs(Number(c.amount));
    }
  }

  const out = codes.map((c) => {
    const mine = (reservations || []).filter((r) => r.discount_code === c.code);
    const uses = mine.filter((r) => COUNTED.includes(r.status)).length;
    // Orders = charged and not refunded in full. Collected is net of any refund.
    const orders = mine.filter((r) => r.square_payment_id && (refundedBy[r.square_payment_id] || 0) < Number(r.total) - 0.01);
    const lastUsed = mine.reduce((a, r) => (!a || r.created_at > a ? r.created_at : a), null);
    return {
      ...c,
      value: Number(c.value),
      uses,
      orders: orders.length,
      collected: r2(orders.reduce((a, r) => a + Number(r.total) - (refundedBy[r.square_payment_id] || 0), 0)),
      discountGiven: r2(orders.reduce((a, r) => a + Number(r.discount_amount || 0), 0)),
      lastUsed,
    };
  });
  return { codes: out };
}
