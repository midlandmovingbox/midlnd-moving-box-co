'use client';

import { useEffect, useState } from 'react';
import { PACKAGES } from '../../lib/constants';

const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const RANGES = [['month', 'This month'], ['30d', 'Last 30 days'], ['year', 'This year'], ['all', 'All time']];
const SETTING_FIELDS = [
  ['totes_owned', 'Totes owned'], ['tote_cost_total', 'Total spent on totes ($)'],
  ['dollies_owned', 'Dollies owned'], ['dolly_cost_total', 'Total spent on dollies ($)'],
  ['mpg', 'Truck MPG'], ['gas_price', 'Gas price per gallon ($)'], ['hourly_rate', 'Your hourly rate ($)'],
  ['fee_pct', 'Square fee (%)'], ['fee_flat', 'Square fee per charge ($)'],
];

function Card({ label, value, sub, tone }) {
  return (
    <div className="dash-card">
      <div className="dash-label">{label}</div>
      <div className="dash-value" style={tone ? { color: tone } : undefined}>{value}</div>
      {sub && <div className="dash-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState('month');
  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({});
  const [log, setLog] = useState({ kind: 'other', minutes: '', miles: '', note: '' });
  const [msg, setMsg] = useState('');

  async function load(r = range) {
    setError('');
    const res = await fetch(`/api/admin/stats?range=${r}`);
    const j = await res.json();
    if (!res.ok) { setError(j.error || 'Could not load'); return; }
    setData(j.stats);
    setMissing(j.missingTables);
    setSettings(j.stats.settings);
  }
  useEffect(() => { load(range); /* eslint-disable-next-line */ }, [range]);

  async function post(url, body, okMsg) {
    setMsg('');
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error || 'Something went wrong'); return false; }
    setMsg(okMsg);
    await load();
    return true;
  }

  if (error) return <div className="pay-error">{error}</div>;
  if (!data) return <p style={{ color: '#8a8676' }}>Loading…</p>;
  const p = data.period;
  const eq = data.equipment;
  const inv = data.inventory;
  const pct = eq.invested ? Math.min(100, Math.round((eq.paidOff / eq.invested) * 100)) : 0;
  const overBooked = inv.peak.totes > inv.totesOwned || inv.peak.dollies > inv.dolliesOwned;
  const overWithReq = inv.peak.totesWithRequests > inv.totesOwned || inv.peak.dolliesWithRequests > inv.dolliesOwned;

  return (
    <div>
      {missing && (
        <div className="pay-error" style={{ marginBottom: 14 }}>
          Time/mileage and settings need one-time setup: run <strong>update-dashboard.sql</strong> in Supabase (SQL Editor). Until then the numbers use default settings and can&apos;t be saved.
        </div>
      )}
      {msg && <div className="quote-box" style={{ marginBottom: 12 }}>{msg}</div>}

      <div className="status-tabs">
        {RANGES.map(([k, l]) => (
          <button key={k} className={`status-tab ${range === k ? 'active' : ''}`} onClick={() => setRange(k)}>{l}</button>
        ))}
      </div>

      <h3 className="dash-h">Money</h3>
      <div className="dash-grid">
        <Card label="Net sales (before tax)" value={money(p.netSales)} sub={`${money(p.netCollected)} collected incl. tax`} />
        <Card label="Sales tax to set aside" value={money(p.salesTax)} sub="Owed to the Texas Comptroller" />
        <Card label="Refunds" value={money(p.refunds)} sub={`of ${money(p.gross)} collected`} />
        <Card label="Square fees" value={money(p.fees)} sub={p.feesOnRefunded ? `${money(p.feesOnRefunded)} was on refunded payments` : 'About 2.9% + 30¢ per charge'} />
        <Card label="Gas" value={money(p.gas)} sub={`${p.miles} miles at ${money(data.trips.gasPerMile)}/mile`} />
        <Card label="Your time" value={money(p.labor)} sub={`${Math.floor(p.minutes / 60)}h ${p.minutes % 60}m at ${money(data.settings.hourly_rate)}/hr`} />
        <Card label="Operating profit" value={money(p.profit)} sub="Net sales − fees − gas − time" tone={p.profit < 0 ? '#b3261e' : '#1c6b3d'} />
      </div>

      <h3 className="dash-h">Equipment payback (all time)</h3>
      <div className="dash-card">
        <div className="dash-sub">You spent {money(eq.invested)} on equipment ({money(eq.costPerTote)}/tote, {money(eq.costPerDolly)}/dolly). Profit so far: {money(data.lifetime.profit)}.</div>
        <div className="dash-bar"><div style={{ width: `${pct}%` }} /></div>
        <div className="dash-sub">{eq.remaining > 0 ? `${money(eq.remaining)} left to earn back (${pct}% paid off)` : 'Paid off. Everything from here is profit.'}</div>
      </div>

      <h3 className="dash-h">Orders ({RANGES.find((r) => r[0] === range)[1].toLowerCase()})</h3>
      <div className="dash-grid">
        <Card label="Orders" value={data.orders.count} sub="Fully refunded orders not counted" />
        <Card label="Average order" value={money(data.orders.avgOrder)} />
        <Card label="Average rental" value={`${data.orders.avgDays} days`} />
        <div className="dash-card">
          <div className="dash-label">Packages</div>
          {Object.keys(data.orders.pkgMix).length === 0 ? <div className="dash-sub">None yet</div> : Object.entries(data.orders.pkgMix).map(([k, n]) => <div key={k} className="dash-line">{(PACKAGES[k] || {}).name || k}: <strong>{n}</strong></div>)}
        </div>
        <div className="dash-card">
          <div className="dash-label">Top delivery ZIPs</div>
          {data.orders.topZips.length === 0 ? <div className="dash-sub">None yet</div> : data.orders.topZips.map(([z, n]) => <div key={z} className="dash-line">{z}: <strong>{n}</strong></div>)}
        </div>
      </div>

      <h3 className="dash-h">Inventory</h3>
      <div className="dash-grid">
        <Card label="Totes" value={`${inv.totesAvailable} free`} sub={`${inv.totesOut} out of ${inv.totesOwned} owned`} />
        <Card label="Dollies" value={`${inv.dolliesAvailable} free`} sub={`${inv.dolliesOut} out of ${inv.dolliesOwned} owned`} />
        <Card
          label="Busiest day, next 14 days"
          value={`${inv.peak.totes} totes · ${inv.peak.dollies} dollies`}
          sub={overBooked ? 'More than you own. Check your confirmed bookings.' : overWithReq ? `Pending requests would push it to ${inv.peak.totesWithRequests} totes · ${inv.peak.dolliesWithRequests} dollies, more than you own` : 'Confirmed bookings fit what you own'}
          tone={overBooked ? '#b3261e' : overWithReq ? '#a15c00' : undefined}
        />
      </div>

      <h3 className="dash-h">Coming up</h3>
      <div className="dash-grid">
        <Card label="Waiting for your approval" value={data.pipeline.requested} sub={data.pipeline.needsQuote ? `${data.pipeline.needsQuote} need a delivery quote` : undefined} />
        <Card label="Confirmed, not yet delivered" value={data.pipeline.confirmedUpcoming} />
        <Card label="Out on rental now" value={data.pipeline.outNow} />
        <div className="dash-card">
          <div className="dash-label">Pickups in the next 7 days</div>
          {data.pipeline.dueSoon.length === 0 ? <div className="dash-sub">None</div> : data.pipeline.dueSoon.map((d) => <div key={d.id} className="dash-line">{d.pickup_date}: {d.name} ({d.totes} totes)</div>)}
        </div>
        {data.pipeline.overdue.length > 0 && (
          <div className="dash-card">
            <div className="dash-label" style={{ color: '#b3261e' }}>Past pickup date</div>
            {data.pipeline.overdue.map((d) => <div key={d.id} className="dash-line">{d.pickup_date}: {d.name}</div>)}
          </div>
        )}
      </div>

      <h3 className="dash-h">Time &amp; mileage</h3>
      <div className="dash-card">
        <div className="dash-sub">Minutes and miles you type when marking a delivery or pickup are saved here automatically. Add anything else below (supply runs, errands).</div>
        <div className="charge-form">
          <select value={log.kind} onChange={(e) => setLog({ ...log, kind: e.target.value })}>
            <option value="other">Other</option><option value="delivery">Delivery</option><option value="pickup">Pickup</option>
          </select>
          <input className="amount" type="number" placeholder="Minutes" value={log.minutes} onChange={(e) => setLog({ ...log, minutes: e.target.value })} />
          <input className="amount" type="number" placeholder="Miles" value={log.miles} onChange={(e) => setLog({ ...log, miles: e.target.value })} />
          <input placeholder="Note (optional)" value={log.note} onChange={(e) => setLog({ ...log, note: e.target.value })} />
          <button className="btn-charge" onClick={async () => { if (await post('/api/admin/triplog', log, 'Saved.')) setLog({ kind: 'other', minutes: '', miles: '', note: '' }); }}>Add</button>
        </div>
        {data.trips.recent.length > 0 && (
          <table className="fee-table" style={{ fontSize: 13 }}><tbody>
            {data.trips.recent.map((t) => (
              <tr key={t.id}>
                <td>{t.logged_on} · {t.kind}{t.name ? ` · ${t.name}` : ''}{t.note ? ` · ${t.note}` : ''}</td>
                <td>{t.minutes} min · {Number(t.miles)} mi <button className="btn-decline" style={{ marginLeft: 8, padding: '2px 8px' }} onClick={() => confirm('Delete this entry?') && post('/api/admin/triplog', { deleteId: t.id }, 'Deleted.')}>×</button></td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>

      <h3 className="dash-h">Settings</h3>
      <div className="dash-card">
        <div className="dash-sub">Update these when you buy more equipment or when gas prices change. I used the Texas average gas price and a placeholder hourly rate, so set yours.</div>
        <div className="charge-form" style={{ alignItems: 'flex-end' }}>
          {SETTING_FIELDS.map(([k, l]) => (
            <label key={k} style={{ fontSize: 12 }}>{l}<br />
              <input className="amount" type="number" step="any" value={settings[k] ?? ''} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
            </label>
          ))}
          <button className="btn-charge" onClick={() => post('/api/admin/settings', settings, 'Settings saved.')}>Save settings</button>
        </div>
      </div>

      <p className="dash-sub" style={{ marginTop: 16 }}>
        How this works: orders that were refunded in full are left out of sales, orders and averages. Square fees and any gas or time on them still count as costs, since that money was really spent. Income is dated by when the order was placed or the extra charge was made.
      </p>
    </div>
  );
}
