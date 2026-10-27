import './globals.css';
import LegalBar from '../components/LegalBar';

export const metadata = {
  metadataBase: new URL('https://midlandmovingbox.com'),
  title: 'Midland Moving Box Co. — Reusable Moving Totes, Delivered',
  description:
    'Rent heavy-duty reusable moving totes and dollies in Midland & Odessa, TX. We deliver, you pack, we pick up. Reserve online in 2 minutes.',
  openGraph: {
    title: 'Midland Moving Box Co. — Reusable Moving Totes, Delivered',
    description: 'Skip the cardboard. Heavy-duty moving totes delivered in Midland & Odessa, TX.',
    url: 'https://midlandmovingbox.com',
    siteName: 'Midland Moving Box Co.',
    type: 'website',
  },
};

const squareSdkSrc =
  process.env.SQUARE_ENV === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script src={squareSdkSrc} async></script>
      </head>
      <body>
        {children}
        <LegalBar />
      </body>
    </html>
  );
}
