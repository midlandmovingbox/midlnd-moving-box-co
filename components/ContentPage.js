import SiteLogo from './SiteLogo';
import JsonLd from './JsonLd';
import { PACKAGES } from '../lib/constants';

export function PackageTable() {
  return (
    <table className="fee-table"><tbody>
      {Object.values(PACKAGES).map((p) => (
        <tr key={p.name}>
          <td><strong>{p.name}</strong><br />{p.totes} totes · {p.dollies} dolly{p.dollies > 1 ? 's' : ''} · two-week rental</td>
          <td>${p.price}</td>
        </tr>
      ))}
    </tbody></table>
  );
}

export function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

// Shared shell for the search-landing pages: logo, content, reserve button.
export default function ContentPage({ children, schema = [] }) {
  return (
    <main className="legal-page">
      {schema.map((s, i) => <JsonLd key={i} data={s} />)}
      <div style={{ background: 'var(--ink)', display: 'inline-block', padding: '10px 14px', borderRadius: 6 }}>
        <a href="/"><SiteLogo height={44} /></a>
      </div>
      <div style={{ marginTop: 14 }}>
        <a href="/" style={{ fontSize: 14, textDecoration: 'underline' }}>← Back to home</a>
      </div>
      {children}
      <p style={{ marginTop: 32 }}>
        <a className="btn-primary" href="/book" style={{ display: 'inline-block' }}>Reserve in 2 Minutes →</a>
      </p>
    </main>
  );
}
