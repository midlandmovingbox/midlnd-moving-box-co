'use client';

import { useEffect, useState } from 'react';

const PACKAGE_NAMES = { small: 'Small Move', home: 'Home Move', big: 'Big Move' };

function money(n) {
  return '$' + Number(n).toFixed(2).replace(/\.00$/, '');
}

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('requested');
  const [busyId, setBusyId] = useState(null);
  const [chargeDrafts, setChargeDrafts] = useState({});
  const [listError, setListError] = useState('');

  async function loadReservations() {
    setListError('');
    const res = await fetch('/api/admin/reservations');
    if (res.status === 401) {
      setLoggedIn(false);
      setCheckingAuth(false);
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setReservations(data.reservations);
      setLoggedIn(true);
    } else {
      setListError(data.error || 'Could not load reservations');
    }
    setCheckingAuth(false);
  }

  useEffect(() => {
    loadReservations();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLoggedIn(true);
      loadReservations();
    } else {
      setLoginError('Incorrect password');
    }
  }

  async function approve(id) {
    setBusyId(id);
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setReservations((rs) => rs.map((r) => (r.id === id ? { ...data.reservation, extra_charges: r.extra_charges } : r)));
    } else {
      alert(data.error || 'Could not approve');
    }
    setBusyId(null);
  }

  async function decline(id) {
    if (!confirm('Decline this request? The card will not be charged.')) return;
    setBusyId(id);
    const res = await fetch('/api/admin/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setReservations((rs) => rs.map((r) => (r.id === id ? { ...data.reservation, extra_charges: r.extra_charges } : r)));
    } else {
      alert(data.error || 'Could not decline');
    }
    setBusyId(null);
  }

  async function submitCharge(id) {
    const draft = chargeDrafts[id] || {};
    if (!draft.amount || parseFloat(draft.amount) <= 0) {
      alert('Enter a valid amount');
      return;
    }
    if (!confirm(`Charge ${money(draft.amount)} to the card on file for this reservation?`)) return;
    setBusyId(id);
    const res = await fetch('/api/admin/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id, amount: draft.amount, note: draft.note }),
    });
    const data = await res.json();
    if (res.ok) {
      setReservations((rs) =>
        rs.map((r) => (r.id === id ? { ...r, extra_charges: [data.charge, ...r.extra_charges] } : r))
      );
      setChargeDrafts((d) => ({ ...d, [id]: { amount: '', note: '' } }));
    } else {
      alert(data.error || 'Could not process charge');
    }
    setBusyId(null);
  }

  if (checkingAuth) return null;

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <h1>Admin login</h1>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </div>
          {loginError && <div className="pay-error">{loginError}</div>}
          <button type="submit" className="submit-btn">Log in</button>
        </form>
      </div>
    );
  }

  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <h1>Reservation requests</h1>
        <a href="/" className="mono" style={{ fontSize: 12, color: '#6b6759' }}>← Site</a>
      </div>

      <div className="status-tabs">
        {['requested', 'confirmed', 'declined', 'all'].map((s) => (
          <button key={s} className={`status-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s} {s !== 'all' && `(${reservations.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {listError && <div className="pay-error">{listError}</div>}
      {filtered.length === 0 && <p style={{ color: '#8a8676' }}>Nothing here.</p>}

      {filtered.map((r) => (
        <div className="res-card" key={r.id}>
          <div className="res-card-top">
            <div>
              <div className="res-card-title">{PACKAGE_NAMES[r.package] || r.package} — {r.name}</div>
              <div className="res-card-sub">{r.delivery_date} → {r.pickup_date} · {r.phone}</div>
            </div>
            <span className={`res-badge ${r.status}`}>{r.status}</span>
          </div>

          <div className="res-detail-grid">
            <div className="res-detail"><div className="lbl">Total</div><div className="val">{money(r.total)}</div></div>
            <div className="res-detail"><div className="lbl">Location</div><div className="val">{r.location || '—'}</div></div>
            <div className="res-detail"><div className="lbl">Address</div><div className="val">{r.address}</div></div>
            <div className="res-detail"><div className="lbl">Card</div><div className="val">{r.square_card_brand || 'Card'} •••• {r.square_card_last4 || '----'}</div></div>
          </div>

          {r.notes && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#4c4a42' }}>
              <strong>Notes:</strong> {r.notes}
            </div>
          )}

          {Object.keys(r.addons || {}).length > 0 && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#4c4a42' }}>
              <strong>Add-ons:</strong> {Object.entries(r.addons).map(([id, qty]) => `${id} ×${qty}`).join(', ')}
            </div>
          )}

          {r.status === 'requested' && (
            <div className="res-actions">
              <button className="btn-approve" disabled={busyId === r.id} onClick={() => approve(r.id)}>
                {busyId === r.id ? 'Charging…' : `Approve & Charge ${money(r.total)}`}
              </button>
              <button className="btn-decline" disabled={busyId === r.id} onClick={() => decline(r.id)}>
                Decline
              </button>
            </div>
          )}

          {r.status === 'confirmed' && (
            <>
              <div className="charge-form">
                <input
                  className="amount"
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={chargeDrafts[r.id]?.amount || ''}
                  onChange={(e) => setChargeDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], amount: e.target.value } }))}
                />
                <input
                  className="note"
                  type="text"
                  placeholder="Reason (extra week, damage, etc.)"
                  value={chargeDrafts[r.id]?.note || ''}
                  onChange={(e) => setChargeDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], note: e.target.value } }))}
                />
                <button className="btn-charge" disabled={busyId === r.id} onClick={() => submitCharge(r.id)}>
                  {busyId === r.id ? 'Processing…' : 'Charge card on file'}
                </button>
              </div>
              {r.extra_charges?.length > 0 && (
                <div className="extra-charges-list">
                  {r.extra_charges.map((c) => (
                    <div key={c.id}>+ {money(c.amount)} — {c.note || 'no note'} ({new Date(c.created_at).toLocaleDateString()})</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
