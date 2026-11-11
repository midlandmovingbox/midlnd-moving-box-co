'use client';

import { useEffect, useState } from 'react';

const money = (n) => '$' + Number(n || 0).toFixed(2);
const blank = { code: '', source: '', type: 'percent', value: '', appliesTo: 'total', maxUses: '', expiresOn: '' };

function describe(c) {
  if (c.type === 'amount') return `${money(c.value)} off`;
  return `${c.value}% off ${c.applies_to === 'base' ? 'package price' : 'total'}`;
}

export default function Codes() {
  const [codes, setCodes] = useState(null);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/admin/codes');
    const j = await res.json();
    if (j.missingTable) { setMissing(true); setCodes([]); return; }
    setCodes(j.codes || []);
  }
  useEffect(() => { load(); }, []);

  async function post(body, ok) {
    setMsg('');
    const res = await fetch('/api/admin/codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error || 'Something went wrong'); return false; }
    setMsg(ok);
    await load();
    return true;
  }

  if (!codes) return <p style={{ color: '#8a8676' }}>Loading…</p>;
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://midlandmovingbox.com';

  return (
    <div>
      {missing && <div className="pay-error">One-time setup needed: run <strong>update-codes.sql</strong> in Supabase (SQL Editor), then reload this tab.</div>}
      {msg && <div className="quote-box" style={{ marginBottom: 12 }}>{msg}</div>}

      <div className="dash-card">
        <div className="dash-label">New code</div>
        <div className="charge-form" style={{ alignItems: 'flex-end' }}>
          <label style={{ fontSize: 12 }}>Code<br /><input placeholder="e.g. REALTOR10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></label>
          <label style={{ fontSize: 12 }}>Source (who gets it)<br /><input placeholder="e.g. Smith Realty cards" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></label>
          <label style={{ fontSize: 12 }}>Type<br />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent off</option><option value="amount">Dollar amount off</option>
            </select>
          </label>
          <label style={{ fontSize: 12 }}>{form.type === 'percent' ? 'Percent' : 'Dollars'}<br /><input className="amount" type="number" step="any" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
          {form.type === 'percent' && (
            <label style={{ fontSize: 12 }}>Applies to<br />
              <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}>
                <option value="total">Total price (before tax)</option><option value="base">Base package price only</option>
              </select>
            </label>
          )}
          <label style={{ fontSize: 12 }}>Max uses<br /><input className="amount" type="number" placeholder="no limit" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></label>
          <label style={{ fontSize: 12 }}>Expires<br /><input type="date" value={form.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} /></label>
          <button className="btn-charge" onClick={async () => { if (await post({ action: 'create', ...form }, 'Code created.')) setForm(blank); }}>Create code</button>
        </div>
        <div className="dash-sub">&quot;Total price&quot; = package + add-ons + delivery area fees. &quot;Base&quot; = just the package price. Discounts come off before sales tax. A percent code is figured on the price at booking; a delivery quote added later isn&apos;t discounted.</div>
      </div>

      <h3 className="dash-h">Your codes</h3>
      {codes.length === 0 && <p style={{ color: '#8a8676' }}>No codes yet.</p>}
      {codes.map((c) => {
        const expired = c.expires_on && c.expires_on < new Date().toLocaleDateString('en-CA');
        const used = c.max_uses != null && c.uses >= c.max_uses;
        const state = !c.active ? 'Off' : expired ? 'Expired' : used ? 'Used up' : 'Live';
        return (
          <div key={c.id} className="dash-card" style={{ marginBottom: 10, opacity: state === 'Live' ? 1 : 0.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: 18 }}>{c.code}</strong> <span className="mono" style={{ fontSize: 11 }}>{state}</span>
                <div className="dash-sub">{describe(c)}{c.source ? ` · ${c.source}` : ''}</div>
                <div className="dash-sub">{c.max_uses != null ? `${c.uses} of ${c.max_uses} uses` : `${c.uses} use${c.uses === 1 ? '' : 's'}, no limit`}{c.expires_on ? ` · expires ${c.expires_on}` : ''}</div>
                <div className="dash-sub"><strong>{c.orders}</strong> paid order{c.orders === 1 ? '' : 's'} · {money(c.collected)} collected (after refunds) · {money(c.discountGiven)} discounted</div>
                <div className="dash-sub">Link for cards/QR: {base}/book?code={c.code}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <button className="btn-decline" onClick={() => post({ action: 'toggle', id: c.id, active: !c.active }, c.active ? 'Code turned off.' : 'Code turned on.')}>{c.active ? 'Turn off' : 'Turn on'}</button>
                <button className="btn-decline" onClick={() => confirm(`Delete ${c.code}?`) && post({ action: 'delete', id: c.id }, 'Deleted.')}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
