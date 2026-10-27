'use client';

import { usePathname } from 'next/navigation';

// Small footer with legal links, shown on every page except the homepage (which has its own
// footer with the same links) and the private admin page.
export default function LegalBar() {
  const path = usePathname();
  if (path === '/' || path.startsWith('/admin')) return null;
  return (
    <div className="legal-bar">
      <span>© 2026 Midland Moving Box Co.</span>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms &amp; Conditions</a>
      <a href="/fees">Fees &amp; Charges</a>
    </div>
  );
}
