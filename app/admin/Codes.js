'use client';

import { useEffect, useState } from 'react';

const money = (n) => '$' + Number(n || 0).toFixed(2);
const blank = { code: '', source: '', type: 'percent', value: '', appliesTo: 'rentals', referrerId: '', maxUses: '', expiresOn: '' };

function describe(c) {
  if (c.type === 'amount') return `${money(c.value)} off`;
  return `${c.value}% off ${c.applies_to === 'base' ? 'package price only' : c.applies_to === 'rentals' ? 'rented items (no delivery fees)' : 'total price'}`;
}

export default function Codes() {
  const [codes, setCodes] = useState(null);
  const [referrers, setReferrers] = useState([]);
  const [tab, setTab] = useState('codes'); // codes | referrers
  const [openRef, setOpenRef] = useState(null); // referrer id (detail page) or 'new'
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/admin/codes');
    const j = await res.json();
    if (j.missingTable) { setMissing(true); setCodes([]); return; }
    setCodes(j.codes || []);
    setReferrers(j.referrers || []);
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

  const tabs = (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      <button className={`status-tab ${tab === 'codes' ? 'active' : ''}`} onClick={() => { setTab('codes'); setOpenRef(null); }}>Codes</button>
      <button className={`status-tab ${tab === 'referrers' ? 'active' : ''}`} onClick={() => setTab('referrers')}>Referrers ({referrers.length})</button>
    </div>
  );
  if (tab === 'referrers') {
    return (
      <div>
        {tabs}
        {msg && <div className="quote-box" style={{ marginBottom: 12 }}>{msg}</div>}
        <Referrers openId={openRef} setOpenId={setOpenRef} onChanged={load} setMsg={setMsg} />
      </div>
    );
  }

  return (
    <div>
      {tabs}
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
                <option value="rentals">Rented items only (package + add-ons, no delivery fees)</option>
                <option value="total">Everything (rentals + delivery fees)</option>
                <option value="base">Base package price only</option>
              </select>
            </label>
          )}
          <label style={{ fontSize: 12 }}>Referrer (optional)<br />
            <select value={form.referrerId} onChange={(e) => setForm({ ...form, referrerId: e.target.value })}>
              <option value="">— none —</option>
              {referrers.map((r) => <option key={r.id} value={r.id}>{r.name || r.company}{r.name && r.company ? ` (${r.company})` : ''}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12 }}>Max uses<br /><input className="amount" type="number" placeholder="no limit" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></label>
          <label style={{ fontSize: 12 }}>Expires<br /><input type="date" value={form.expiresOn} onChange={(e) => setForm({ ...form, expiresOn: e.target.value })} /></label>
          <button className="btn-charge" onClick={async () => { if (await post({ action: 'create', ...form }, 'Code created.')) setForm(blank); }}>Create code</button>
        </div>
        <div className="dash-sub">&quot;Rented items&quot; = package + add-ons. &quot;Everything&quot; also includes delivery area fees. &quot;Base&quot; = just the package price. Discounts come off before sales tax. A percent code is figured on the price at booking; a delivery quote added later isn&apos;t discounted.</div>
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
                {(() => { const rf = referrers.find((x) => x.id === c.referrer_id); return rf ? <div className="dash-sub">Referrer: <a href="#" onClick={(e) => { e.preventDefault(); setTab('referrers'); setOpenRef(rf.id); }}>{rf.name || rf.company}</a></div> : null; })()}
                <div className="dash-sub">Link for cards/QR: {base}/book?code={c.code}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <select value={c.referrer_id || ''} onChange={(e) => post({ action: 'assign', id: c.id, referrerId: e.target.value }, 'Referrer updated.')} style={{ maxWidth: 130 }}>
                  <option value="">No referrer</option>
                  {referrers.map((r) => <option key={r.id} value={r.id}>{r.name || r.company}</option>)}
                </select>
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


const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const blankRef = { name: '', company: '', phone: '', email: '', cards_distributed: '', notes: '' };

