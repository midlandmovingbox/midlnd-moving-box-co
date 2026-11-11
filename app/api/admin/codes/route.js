import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { normalizeCode } from '../../../../lib/discountMath';

const COUNTED = ['requested', 'confirmed', 'returned'];

// GET: every code with how it's performing. POST: create / turn on-off / delete.
export async function GET(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: codes, error } = await supabaseAdmin.from('discount_codes').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load codes. Has update-codes.sql been run?', missingTable: true }, { status: 200 });

  const { data: reservations } = await supabaseAdmin.from('reservations').select('id,status,total,discount_code,discount_amount,square_payment_id');
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
    return {
      ...c,
      value: Number(c.value),
      uses,
      orders: orders.length,
      collected: Math.round(orders.reduce((a, r) => a + Number(r.total) - (refundedBy[r.square_payment_id] || 0), 0) * 100) / 100,
      discountGiven: Math.round(orders.reduce((a, r) => a + Number(r.discount_amount || 0), 0) * 100) / 100,
    };
  });
  return NextResponse.json({ codes: out });
}

export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const b = await request.json();

  if (b.action === 'toggle') {
    const { error } = await supabaseAdmin.from('discount_codes').update({ active: !!b.active }).eq('id', b.id);
    if (error) return NextResponse.json({ error: 'Could not update' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (b.action === 'delete') {
    const { data: c } = await supabaseAdmin.from('discount_codes').select('code').eq('id', b.id).maybeSingle();
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { count } = await supabaseAdmin.from('reservations').select('id', { count: 'exact', head: true }).eq('discount_code', c.code);
    if (count > 0) return NextResponse.json({ error: 'This code has been used, so it is kept for your records. Turn it off instead.' }, { status: 400 });
    await supabaseAdmin.from('discount_codes').delete().eq('id', b.id);
    return NextResponse.json({ success: true });
  }

  // create
  const code = normalizeCode(b.code);
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return NextResponse.json({ error: 'Code must be 3-24 letters, numbers, dashes or underscores' }, { status: 400 });
  const type = b.type === 'amount' ? 'amount' : 'percent';
  const value = Number(b.value);
  if (!(value > 0) || (type === 'percent' && value > 100)) return NextResponse.json({ error: type === 'percent' ? 'Percent must be between 1 and 100' : 'Enter a dollar amount' }, { status: 400 });
  const maxUses = b.maxUses === '' || b.maxUses == null ? null : Math.floor(Number(b.maxUses));
  if (maxUses !== null && !(maxUses >= 1)) return NextResponse.json({ error: 'Max uses must be 1 or more (or blank for unlimited)' }, { status: 400 });
  const expires = b.expiresOn ? String(b.expiresOn) : null;
  if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return NextResponse.json({ error: 'Bad expiry date' }, { status: 400 });

  const { error } = await supabaseAdmin.from('discount_codes').insert({
    code, type, value,
    applies_to: type === 'percent' && b.appliesTo === 'base' ? 'base' : 'total',
    max_uses: maxUses,
    expires_on: expires,
    source: String(b.source || '').slice(0, 80) || null,
    active: true,
  });
  if (error) {
    if (String(error.code) === '23505') return NextResponse.json({ error: 'That code already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Could not save. Has update-codes.sql been run?' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
