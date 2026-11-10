import ContentPage, { PackageTable, faqSchema } from '../../components/ContentPage';
import { SITE_URL } from '../../lib/site';

export const metadata = {
  title: 'Moving Box Rentals in Odessa, TX | Midland Moving Box Co.',
  description: "Rent reusable plastic moving totes and dollies in Odessa, TX. Delivered to your door and picked up when you're done. Packages from $109 for two weeks.",
  alternates: { canonical: '/moving-box-rental-odessa-tx' },
};

const FAQ = [
  {
    "q": "Do you deliver moving totes in Odessa?",
    "a": "Yes. We deliver reusable plastic moving totes and dollies to Odessa, TX addresses and pick them up after your move. Odessa deliveries carry a small travel charge each way, and the reservation form shows your exact fee as soon as you enter your addresses, before you submit anything."
  },
  {
    "q": "How much does it cost to rent moving boxes in Odessa?",
    "a": "Rental packages start at $109 for two weeks: the Small Move is $109 (20 totes, 1 dolly), the Home Move is $179 (40 totes, 2 dollies) and the Big Move is $239 (60 totes, 3 dollies). Texas sales tax and any delivery travel charge are added and shown before you submit."
  },
  {
    "q": "Can I move between Odessa and Midland?",
    "a": "Yes. You can enter a different address for where you're moving from and where you're moving to, so a move between Odessa and Midland works fine."
  }
];

export default function Page() {
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Moving tote and dolly rental in Odessa, TX',
    serviceType: 'Moving box rental',
    provider: { '@type': 'LocalBusiness', name: 'Midland Moving Box Co.', url: SITE_URL },
    areaServed: { '@type': 'City', name: 'Odessa, TX' },
    url: SITE_URL + '/moving-box-rental-odessa-tx',
  };
  return (
    <ContentPage schema={[service, faqSchema(FAQ)]}>
      <h1 style={{ marginTop: 16 }}>Moving box rentals in Odessa, TX</h1>
      <p>Midland Moving Box Co. rents reusable plastic moving totes and dollies, delivered to your door in Odessa and picked up when you're done. No cardboard to buy, no tape, and nothing to flatten or throw away.</p>

      <h2>Rental packages</h2>
      <PackageTable />
      <p>Every rental is two weeks. Packages include delivery and pickup, and the totes arrive clean and sanitized. Extra totes, extra dollies and moving blankets can be added when you reserve.</p>

      <h2>How it works</h2>
      <ol>
        <li><strong>We deliver.</strong> Your clean totes and dolly arrive at your door on the morning you choose.</li>
        <li><strong>You pack and move.</strong> Use the totes for two weeks. They have lids, so there's no tape, and they stack cleanly.</li>
        <li><strong>We pick up.</strong> Leave the empty totes at the curb or inside the door and we collect them.</li>
      </ol>

      <h2>Delivery in Odessa</h2>
      <p>Odessa deliveries carry a small travel charge each way. You'll see your exact fee as soon as you enter your addresses on the reservation form, before you submit anything, and your card isn't charged until we approve your request.</p>

      <h2>Moving to or from Midland?</h2>
      <p>You can enter a different address for where you're moving from and where you're moving to, so an Odessa-to-Midland move is handled in one reservation. See our <a href="/moving-box-rental-midland-tx" style={{ textDecoration: 'underline' }}>Midland moving box rentals</a> page for Midland details.</p>

      <h2>Odessa moving box questions</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3 style={{ fontSize: 18, margin: '18px 0 6px' }}>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
      <p>New to renting totes? Read <a href="/moving-tote-rental-vs-cardboard-boxes" style={{ textDecoration: 'underline' }}>moving totes vs. cardboard boxes</a>. See every charge on our <a href="/fees" style={{ textDecoration: 'underline' }}>Fees &amp; Charges</a> page.</p>
    </ContentPage>
  );
}
