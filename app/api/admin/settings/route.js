import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const FIELDS = ['totes_owned', 'tote_cost_total', 'dollies_owned', 'dolly_cost_total', 'mpg', 'gas_price', 'hourly_rate', 'fee_pct', 'fee_flat'];

export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json();
  const row = { id: 1 };
  for (const k of FIELDS) {
    if (body[k] === undefined || body[k] === '') continue;
    const n = Number(body[k]);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `Bad value for ${k}` }, { status: 400 });
    row[k] = n;
  }
  const { error } = await supabaseAdmin.from('business_settings').upsert(row);
  if (error) return NextResponse.json({ error: 'Could not save. Has update-dashboard.sql been run?' }, { status: 500 });
  return NextResponse.json({ success: true });
}
