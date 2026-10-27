import { ImageResponse } from 'next/og';
import { LOGO_DATA_URI } from '../lib/logoData';

export const runtime = 'edge';
export const alt = 'Midland Moving Box Co. - reusable moving totes delivered in Midland & Odessa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#1D1D1B', color: '#F5F2EA', display: 'flex', alignItems: 'center', padding: 80 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 1.0 }}>SKIP THE CARDBOARD.</div>
          <div style={{ fontSize: 38, marginTop: 24, color: '#D3B189' }}>Reusable moving totes delivered in Midland &amp; Odessa, TX</div>
          <div style={{ marginTop: 44, background: '#C5512D', color: '#fff', fontSize: 34, fontWeight: 700, padding: '14px 30px', alignSelf: 'flex-start', borderRadius: 6 }}>RESERVE IN 2 MINUTES</div>
        </div>
        <img src={LOGO_DATA_URI} width={360} height={175} style={{ marginLeft: 40 }} />
      </div>
    ),
    size
  );
}
