// Server-side only. Equipment photos live in a private Supabase Storage bucket.
import { supabaseAdmin } from './supabaseAdmin';

export const PHOTO_BUCKET = 'equipment-photos';
const UUID = /^[0-9a-f-]{36}$/i;

export function isValidReservationId(id) {
  return UUID.test(String(id || ''));
}

export async function uploadPhoto(reservationId, kind, file) {
  const ext = 'jpg';
  const path = `${reservationId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error('Photo upload failed: ' + error.message);
  return path;
}

// Keep only paths that belong to this reservation.
export function cleanPaths(reservationId, paths) {
  return (Array.isArray(paths) ? paths : []).filter((p) => typeof p === 'string' && p.startsWith(reservationId + '/') && !p.includes('..')).slice(0, 10);
}

// Downloads photos and returns them in the shape Resend expects for email attachments.
export async function photoAttachments(paths, prefix) {
  const out = [];
  let n = 1;
  for (const p of paths || []) {
    const { data, error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).download(p);
    if (error || !data) continue;
    out.push({ filename: `${prefix}-${n++}.jpg`, content: Buffer.from(await data.arrayBuffer()).toString('base64') });
  }
  return out;
}

// Adds temporary viewing links (1 hour) so the admin page can show thumbnails.
export async function withPhotoUrls(row) {
  const sign = async (paths) => {
    if (!Array.isArray(paths) || !paths.length) return [];
    const { data } = await supabaseAdmin.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
    return (data || []).map((d) => d.signedUrl).filter(Boolean);
  };
  return {
    ...row,
    delivered_photo_urls: await sign(row.delivered_photos),
    picked_up_photo_urls: await sign(row.picked_up_photos),
  };
}
