import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: reservations, error: resError } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false });

  if (resError) {
    return NextResponse.json({ error: 'Could not load reservations' }, { status: 500 });
  }

  const { data: charges, error: chargeError } = await supabaseAdmin
    .from('charges')
    .select('*')
    .order('created_at', { ascending: false });

  if (chargeError) {
    return NextResponse.json({ error: 'Could not load charges' }, { status: 500 });
  }

  const withCharges = reservations.map((r) => ({
    ...r,
    extra_charges: charges.filter((c) => c.reservation_id === r.id),
  }));

  return NextResponse.json({ reservations: withCharges });
}
