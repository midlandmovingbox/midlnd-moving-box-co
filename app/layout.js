import './globals.css';

export const metadata = {
  title: 'Midland Moving Box Co. — Reusable Moving Totes, Delivered',
  description: 'Heavy-duty moving totes delivered to your door in Midland & Odessa, TX.',
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
      <body>{children}</body>
    </html>
  );
}
