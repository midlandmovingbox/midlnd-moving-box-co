import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { computeStats } from '../../../../lib/stats';

export async function GET(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const range = new URL(request.url).searchParams.get('range') || 'month';

  const [{ data: reservations, error: e1 }, { data: charges, error: e2 }] = await Promise.all([
    supabaseAdmin.from('reservations').select('*'),
    supabaseAdmin.from('charges').select('*'),
  ]);
  if (e1 || e2) return NextResponse.json({ error: 'Could not load data' }, { status: 500 });

  // These two tables come from update-dashboard.sql. If it hasn't been run yet, say so instead of failing.
  const { data: settingsRow, error: e3 } = await supabaseAdmin.from('business_settings').select('*').eq('id', 1).maybeSingle();
  const { data: trips, error: e4 } = await supabaseAdmin.from('trip_log').select('*');
  const missingTables = !!(e3 || e4);

  const stats = computeStats({ reservations, charges, trips: trips || [], settings: settingsRow, range });
  return NextResponse.json({ stats, missingTables });
}
