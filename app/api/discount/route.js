import { NextResponse } from 'next/server';
import { resolveCode } from '../../../lib/discounts';
import { describeCode } from '../../../lib/discountMath';

// Lets the booking page check a code. Only reveals what the customer needs to see the discount.
export async function POST(request) {
  const { code } = await request.json();
  const r = await resolveCode(code);
  if (r.error) return NextResponse.json({ ok: false, error: r.error });
  const { row } = r;
  return NextResponse.json({
    ok: true,
    code: { code: row.code, type: row.type, value: Number(row.value), applies_to: row.applies_to },
    description: describeCode(row),
  });
}