function Referrers({ openId, setOpenId, onChanged, setMsg }) {
  const [list, setList] = useState(null);
  const [sort, setSort] = useState('orders'); // orders | recent | name
  const [f, setF] = useState(blankRef);
  const [err, setErr] = useState('');

  async function load() {
    const j = await (await fetch('/api/admin/referrers')).json();
    setList(j.referrers || []);
  }
  useEffect(() => { load(); }, []);

  async function send(body) {
    setErr('');
    const res = await fetch('/api/admin/referrers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) { setErr(j.error || 'Something went wrong'); return null; }
    await load(); onChanged();
    return j;
  }

  if (!list) return <p style={{ color: '#8a8676' }}>Loading…</p>;
  const label = (r) => r.name || r.company || 'Unnamed';

  // Detail page for one referrer (or the new-referrer form)
  if (openId) {
    const r = openId === 'new' ? null : list.find((x) => x.id === openId);
    const cur = r ? { ...blankRef, ...Object.fromEntries(Object.keys(blankRef).map((k) => [k, r[k] || ''])) } : blankRef;
    return (
      <RefDetail key={openId} r={r} initial={cur} err={err}
        onBack={() => { setOpenId(null); setErr(''); }}
        onSave={async (vals) => {
          const j = await send(r ? { action: 'update', id: r.id, ...vals } : { action: 'create', ...vals });
          if (j) { setMsg('Saved.'); setOpenId(null); }
        }}
        onDelete={async () => { if (confirm(`Delete ${label(r)}? Their codes stay, just unlinked.`)) { await send({ action: 'delete', id: r.id }); setOpenId(null); } }} />
    );
  }

  const rows = [...list].sort((a, b) => {
    if (sort === 'orders') return b.orders - a.orders || b.uses - a.uses;
    if (sort === 'recent') return String(b.lastUsed || '').localeCompare(String(a.lastUsed || ''));
    return label(a).localeCompare(label(b));
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="btn-charge" onClick={() => setOpenId('new')}>+ Add referrer</button>
        <span style={{ fontSize: 12, color: '#8a8676', marginLeft: 'auto' }}>Sort by</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="orders">Most referred (paid orders)</option>
          <option value="recent">Most recently used</option>
          <option value="name">Name</option>
        </select>
      </div>
      {rows.length === 0 && <p style={{ color: '#8a8676' }}>No referrers yet. Add one, then attach their codes from the Codes tab.</p>}
      {rows.map((r) => (
        <div key={r.id} className="dash-card" style={{ marginBottom: 10 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setOpenId(r.id); }} style={{ fontSize: 17, fontWeight: 600 }}>{label(r)}</a>
          {r.name && r.company && <span className="dash-sub"> · {r.company}</span>}
          <div className="dash-sub"><strong>{r.orders}</strong> paid order{r.orders === 1 ? '' : 's'} · {r.uses} use{r.uses === 1 ? '' : 's'} · {money(r.collected)} collected · last used {fmtDate(r.lastUsed)}</div>
          <div className="dash-sub">Codes: {r.codes.length ? r.codes.map((c) => c.code).join(', ') : 'none yet'}</div>
        </div>
      ))}
    </div>
  );
}

function RefDetail({ r, initial, err, onBack, onSave, onDelete }) {
  const [v, setV] = useState(initial);
  const inp = (k, label, type = 'text') => (
    <label style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>{label}<br />
      <input type={type} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} style={{ width: '100%' }} />
    </label>
  );
  return (
    <div className="dash-card">
      <button className="btn-decline" onClick={onBack} style={{ marginBottom: 12 }}>← Back to referrers</button>
      <h3 className="dash-h" style={{ marginTop: 0 }}>{r ? (r.name || r.company) : 'New referrer'}</h3>
      {err && <div className="pay-error">{err}</div>}
      {inp('name', 'Name')}
      {inp('company', 'Company')}
      {inp('phone', 'Phone', 'tel')}
      {inp('email', 'Email', 'email')}
      {inp('cards_distributed', 'Codes / cards distributed (e.g. "100 cards, May 2026")')}
      <label style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>Other info<br />
        <textarea rows={4} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} style={{ width: '100%' }} />
      </label>
      {r && (
        <div className="dash-sub" style={{ marginBottom: 12 }}>
          Codes: {r.codes.length ? r.codes.map((c) => `${c.code} (${c.uses} use${c.uses === 1 ? '' : 's'})`).join(', ') : 'none attached. Attach one from the Codes tab.'}
          <br />{r.orders} paid order{r.orders === 1 ? '' : 's'} · {money(r.collected)} collected · last used {fmtDate(r.lastUsed)}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-charge" onClick={() => onSave(v)}>Save</button>
        {r && <button className="btn-decline" onClick={onDelete}>Delete referrer</button>}
      </div>
    </div>
  );
}
