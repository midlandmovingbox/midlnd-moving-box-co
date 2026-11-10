import ContentPage, { PackageTable, faqSchema } from '../../components/ContentPage';
import { SITE_URL } from '../../lib/site';

export const metadata = {
  title: 'Moving Tote Rental vs. Cardboard Boxes: Which Is Better? | Midland Moving Box Co.',
  description:
    'Should you rent plastic moving totes or buy cardboard boxes? A plain comparison of cost, effort, cleanup and protection, plus how tote rental works in Midland & Odessa, TX.',
  alternates: { canonical: '/moving-tote-rental-vs-cardboard-boxes' },
};

const FAQ = [
  { q: 'What is moving tote rental?', a: 'Moving tote rental means you rent reusable plastic totes (and usually a dolly) for the length of your move instead of buying cardboard boxes. The totes are delivered to you, you pack and move, and the rental company picks them up when you are finished.' },
  { q: 'Do I need tape with rented totes?', a: 'No. Moving totes have lids, so there is no tape to buy and no boxes to flatten or throw away afterward.' },
  { q: 'Is it worth renting moving boxes instead of buying cardboard?', a: 'Renting is worth considering if you want to skip buying, taping, breaking down and disposing of cardboard, and if you want sturdier containers that stack and hold up to rain and heavy loads. Buying can make sense for very long-term storage.' },
  { q: 'Where can I rent moving totes in Midland and Odessa, TX?', a: 'Midland Moving Box Co. rents moving totes and dollies in Midland and Odessa, TX, with delivery to your door and pickup when you are done. Packages start at $109 for a two-week rental.' },
];

export default function Page() {
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Moving tote rental vs. cardboard boxes',
    author: { '@type': 'Organization', name: 'Midland Moving Box Co.' },
    publisher: { '@type': 'Organization', name: 'Midland Moving Box Co.', url: SITE_URL },
    mainEntityOfPage: SITE_URL + '/moving-tote-rental-vs-cardboard-boxes',
  };
  return (
    <ContentPage schema={[article, faqSchema(FAQ)]}>
      <h1 style={{ marginTop: 16 }}>Moving tote rental vs. cardboard boxes</h1>
      <p>
        Most people picture moving boxes as cardboard they buy, tape, and later throw away. Moving tote rental is a
        simpler way to do it: you rent sturdy reusable plastic totes for the length of your move, then hand them back.
        Here's a plain comparison.
      </p>
      <img src="/tote-vs-box.jpg" alt="A Midland Moving Box Co. tote next to a taped cardboard box" style={{ width: '100%', maxWidth: 640, height: 'auto', borderRadius: 6, margin: '8px 0 16px' }} />

      <table className="fee-table"><tbody>
        <tr><td><strong>Setup</strong></td><td style={{ textAlign: 'left', fontWeight: 400 }}>Totes: delivered to your door. Cardboard: you buy or hunt for boxes.</td></tr>
        <tr><td><strong>Closing up</strong></td><td style={{ textAlign: 'left', fontWeight: 400 }}>Totes: lids, no tape. Cardboard: tape every box.</td></tr>
        <tr><td><strong>Strength</strong></td><td style={{ textAlign: 'left', fontWeight: 400 }}>Totes: rigid and stackable. Cardboard: can crush or collapse when heavy or wet.</td></tr>
        <tr><td><strong>Cleanup</strong></td><td style={{ textAlign: 'left', fontWeight: 400 }}>Totes: we pick them up. Cardboard: you flatten and dispose of every box.</td></tr>
        <tr><td><strong>Cost</strong></td><td style={{ textAlign: 'left', fontWeight: 400 }}>Totes: a flat rental price for two weeks. Cardboard: cost depends on how many boxes and supplies you buy.</td></tr>
      </tbody></table>

      <h2>How moving tote rental works in Midland &amp; Odessa</h2>
      <p>
        Midland Moving Box Co. delivers clean, sanitized totes and dollies to your door in Midland and Odessa, TX. You
        pack and move over two weeks, then leave the empty totes by the door and we pick them up.
      </p>
      <PackageTable />
      <p>
        See the details for <a href="/moving-box-rental-midland-tx" style={{ textDecoration: 'underline' }}>Midland</a> or{' '}
        <a href="/moving-box-rental-odessa-tx" style={{ textDecoration: 'underline' }}>Odessa</a>, or check{' '}
        <a href="/fees" style={{ textDecoration: 'underline' }}>Fees &amp; Charges</a> for everything that can apply.
      </p>

      <h2>Common questions</h2>
      {FAQ.map((f) => (
        <div key={f.q}>
          <h3 style={{ fontSize: 18, margin: '18px 0 6px' }}>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </ContentPage>
  );
}
