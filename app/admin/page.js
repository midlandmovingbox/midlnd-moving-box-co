'use client';

import { useEffect, useState } from 'react';
import { DECLINE_REASONS } from '../../lib/declineReasons';

const PACKAGE_NAMES = { small: 'Small Move', home: 'Home Move', big: 'Big Move' };

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T12:00:00');
  return {
    day: dt.toLocaleDateString('en-US', { weekday: 'short' }),
    date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    year: dt.getFullYear(),
  };
}

function DateBlock({ label, value, extra }) {
  const f = fmtDate(value);
  return (
    <div className="date-block">
      <div className="lbl">{label}</div>
      <div className="big">{f.day}, {f.date}</div>
      <div className="small">{f.year}{extra ? ` · ${extra}` : ''}</div>
    </div>
  );
}

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
  const [refundDrafts, setRefundDrafts] = useState({});
  const [quoteDrafts, setQuoteDrafts] = useState({});
  const [declineDrafts, setDeclineDrafts] = useState({}); // id -> { open, reason, note }
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
    const d = declineDrafts[id] || {};
    if (!d.reason) {
      alert('Pick a reason first');
      return;
    }
    if (d.reason === 'other' && !(d.note || '').trim()) {
      alert('Add a note explaining the reason');
      return;
    }
    if (!confirm('Decline this request and email the customer? The card will not be charged.')) return;
    setBusyId(id);
    const res = await fetch('/api/admin/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id, reason: d.reason, note: d.note }),
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

  async function sendQuote(id) {
    const fee = quoteDrafts[id];
    if (fee === undefined || fee === '' || isNaN(parseFloat(fee))) {
      alert('Enter the out-of-area fee in dollars');
      return;
    }
    if (!confirm(`Add a ${money(fee)} area fee and email the customer the new total? Nothing is charged yet.`)) return;
    setBusyId(id);
    const res = await fetch('/api/admin/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id, fee }),
    });
    const data = await res.json();
    if (res.ok) {
      setReservations((rs) => rs.map((r) => (r.id === id ? { ...data.reservation, extra_charges: r.extra_charges } : r)));
    } else {
      alert(data.error || 'Could not send quote');
    }
    setBusyId(null);
  }

  async function markReturned(id) {
    if (!confirm('Mark this rental as returned?')) return;
    setBusyId(id);
    const res = await fetch('/api/admin/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setReservations((rs) => rs.map((r) => (r.id === id ? { ...data.reservation, extra_charges: r.extra_charges } : r)));
    } else {
      alert(data.error || 'Could not mark returned');
    }
    setBusyId(null);
  }

  async function submitRefund(r, paymentOptions) {
    const draft = refundDrafts[r.id] || {};
    const option = paymentOptions.find((o) => o.id === (draft.paymentId || paymentOptions[0]?.id));
    if (!option) return;
    const amount = draft.amount ? parseFloat(draft.amount) : option.amount;
    if (!amount || amount <= 0) {
      alert('Enter a valid amount');
      return;
    }
    if (!confirm(`Refund ${money(amount)} to the customer's card (${option.label})?`)) return;
    setBusyId(r.id);
    const res = await fetch('/api/admin/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationId: r.id, paymentId: option.id, amount, reason: draft.reason }),
    });
    const data = await res.json();
    if (res.ok) {
      setReservations((rs) =>
        rs.map((x) => (x.id === r.id ? { ...x, extra_charges: [data.charge, ...x.extra_charges] } : x))
      );
      setRefundDrafts((d) => ({ ...d, [r.id]: { amount: '', reason: '' } }));
    } else {
      alert(data.error || 'Could not process refund');
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
        {['requested', 'confirmed', 'returned', 'declined', 'all'].map((s) => (
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
              <div className="res-contact">
                <a href={`tel:${(r.phone || '').replace(/[^0-9+]/g, '')}`}>{r.phone}</a>
                {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
              </div>
            </div>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {r.needs_quote && <span className="res-badge declined">needs quote</span>}
              <span className={`res-badge ${r.status}`}>{r.status}</span>
            </span>
          </div>

          <div className="date-row">
            <DateBlock label="Drop off totes" value={r.delivery_date} extra={r.delivery_window} />
            <div className="date-arrow">→</div>
            <DateBlock label="Pick up totes" value={r.pickup_date} />
          </div>

          <div className="res-detail-grid">
            <div className="res-detail"><div className="lbl">Drop off at (moving from)</div><div className="val">{r.from_address || r.address}</div></div>
            <div className="res-detail"><div className="lbl">Pick up at (moving to)</div><div className="val">{r.to_address || '—'}</div></div>
            <div className="res-detail"><div className="lbl">Total</div><div className="val">
              {money(r.total)}
              {(Number(r.delivery_surcharge) + Number(r.pickup_surcharge) + Number(r.quote_fee)) > 0 && (
                <span style={{ color: '#8a8676' }}> · incl. {money(Number(r.delivery_surcharge) + Number(r.pickup_surcharge) + Number(r.quote_fee))} area fee</span>
              )}
            </div></div>
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

          {r.status === 'declined' && r.decline_reason && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#4c4a42' }}>
              <strong>Declined:</strong> {DECLINE_REASONS[r.decline_reason]?.label || r.decline_reason}
              {r.decline_note ? ` — “${r.decline_note}”` : ''}
            </div>
          )}

          {r.status === 'requested' && r.needs_quote && (
            <div className="quote-box">
              <strong>Outside standard area.</strong> Enter the area fee for the address(es) not on your ZIP list, then send the quote. The customer replies OK, then you approve.
              <div className="charge-form">
                <input
                  className="amount"
                  type="number"
                  step="0.01"
                  placeholder="Fee $"
                  value={quoteDrafts[r.id] ?? ''}
                  onChange={(e) => setQuoteDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                />
                <button className="btn-charge" disabled={busyId === r.id} onClick={() => sendQuote(r.id)}>
                  Send quote to customer
                </button>
              </div>
            </div>
          )}
          {r.status === 'requested' && r.quote_sent_at && !r.needs_quote && (
            <div className="quote-box">Quote sent {new Date(r.quote_sent_at).toLocaleString()}. Approve once the customer replies OK.</div>
          )}

          {r.status === 'requested' && (
            <div className="res-actions">
              <button className="btn-approve" disabled={busyId === r.id || r.needs_quote} onClick={() => approve(r.id)}>
                {busyId === r.id ? 'Charging…' : `Approve & Charge ${money(r.total)}`}
              </button>
              <button
                className="btn-decline"
                disabled={busyId === r.id}
                onClick={() => setDeclineDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], open: !d[r.id]?.open } }))}
              >
                Decline…
              </button>
            </div>
          )}
          {r.status === 'requested' && declineDrafts[r.id]?.open && (
            <div className="quote-box" style={{ background: '#FDEEE6', borderColor: '#f0c9b6', color: '#5a2a12' }}>
              <strong>Decline this request.</strong> The customer gets an email with the reason below. Their card is not charged.
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                <select
                  className="decline-field"
                  value={declineDrafts[r.id]?.reason || ''}
                  onChange={(e) => setDeclineDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], reason: e.target.value } }))}
                >
                  <option value="">Choose a reason…</option>
                  {Object.entries(DECLINE_REASONS).map(([key, v]) => (
                    <option key={key} value={key}>{v.label}</option>
                  ))}
                </select>
                <textarea
                  className="decline-field"
                  rows={3}
                  placeholder="Optional note to the customer (required if reason is Other)"
                  value={declineDrafts[r.id]?.note || ''}
                  onChange={(e) => setDeclineDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], note: e.target.value } }))}
                />
                <div>
                  <button className="btn-decline" disabled={busyId === r.id} onClick={() => decline(r.id)}>
                    {busyId === r.id ? 'Sending…' : 'Decline & email customer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(r.status === 'confirmed' || r.status === 'returned') && (() => {
            const paymentOptions = [
              ...(r.square_payment_id ? [{ id: r.square_payment_id, amount: Number(r.total), label: `Rental ${money(r.total)}` }] : []),
              ...r.extra_charges
                .filter((c) => Number(c.amount) > 0 && c.square_payment_id)
                .map((c) => ({ id: c.square_payment_id, amount: Number(c.amount), label: `${c.note || 'Extra charge'} ${money(c.amount)}` })),
            ];
            const rd = refundDrafts[r.id] || {};
            return (
              <>
                {r.status === 'confirmed' && (
                  <div className="res-actions">
                    <button className="btn-decline" disabled={busyId === r.id} onClick={() => markReturned(r.id)}>
                      Mark returned
                    </button>
                  </div>
                )}
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
                {paymentOptions.length > 0 && (
                  <div className="charge-form">
                    <select
                      className="note"
                      value={rd.paymentId || paymentOptions[0].id}
                      onChange={(e) => setRefundDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], paymentId: e.target.value } }))}
                    >
                      {paymentOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      className="amount"
                      type="number"
                      step="0.01"
                      placeholder="Full"
                      value={rd.amount || ''}
                      onChange={(e) => setRefundDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], amount: e.target.value } }))}
                    />
                    <input
                      className="note"
                      type="text"
                      placeholder="Refund reason (optional)"
                      value={rd.reason || ''}
                      onChange={(e) => setRefundDrafts((d) => ({ ...d, [r.id]: { ...d[r.id], reason: e.target.value } }))}
                    />
                    <button className="btn-decline" disabled={busyId === r.id} onClick={() => submitRefund(r, paymentOptions)}>
                      Refund
                    </button>
                  </div>
                )}
                {r.extra_charges?.length > 0 && (
                  <div className="extra-charges-list">
                    {r.extra_charges.map((c) => (
                      <div key={c.id}>
                        {Number(c.amount) < 0 ? '−' : '+'} {money(Math.abs(c.amount))} — {(c.note || 'no note').replace(/ \[[^\]]*\]$/, '')} ({new Date(c.created_at).toLocaleDateString()})
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
