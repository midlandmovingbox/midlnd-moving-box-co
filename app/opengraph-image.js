import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Midland Moving Box Co. - reusable moving totes delivered in Midland & Odessa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#1a1a17', color: '#F5F2E8', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80 }}>
        <div style={{ color: '#F5B800', fontSize: 30, letterSpacing: 4, marginBottom: 24 }}>MIDLAND MOVING BOX CO.</div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>Skip the cardboard.</div>
        <div style={{ fontSize: 40, marginTop: 24, color: '#c9c5b8' }}>Heavy-duty moving totes, delivered in Midland &amp; Odessa, TX</div>
        <div style={{ marginTop: 48, background: '#F5B800', color: '#1a1a17', fontSize: 34, fontWeight: 700, padding: '14px 28px', alignSelf: 'flex-start' }}>Reserve in 2 minutes</div>
      </div>
    ),
    size
  );
}
