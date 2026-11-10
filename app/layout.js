import './globals.css';
import LegalBar from '../components/LegalBar';

export const metadata = {
  metadataBase: new URL('https://midlandmovingbox.com'),
  title: {
    default: 'Moving Box & Tote Rentals in Midland & Odessa, TX | Midland Moving Box Co.',
    template: '%s',
  },
  description:
    'Rent reusable plastic moving totes and dollies in Midland & Odessa, TX. Delivered to your door, picked up when you are done. No cardboard, no tape. Packages from $109.',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Moving Box & Tote Rentals in Midland & Odessa, TX | Midland Moving Box Co.',
    description: 'Skip the cardboard. Rent heavy-duty moving totes, delivered in Midland & Odessa, TX.',
    url: 'https://midlandmovingbox.com',
    siteName: 'Midland Moving Box Co.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
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
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Figtree:wght@400;500;600;700;800&display=swap"
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
