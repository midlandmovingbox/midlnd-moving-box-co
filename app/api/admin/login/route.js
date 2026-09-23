import { NextResponse } from 'next/server';
import { checkPassword, sessionCookieHeader } from '../../../../lib/adminAuth';

export async function POST(request) {
  const { password } = await request.json();
  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', sessionCookieHeader());
  return res;
}
