'use client';

import { orderNumber } from '../../lib/order';
import { useEffect, useState } from 'react';
import { DECLINE_REASONS } from '../../lib/declineReasons';
import { zoneFor } from '../../lib/zones';
import { POLICY, usd, expectedEquipment, tripFeeFor, taxed } from '../../lib/policy';

const PACKAGE_NAMES = { small: 'Small Move', home: 'Home Move', big: 'Big Move' };

function fmtDate(d) {
  if (!d) return { day: '', date: '—', year: '' };
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

const money = usd;
const n = (v) => Math.max(0, parseInt(v, 10) || 0);

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('requested');
  const [busyId, setBusyId] = useState(null);
  const [listError, setListError] = useState('');
  // Per-reservation form state: forms[id] = { panel: 'deliver' | 'pickup' | ..., ...fields }
  const [forms, setForms] = useState({});

  const F = (id) => forms[id] || {};
  const setF = (id, patch) => setForms((f) => ({ ...f, [id]: { ...f[id], ...patch } }));
  const togglePanel = (id, panel) => setF(id, { panel: F(id).panel === panel ? null : panel });

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

  // One helper for every admin action. Updates the card from the server's answer.
  async function act(id, url, body, confirmText) {
    if (confirmText && !confirm(confirmText)) return;
    setBusyId(id);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId: id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Something went wrong');
      } else {
        setReservations((rs) =>
          rs.map((r) => {
            if (r.id !== id) return r;
            const next = data.reservation ? { ...r, ...data.reservation } : { ...r };
            if (data.charge) next.extra_charges = [data.charge, ...(r.extra_charges || [])];
            return next;
          })
        );
        setF(id, { panel: null });
      }
    } catch (err) {
      alert('Network error: ' + err.message);
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
        <h1>Reservations</h1>
        <a href="/" className="mono" style={{ fontSize: 12, color: '#6b6759' }}>← Site</a>
      </div>

      <div className="status-tabs">
        {['requested', 'confirmed', 'returned', 'declined', 'cancelled', 'all'].map((s) => (
          <button key={s} className={`status-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s} {s !== 'all' && `(${reservations.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {listError && <div className="pay-error">{listError}</div>}
      {filtered.length === 0 && <p style={{ color: '#8a8676' }}>Nothing here.</p>}

      {filtered.map((r) => {
        const f = F(r.id);
        const busy = busyId === r.id;
        const exp = expectedEquipment(r);
        const delTotes = r.delivered_totes ?? exp.totes;
        const delDollies = r.delivered_dollies ?? exp.dollies;
        const areaFee = Number(r.delivery_surcharge) + Number(r.pickup_surcharge) + Number(r.quote_fee);
        const fromZone = zoneFor(r.from_address || r.address);
        const toZone = zoneFor(r.to_address);
        const unlistedEnds = [];
        if (fromZone.zip && fromZone.fee === null) unlistedEnds.push(`drop-off ZIP ${fromZone.zip}`);
        if (toZone.zip && toZone.fee === null) unlistedEnds.push(`pickup ZIP ${toZone.zip}`);

        const paymentOptions = [
          ...(r.square_payment_id ? [{ id: r.square_payment_id, amount: Number(r.total), label: `Rental ${money(r.total)}` }] : []),
          ...(r.extra_charges || [])
            .filter((c) => Number(c.amount) > 0 && c.square_payment_id)
            .map((c) => ({ id: c.square_payment_id, amount: Number(c.amount), label: `${c.note || 'Extra charge'} ${money(c.amount)}` })),
        ];

        // live previews (the server recalculates everything itself)
        const pickTotes = f.pickTotes ?? delTotes;
        const pickDollies = f.pickDollies ?? delDollies;
        const missT = Math.max(0, delTotes - n(pickTotes));
        const missD = Math.max(0, delDollies - n(pickDollies));
        const missFee = taxed(missT * POLICY.toteMissing + missD * POLICY.dollyMissing);
        const extWeeks = n(f.weeks ?? 1);
        const extFee = taxed(extWeeks * delTotes * POLICY.extensionPerToteWeek);
        const nrTrip = f.returnTrip ?? true;
        const nrFee = taxed(delTotes * POLICY.extensionPerToteWeek + (nrTrip ? tripFeeFor(r.to_address || r.address) : 0));
        const inspFee = taxed(n(f.damagedTotes) * POLICY.toteDamaged + n(f.damagedDollies) * POLICY.dollyDamaged + n(f.dirtyTotes) * POLICY.toteDirty);
        const cancelFee = f.lateCancel ? taxed(POLICY.cancelFee) : 0;

        return (
          <div className="res-card" key={r.id}>
            <div className="res-card-top">
              <div>
                <div className="res-card-title">{PACKAGE_NAMES[r.package] || r.package} — {r.name} <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.7 }}>{orderNumber(r.id)}</span></div>
                <div className="res-contact">
                  <a href={`tel:${(r.phone || '').replace(/[^0-9+]/g, '')}`}>{r.phone}</a>
                  {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                </div>
              </div>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {r.needs_quote && <span className="res-badge declined">needs quote</span>}
                <span className={`res-badge ${r.status === 'cancelled' ? 'declined' : r.status}`}>{r.status}</span>
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
              <div className="res-detail">
                <div className="lbl">Total</div>
                <div className="val">
                  {money(r.total)}
                  {areaFee > 0 && <span style={{ color: '#8a8676' }}> · incl. {money(areaFee)} area fee</span>}
                </div>
              </div>
              <div className="res-detail"><div className="lbl">Card</div><div className="val">{r.square_card_brand || 'Card'} •••• {r.square_card_last4 || '----'}</div></div>
              <div className="res-detail">
                <div className="lbl">Equipment</div>
                <div className="val">
                  Ordered: {exp.totes} totes, {exp.dollies} dollies
                  {r.delivered_at && <><br />Delivered: {r.delivered_totes} / {r.delivered_dollies}</>}
                  {r.picked_up_at && <><br />Picked up: {r.picked_up_totes} / {r.picked_up_dollies}</>}
                </div>
              </div>
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

            {/* ---------- REQUESTED ---------- */}
            {r.status === 'requested' && r.needs_quote && (
              <div className="quote-box">
                <strong>{unlistedEnds.length ? `${unlistedEnds.join(' and ')} isn't on your delivery list.` : 'Needs a delivery fee quote.'}</strong>{' '}
                Enter the area fee for it, then send the quote. The customer replies OK, then you approve.
                <div className="charge-form">
                  <input className="amount" type="number" step="0.01" placeholder="Fee $" value={f.quoteFee ?? ''} onChange={(e) => setF(r.id, { quoteFee: e.target.value })} />
                  <button
                    className="btn-charge"
                    disabled={busy}
                    onClick={() => {
                      if (f.quoteFee === undefined || f.quoteFee === '' || isNaN(parseFloat(f.quoteFee))) return alert('Enter the area fee in dollars');
                      act(r.id, '/api/admin/quote', { fee: f.quoteFee }, `Add a ${money(f.quoteFee)} area fee and email the customer the new total? Nothing is charged yet.`);
                    }}
                  >
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
                <button className="btn-approve" disabled={busy || r.needs_quote} onClick={() => act(r.id, '/api/admin/approve', {}, null)}>
                  {busy ? 'Working…' : `Approve & Charge ${money(r.total)}`}
                </button>
                <button className="btn-decline" disabled={busy} onClick={() => togglePanel(r.id, 'decline')}>Decline…</button>
                <button className="btn-decline" disabled={busy} onClick={() => togglePanel(r.id, 'cancelReq')}>Cancel request…</button>
              </div>
            )}
            {r.status === 'requested' && f.panel === 'decline' && (
              <div className="quote-box" style={{ background: '#FDEEE6', borderColor: '#f0c9b6', color: '#5a2a12' }}>
                <strong>Decline this request.</strong> The customer gets an email with the reason below. Their card is not charged.
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  <select className="decline-field" value={f.reason || ''} onChange={(e) => setF(r.id, { reason: e.target.value })}>
                    <option value="">Choose a reason…</option>
                    {Object.entries(DECLINE_REASONS).map(([key, v]) => (
                      <option key={key} value={key}>{v.label}</option>
                    ))}
                  </select>
                  <textarea className="decline-field" rows={3} placeholder="Optional note to the customer (required if reason is Other)" value={f.note || ''} onChange={(e) => setF(r.id, { note: e.target.value })} />
                  <div>
                    <button
                      className="btn-decline"
                      disabled={busy}
                      onClick={() => {
                        if (!f.reason) return alert('Pick a reason first');
                        if (f.reason === 'other' && !(f.note || '').trim()) return alert('Add a note explaining the reason');
                        act(r.id, '/api/admin/decline', { reason: f.reason, note: f.note }, 'Decline this request and email the customer? The card will not be charged.');
                      }}
                    >
                      {busy ? 'Sending…' : 'Decline & email customer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {r.status === 'requested' && f.panel === 'cancelReq' && (
              <div className="quote-box">
                <strong>Customer cancelled this request.</strong> Nothing was charged, so this just closes it and emails them.
                <label style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={!!f.lateCancel} onChange={(e) => setF(r.id, { lateCancel: e.target.checked })} />
                  Less than {POLICY.cancelFreeHours} hours' notice (charge the {money(taxed(POLICY.cancelFee))} cancellation fee, tax included)
                </label>
                <div style={{ marginTop: 10 }}>
                  <button className="btn-decline" disabled={busy} onClick={() => act(r.id, '/api/admin/cancel', { late: !!f.lateCancel }, `Cancel this request${f.lateCancel ? ` and charge a ${money(taxed(POLICY.cancelFee))} fee` : ''}?`)}>
                    Cancel request
                  </button>
                </div>
              </div>
            )}

            {/* ---------- CONFIRMED ---------- */}
            {r.status === 'confirmed' && (
              <>
                <div className="res-actions">
                  {!r.delivered_at ? (
                    <button className="btn-charge" disabled={busy} onClick={() => setF(r.id, { panel: f.panel === 'deliver' ? null : 'deliver', delTotes: exp.totes, delDollies: exp.dollies })}>Mark delivered</button>
                  ) : (
                    <span className="mono" style={{ fontSize: 12, alignSelf: 'center', color: '#1c6b3d' }}>✓ Delivered {new Date(r.delivered_at).toLocaleDateString()}</span>
                  )}
                  <button className="btn-charge" disabled={busy} onClick={() => togglePanel(r.id, 'pickup')}>Record pickup</button>
                  <button className="btn-decline" disabled={busy} onClick={() => togglePanel(r.id, 'extend')}>Extend</button>
                  <button className="btn-decline" disabled={busy} onClick={() => togglePanel(r.id, 'notready')}>Not ready</button>
                  <button className="btn-decline" disabled={busy} onClick={() => setF(r.id, { panel: f.panel === 'resched' ? null : 'resched', newDelivery: r.delivery_date, newPickup: r.pickup_date })}>Reschedule</button>
                  {!r.delivered_at && <button className="btn-decline" disabled={busy} onClick={() => togglePanel(r.id, 'cancel')}>Cancel</button>}
                </div>

                {f.panel === 'deliver' && (
                  <div className="quote-box">
                    <strong>Delivered counts.</strong> Emailed to the customer; starts their {POLICY.countWindowHours}-hour window to report a mismatch.
                    <div className="charge-form">
                      <label>Totes <input className="amount" type="number" value={f.delTotes ?? exp.totes} onChange={(e) => setF(r.id, { delTotes: e.target.value })} /></label>
                      <label>Dollies <input className="amount" type="number" value={f.delDollies ?? exp.dollies} onChange={(e) => setF(r.id, { delDollies: e.target.value })} /></label>
                      <button className="btn-charge" disabled={busy} onClick={() => act(r.id, '/api/admin/deliver', { totes: f.delTotes ?? exp.totes, dollies: f.delDollies ?? exp.dollies }, 'Record delivery and email the customer the count?')}>Send delivery email</button>
                    </div>
                  </div>
                )}

                {f.panel === 'pickup' && (
                  <div className="quote-box">
                    <strong>What did you pick up?</strong> Delivered: {delTotes} totes, {delDollies} dollies. Anything short is charged automatically ({money(POLICY.toteMissing)}/tote, {money(POLICY.dollyMissing)}/dolly, plus sales tax).
                    <div className="charge-form">
                      <label>Totes <input className="amount" type="number" value={pickTotes} onChange={(e) => setF(r.id, { pickTotes: e.target.value })} /></label>
                      <label>Dollies <input className="amount" type="number" value={pickDollies} onChange={(e) => setF(r.id, { pickDollies: e.target.value })} /></label>
                      <button
                        className="btn-charge"
                        disabled={busy}
                        onClick={() => act(r.id, '/api/admin/pickup', { totes: pickTotes, dollies: pickDollies }, missFee > 0 ? `${missT} tote(s) and ${missD} dolly(ies) missing. This will CHARGE ${money(missFee)} to the card now and email the customer. Continue?` : 'Everything accounted for. Record pickup and email the customer?')}
                      >
                        {missFee > 0 ? `Record & charge ${money(missFee)}` : 'Record pickup'}
                      </button>
                    </div>
                  </div>
                )}

                {f.panel === 'extend' && (
                  <div className="quote-box">
                    <strong>Extend the rental</strong> (customer already agreed). {money(POLICY.extensionPerToteWeek)} × {delTotes} totes per week, plus sales tax. Pickup date moves out.
                    <div className="charge-form">
                      <label>Weeks <input className="amount" type="number" min="1" max="8" value={f.weeks ?? 1} onChange={(e) => setF(r.id, { weeks: e.target.value })} /></label>
                      <button className="btn-charge" disabled={busy || !extWeeks} onClick={() => act(r.id, '/api/admin/fees', { type: 'extension', weeks: extWeeks }, `Charge ${money(extFee)} for ${extWeeks} extra week(s) and email the customer?`)}>
                        Charge {money(extFee)} & email
                      </button>
                    </div>
                  </div>
                )}

                {f.panel === 'notready' && (
                  <div className="quote-box">
                    <strong>Equipment wasn't ready at pickup.</strong> One full week ({money(delTotes * POLICY.extensionPerToteWeek)} + tax) plus the return-trip fee if you have to come back ({money(tripFeeFor(r.to_address || r.address))} for this pickup ZIP). Sales tax is added to the total.
                    <label style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={nrTrip} onChange={(e) => setF(r.id, { returnTrip: e.target.checked })} />
                      We have to make a return trip
                    </label>
                    <div className="charge-form">
                      <label>New pickup date <input type="date" value={f.newPickupDate ?? ''} onChange={(e) => setF(r.id, { newPickupDate: e.target.value })} /></label>
                      <button className="btn-charge" disabled={busy} onClick={() => act(r.id, '/api/admin/fees', { type: 'notready', returnTrip: nrTrip, newPickupDate: f.newPickupDate || null }, `Charge ${money(nrFee)} and email the customer?`)}>
                        Charge {money(nrFee)} & email
                      </button>
                    </div>
                  </div>
                )}

                {f.panel === 'resched' && (
                  <div className="quote-box">
                    <strong>Reschedule.</strong> Free with {POLICY.cancelFreeHours}+ hours' notice; {money(taxed(POLICY.rescheduleFee))} fee with tax if less (charged now).
                    <div className="charge-form">
                      <label>Delivery <input type="date" value={f.newDelivery ?? r.delivery_date} onChange={(e) => setF(r.id, { newDelivery: e.target.value })} /></label>
                      <label>Pickup <input type="date" value={f.newPickup ?? r.pickup_date} onChange={(e) => setF(r.id, { newPickup: e.target.value })} /></label>
                    </div>
                    <label style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={!!f.lateResched} onChange={(e) => setF(r.id, { lateResched: e.target.checked })} />
                      Less than {POLICY.cancelFreeHours} hours' notice (charge {money(taxed(POLICY.rescheduleFee))})
                    </label>
                    <div style={{ marginTop: 10 }}>
                      <button className="btn-charge" disabled={busy} onClick={() => act(r.id, '/api/admin/reschedule', { deliveryDate: f.newDelivery ?? r.delivery_date, pickupDate: f.newPickup ?? r.pickup_date, late: !!f.lateResched }, `Reschedule${f.lateResched ? ` and charge ${money(taxed(POLICY.rescheduleFee))}` : ''}, and email the customer?`)}>
                        Save new dates
                      </button>
                    </div>
                  </div>
                )}

                {f.panel === 'cancel' && (
                  <div className="quote-box">
                    <strong>Cancel this reservation.</strong> Refunds the rental to their card{cancelFee ? `, keeping the ${money(cancelFee)} fee` : ' in full'}. Tax is refunded with it.
                    <label style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <input type="checkbox" checked={!!f.lateCancel} onChange={(e) => setF(r.id, { lateCancel: e.target.checked })} />
                      Less than {POLICY.cancelFreeHours} hours' notice (keep {money(taxed(POLICY.cancelFee))} with tax)
                    </label>
                    <div style={{ marginTop: 10 }}>
                      <button className="btn-decline" disabled={busy} onClick={() => act(r.id, '/api/admin/cancel', { late: !!f.lateCancel }, `Refund ${money(Number(r.total) - cancelFee)} and cancel this reservation?`)}>
                        Refund & cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------- RETURNED: inspection ---------- */}
            {r.status === 'returned' && (
              <>
                <div className="res-actions">
                  <button className="btn-charge" disabled={busy} onClick={() => togglePanel(r.id, 'inspect')}>Inspection fees</button>
                </div>
                {f.panel === 'inspect' && (
                  <div className="quote-box">
                    <strong>Inspection.</strong> Damaged/unusable tote {money(POLICY.toteDamaged)}, damaged dolly {money(POLICY.dollyDamaged)}, very dirty tote {money(POLICY.toteDirty)}, plus sales tax. Charge within {POLICY.chargeWindowDays} days of pickup.
                    <div className="charge-form">
                      <label>Damaged totes <input className="amount" type="number" min="0" value={f.damagedTotes ?? ''} onChange={(e) => setF(r.id, { damagedTotes: e.target.value })} /></label>
                      <label>Damaged dollies <input className="amount" type="number" min="0" value={f.damagedDollies ?? ''} onChange={(e) => setF(r.id, { damagedDollies: e.target.value })} /></label>
                      <label>Very dirty totes <input className="amount" type="number" min="0" value={f.dirtyTotes ?? ''} onChange={(e) => setF(r.id, { dirtyTotes: e.target.value })} /></label>
                      <button className="btn-charge" disabled={busy || !inspFee} onClick={() => act(r.id, '/api/admin/fees', { type: 'inspection', damagedTotes: n(f.damagedTotes), damagedDollies: n(f.damagedDollies), dirtyTotes: n(f.dirtyTotes) }, `Charge ${money(inspFee)} and email an itemized receipt?`)}>
                        Charge {money(inspFee)} & email
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ---------- CONFIRMED / RETURNED: custom charge + refund + history ---------- */}
            {(r.status === 'confirmed' || r.status === 'returned') && (
              <>
                <div className="charge-form">
                  <input className="amount" type="number" step="0.01" placeholder="Amount" value={f.amount || ''} onChange={(e) => setF(r.id, { amount: e.target.value })} />
                  <input className="note" type="text" placeholder="Other charge (reason)" value={f.cnote || ''} onChange={(e) => setF(r.id, { cnote: e.target.value })} />
                  <button
                    className="btn-charge"
                    disabled={busy}
                    onClick={() => {
                      if (!f.amount || parseFloat(f.amount) <= 0) return alert('Enter a valid amount');
                      act(r.id, '/api/admin/charge', { amount: f.amount, note: f.cnote }, `Charge ${money(f.amount)} to the card on file for this reservation?`);
                      setF(r.id, { amount: '', cnote: '' });
                    }}
                  >
                    Charge card on file
                  </button>
                </div>
                {paymentOptions.length > 0 && (
                  <div className="charge-form">
                    <select className="note" value={f.refundPayment || paymentOptions[0].id} onChange={(e) => setF(r.id, { refundPayment: e.target.value })}>
                      {paymentOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    <input className="amount" type="number" step="0.01" placeholder="Full" value={f.refundAmount || ''} onChange={(e) => setF(r.id, { refundAmount: e.target.value })} />
                    <input className="note" type="text" placeholder="Refund reason (optional)" value={f.refundReason || ''} onChange={(e) => setF(r.id, { refundReason: e.target.value })} />
                    <button
                      className="btn-decline"
                      disabled={busy}
                      onClick={() => {
                        const opt = paymentOptions.find((o) => o.id === (f.refundPayment || paymentOptions[0].id));
                        const amt = f.refundAmount ? parseFloat(f.refundAmount) : opt.amount;
                        if (!amt || amt <= 0) return alert('Enter a valid amount');
                        act(r.id, '/api/admin/refund', { paymentId: opt.id, amount: amt, reason: f.refundReason }, `Refund ${money(amt)} to the customer's card (${opt.label})?`);
                        setF(r.id, { refundAmount: '', refundReason: '' });
                      }}
                    >
                      Refund
                    </button>
                  </div>
                )}
              </>
            )}

            {(r.extra_charges || []).length > 0 && (
              <div className="extra-charges-list">
                {r.extra_charges.map((c) => (
                  <div key={c.id}>
                    {Number(c.amount) < 0 ? '−' : '+'} {money(Math.abs(c.amount))} — {(c.note || 'no note').replace(/ \[[^\]]*\]$/, '')} ({new Date(c.created_at).toLocaleDateString()})
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
