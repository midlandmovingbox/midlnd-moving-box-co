export const metadata = {
  title: 'Privacy Policy — Midland Moving Box Co.',
  description: 'How Midland Moving Box Co. collects, uses and protects your information.',
};

import SiteLogo from '../../components/SiteLogo';

export default function Privacy() {
  return (
    <main className="legal-page">
      <div style={{ background: 'var(--ink)', display: 'inline-block', padding: '10px 14px', borderRadius: 6 }}>
        <SiteLogo height={44} />
      </div>
      <div style={{ marginTop: 14 }}>
        <a href="/" style={{ fontSize: 14, textDecoration: 'underline' }}>← Back to home</a>
      </div>
      <h1 style={{ marginTop: 16 }}>Privacy Policy</h1>
      <div className="updated">Last updated: October 27, 2026</div>

      <p>
        Midland Moving Box Co. ("we," "us") rents reusable moving totes in Midland and Odessa, Texas. This page
        explains what information we collect when you use this website and make a reservation, and what we do
        with it.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Reservation details:</strong> your name, phone number, email address, the addresses you move from and to, your dates, the package and add-ons you choose, and any notes you write.</li>
        <li><strong>Payment card:</strong> your card is entered into a secure form provided by Square. We never see or store your full card number. We keep only the card brand, the last four digits, and Square's reference IDs so we can charge the card as described in our Terms.</li>
        <li><strong>Agreement record:</strong> the date and time you agreed to our Terms, the version you agreed to, and your IP address, kept as proof of your authorization.</li>
        <li><strong>Technical data:</strong> basic information your browser sends to our hosting provider, such as IP address and device type, used to run and secure the site.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To review, confirm, deliver and pick up your rental.</li>
        <li>To charge your card for the rental and for any fees you agreed to in our Terms.</li>
        <li>To email or call you about your reservation, including confirmations, receipts and questions.</li>
        <li>To keep business, tax and dispute records.</li>
        <li>To prevent fraud and keep the site secure.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>

      <h2>Who we share it with</h2>
      <p>We share information only with the services we need to run the business:</p>
      <ul>
        <li><strong>Square</strong> processes and stores your card and handles payments.</li>
        <li><strong>Supabase</strong> stores our reservation records.</li>
        <li><strong>Vercel</strong> hosts this website.</li>
        <li><strong>Resend</strong> sends our confirmation and receipt emails.</li>
        <li><strong>Geoapify</strong> suggests addresses as you type. The partial address you type is sent to them to return suggestions.</li>
      </ul>
      <p>We may also share information if the law requires it or to protect our rights in a dispute.</p>

      <h2>Cookies</h2>
      <p>
        We use only what the site needs to work. Square's payment form may set its own cookies for security
        and fraud prevention. We do not run advertising or tracking cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep reservation and payment records as long as needed for the rental, taxes, and any disputes, and
        as required by law.
      </p>

      <h2>Security</h2>
      <p>
        Our site uses HTTPS, our database is access-restricted, and card details are handled by Square. No
        system is perfectly secure, but we take reasonable steps to protect your information.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to see, correct or delete the personal information we hold about you by emailing us.
        We may need to keep some records for tax, legal or dispute reasons.
      </p>

      <h2>Children</h2>
      <p>Our services are for adults 18 and over. We do not knowingly collect information from children.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we will update the date at the top of this page.</p>

      <h2>Contact</h2>
      <p>
        Midland Moving Box Co., Midland, Texas<br />
        Email: <a href="mailto:midlandmovingbox@gmail.com" style={{ textDecoration: 'underline' }}>midlandmovingbox@gmail.com</a>
      </p>
    </main>
  );
}
