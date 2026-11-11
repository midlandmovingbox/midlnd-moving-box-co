import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

// Add or delete a time/mileage entry. Deliver/pickup also write entries through lib/tripLog.
export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await request.json();
  if (body.deleteId) {
    const { error } = await supabaseAdmin.from('trip_log').delete().eq('id', body.deleteId);
    if (error) return NextResponse.json({ error: 'Could not delete' }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  const minutes = Math.max(0, Math.round(Number(body.minutes) || 0));
  const miles = Math.max(0, Number(body.miles) || 0);
  if (!minutes && !miles) return NextResponse.json({ error: 'Enter minutes and/or miles' }, { status: 400 });
  const { error } = await supabaseAdmin.from('trip_log').insert({
    kind: ['delivery', 'pickup', 'other'].includes(body.kind) ? body.kind : 'other',
    minutes, miles,
    note: String(body.note || '').slice(0, 200) || null,
    logged_on: /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : new Date().toISOString().slice(0, 10),
  });
  if (error) return NextResponse.json({ error: 'Could not save. Has update-dashboard.sql been run?' }, { status: 500 });
  return NextResponse.json({ success: true });
}
