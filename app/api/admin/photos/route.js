import { NextResponse } from 'next/server';
import { isAdminRequest } from '../../../../lib/adminAuth';
import { uploadPhoto, isValidReservationId } from '../../../../lib/photos';

// Uploads ONE photo (the admin page sends them one at a time, already shrunk). Returns its storage path.
export async function POST(request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const form = await request.formData();
    const reservationId = String(form.get('reservationId') || '');
    const kind = String(form.get('kind') || '');
    const file = form.get('photo');
    if (!isValidReservationId(reservationId) || !['delivered', 'pickup'].includes(kind) || !file || typeof file === 'string') {
      return NextResponse.json({ error: 'Bad upload' }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Photo is too large' }, { status: 400 });
    const path = await uploadPhoto(reservationId, kind, file);
    return NextResponse.json({ path });
  } catch (err) {
    console.error('photo upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
