import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { parseOrderNumber } from '../../../lib/order';
import { POLICY, taxed } from '../../../lib/policy';
import { expectedEquipment } from '../../../lib/policy';
import { emailExtensionAck, emailOwnerExtension } from '../../../lib/email';

// A customer ASKS for more time. This route never charges anything: the owner approves in admin.
// The reply is the same whether or not the order was found, so it can't be used to look up orders.
const recent = new Map();

export async function POST(request) {
  const OK = NextResponse.json({ ok: true });
  try {
    const body = await request.json();
    const prefix = parseOrderNumber(body.order);
    const email = String(body.email || '').trim().toLowerCase();
    const weeks = Math.min(4, Math.max(1, parseInt(body.weeks, 10) || 1));
    if (!prefix || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter your order number (like MMB-1A2B3C4D) and the email you booked with.' }, { status: 400 });
    }

    // light throttle: one request per order per 10 minutes
    const last = recent.get(prefix);
    if (last && Date.now() - last < 10 * 60 * 1000) return OK;
    recent.set(prefix, Date.now());

    const { data } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .gte('id', `${prefix}-0000-0000-0000-000000000000`)
      .lte('id', `${prefix}-ffff-ffff-ffff-ffffffffffff`)
      .limit(2);
    const r = data && data.length === 1 ? data[0] : null;
    if (!r || String(r.email || '').trim().toLowerCase() !== email || r.status !== 'confirmed') return OK;

    const totes = expectedEquipment(r).totes;
    const amount = taxed(weeks * totes * POLICY.extensionPerToteWeek);
    await Promise.all([emailExtensionAck(r, weeks), emailOwnerExtension(r, weeks, amount)]);
    return OK;
  } catch (err) {
    console.error('extend request error', err);
    return NextResponse.json({ error: 'Something went wrong. Please reply to your confirmation email instead.' }, { status: 500 });
  }
}
