import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { loadCodeStats } from '../../../../lib/codeStats';

const FIELDS = ['name', 'company', 'phone', 'email', 'cards_distributed', 'notes'];
const clean = (b) => Object.fromEntries(FIELDS.map((f) => [f, String(b[f] || '').trim().slice(0, f === 'notes' ? 2000 : 200) || null]));

export async function GET(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: refs, error } = await supabaseAdmin.from('referrers').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ missingTable: true, referrers: [] });
  const { codes } = await loadCodeStats();
  const out = refs.map((r) => {
    const mine = codes.filter((c) => c.referrer_id === r.id);
    return {
      ...r,
      codes: mine.map((c) => ({ id: c.id, code: c.code, active: c.active, uses: c.uses })),
      uses: mine.reduce((a, c) => a + c.uses, 0),
      orders: mine.reduce((a, c) => a + c.orders, 0),
      collected: Math.round(mine.reduce((a, c) => a + c.collected, 0) * 100) / 100,
      lastUsed: mine.reduce((a, c) => (c.lastUsed && (!a || c.lastUsed > a) ? c.lastUsed : a), null),
    };
  });
  return NextResponse.json({ referrers: out });
}

export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const b = await request.json();
  if (b.action === 'delete') {
    await supabaseAdmin.from('discount_codes').update({ referrer_id: null }).eq('referrer_id', b.id);
    await supabaseAdmin.from('referrers').delete().eq('id', b.id);
    return NextResponse.json({ success: true });
  }
  const row = clean(b);
  if (!row.name && !row.company) return NextResponse.json({ error: 'Enter at least a name or company' }, { status: 400 });
  if (b.action === 'update') {
    const { error } = await supabaseAdmin.from('referrers').update(row).eq('id', b.id);
    if (error) return NextResponse.json({ error: 'Could not save' }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  const { data, error } = await supabaseAdmin.from('referrers').insert(row).select('id').single();
  if (error) return NextResponse.json({ error: 'Could not save. Has update-codes.sql been run?' }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id });
}
