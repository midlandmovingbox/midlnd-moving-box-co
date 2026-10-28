'use client';

import { useEffect, useRef, useState } from 'react';
import { surchargeFor } from '../../lib/zones';
import { POLICY } from '../../lib/policy';
import AddressInput from '../../components/AddressInput';
import SiteLogo from '../../components/SiteLogo';

import { PACKAGES as LIB_PACKAGES, ADDONS, TAX_RATE } from '../../lib/constants';

// Limits and prices come from lib/constants (the same numbers the server enforces).
const DETAILS = {
  small: '20 totes · 1 dolly · 1 bedroom/apartment',
  home: '40 totes · 2 dollies · 2–3 bedrooms',
  big: '60 totes · 3 dollies · 4+ bedrooms',
};
const PACKAGES = Object.fromEntries(Object.entries(LIB_PACKAGES).map(([k, v]) => [k, { ...v, desc: DETAILS[k] }]));

function money(n) {
  return '$' + n.toFixed(2).replace(/\.00$/, '');
}

export default function BookPage() {
  const [pkg, setPkg] = useState(null);
  const [addons, setAddons] = useState({});
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [cardError, setCardError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const cardRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('pkg');
    if (p && PACKAGES[p]) setPkg(p);
  }, []);

  useEffect(() => {
    let cancelled = false;
    function waitForSquare(retries = 40) {
      if (cancelled) return;
      if (window.Square) {
        initCard();
      } else if (retries > 0) {
        setTimeout(() => waitForSquare(retries - 1), 150);
      } else {
        setCardError('Payment form failed to load. Refresh and try again.');
      }
    }
    async function initCard() {
      try {
        const payments = window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APP_ID,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
        );
        const card = await payments.card();
        await card.attach('#card-container');
        if (cancelled) {
          card.destroy();
          return;
        }
        cardRef.current = card;
      } catch (e) {
        setCardError('Could not load the card form: ' + e.message);
      }
    }
    waitForSquare();
    return () => {
      cancelled = true;
      if (cardRef.current) cardRef.current.destroy();
    };
  }, []);

  function changeAddon(id, delta) {
    setAddons((a) => {
      let n = Math.max(0, (a[id] || 0) + delta);
      const cap = pkg ? PACKAGES[pkg].maxExtraTotes : null;
      if (id === 'tote' && cap != null) n = Math.min(n, cap);
      const dcap = pkg ? PACKAGES[pkg].maxExtraDollies : null;
      if (id === 'dolly' && dcap != null) n = Math.min(n, dcap);
      return { ...a, [id]: n };
    });
  }
  function addonTotal() {
    return ADDONS.reduce((sum, a) => sum + a.price * (addons[a.id] || 0), 0);
  }
  const zones = surchargeFor(fromAddress, toAddress);
  const unlisted = [];
  if (zones.from.zip && zones.from.fee === null) unlisted.push(`${zones.from.zip} (drop-off)`);
  if (zones.to.zip && zones.to.fee === null) unlisted.push(`${zones.to.zip} (pickup)`);
  const feeParts = [];
  if (zones.from.fee > 0) feeParts.push(`drop-off ${zones.from.zip} +${money(zones.from.fee)}`);
  if (zones.to.fee > 0) feeParts.push(`pickup ${zones.to.zip} +${money(zones.to.fee)}`);
  function subtotal() {
    return (pkg ? PACKAGES[pkg].price : 0) + addonTotal() + zones.knownTotal;
  }
  function tax() {
    return subtotal() * TAX_RATE;
  }
  function total() {
    return subtotal() + tax();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (!pkg || !deliveryDate || !pickupDate || !name || !phone || !fromAddress || !toAddress) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    if (!zones.from.zip || !zones.to.zip) {
      setSubmitError('Please include the ZIP code in both addresses.');
      return;
    }
    if (!agreedToTerms) {
      setSubmitError('Please check the authorization box to continue.');
      return;
    }
    if (!cardRef.current) {
      setSubmitError('Payment form is still loading — give it a second and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const tokenResult = await cardRef.current.tokenize();
      if (tokenResult.status !== 'OK') {
        throw new Error(tokenResult.errors?.[0]?.message || 'Card details invalid');
      }

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          pkg,
          addons,
          deliveryDate,
          pickupDate,
          deliveryWindow,
          name,
          phone,
          email,
          fromAddress,
          toAddress,
          notes,
          agreedToTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit reservation');
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="book-wrap" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--tote)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px', fontWeight: 700 }}>✓</div>
        <h1 style={{ fontSize: 24 }}>Request received — thanks!</h1>
        <p style={{ color: '#4c4a42', marginTop: 10, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
          Your card is securely saved but <strong>has not been charged</strong>. We're reviewing your dates now
          and will text or call shortly. Once we confirm, we'll charge the card on file for the rental total.
        </p>
        <a href="/" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>Back to homepage</a>
      </div>
    );
  }

  return (
    <>
      <div className="book-header">
        <div className="wrap book-header-grid">
          <div>
            <SiteLogo height={56} />
            <div style={{ height: 14 }} />
            <a className="back-link" href="/">← Back to home</a>
            <h1>Reserve your totes</h1>
            <p>We'll securely save your card and review your dates before anything is charged.</p>
          </div>
          <div className="book-motto">
            <div className="motto-big">No tape, no flimsy cardboard, no mess.</div>
            <div className="motto-sub">You're making the simple, clean, and easy choice.</div>
          </div>
        </div>
      </div>

      <form className="book-wrap" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title"><span className="num">1</span> Choose your package</div>
          {Object.entries(PACKAGES).map(([key, p]) => (
            <label key={key} className={`pkg-choice${key === 'home' ? ' featured' : ''}${pkg === key ? ' selected' : ''}`}>
              <input type="radio" name="package" checked={pkg === key} onChange={() => { setPkg(key); const c = PACKAGES[key].maxExtraTotes; const d = PACKAGES[key].maxExtraDollies; setAddons((a) => ({ ...a, ...(c != null ? { tote: Math.min(a.tote || 0, c) } : {}), ...(d != null ? { dolly: Math.min(a.dolly || 0, d) } : {}) })); }} />
              <div className="info">
                <div className="title-row"><span className="title">{p.name}{key === 'home' && <span className="most-booked">Most booked</span>}</span><span className="price">${p.price}</span></div>
                <div className="desc">{p.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="form-section">
          <div className="form-section-title"><span className="num">2</span> Dates</div>
          <div className="field-row">
            <div className="field">
              <label>Totes delivered on</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>Preferred window</label>
              <input type="text" placeholder="e.g. 8–10am" value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Totes picked up on</label>
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title"><span className="num">3</span> Add-ons (optional)</div>
          {!pkg && <div className="addon-lock">Add-ons are available with a package. Choose a package above first.</div>}
          {ADDONS.map((a) => (
            <div className="addon-row" key={a.id}>
              <span className="name">{a.name}<span className="price">{money(a.price)}</span>{a.note && <span className="price"> · {a.note}</span>}{a.id === 'dolly' && pkg && PACKAGES[pkg].maxExtraDollies != null && <span className="price"> · up to {PACKAGES[pkg].maxExtraDollies} with this package</span>}{a.id === 'tote' && pkg && PACKAGES[pkg].maxExtraTotes != null && <span className="price"> · up to {PACKAGES[pkg].maxExtraTotes} with this package</span>}</span>
              <div className="stepper">
                <button type="button" disabled={!pkg} onClick={() => changeAddon(a.id, -1)}>−</button>
                <span className="count">{addons[a.id] || 0}</span>
                <button type="button" disabled={!pkg} onClick={() => changeAddon(a.id, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="form-section">
          <div className="form-section-title"><span className="num">4</span> Your info</div>
          <div className="field">
            <label>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" required />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(432) 555-0100" required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
          </div>
          <div className="field">
            <label>Where are you moving from? <span style={{ color: '#8a8676', fontWeight: 400 }}>(we deliver your totes here)</span></label>
            <AddressInput value={fromAddress} onChange={setFromAddress} placeholder="Start typing your address" required />
          </div>
          <div className="field">
            <label>Where are you moving to? <span style={{ color: '#8a8676', fontWeight: 400 }}>(we pick up your totes here)</span></label>
            <AddressInput value={toAddress} onChange={setToAddress} placeholder="Start typing your address" required />
          </div>
          <div className="field">
            <label>Anything else we should know?</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, stairs, flexible dates, etc." />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title"><span className="num">5</span> Card on file</div>
          <p style={{ fontSize: 13, color: '#6b6759', marginBottom: 10 }}>
            Secured by Square. <strong>Your card will not be charged now</strong> — we save it, confirm your
            reservation, and only then charge the rental total shown below.
          </p>
          <div id="card-container"></div>
          {cardError && <div style={{ color: 'var(--rust)', fontSize: 13, marginTop: 8 }}>{cardError}</div>}
        </div>

        <div className="form-section">
          <div className="summary-box">
            <div className="summary-row"><span>Package</span><span>{pkg ? `${PACKAGES[pkg].name} — ${money(PACKAGES[pkg].price)}` : '—'}</span></div>
            <div className="summary-row"><span>Add-ons</span><span>{money(addonTotal())}</span></div>
            {zones.knownTotal > 0 && (
              <div className="summary-row"><span>Delivery area fee ({feeParts.join(', ')})</span><span>{money(zones.knownTotal)}</span></div>
            )}
            <div className="summary-row"><span>Texas sales tax (8.25%)</span><span>{money(tax())}</span></div>
            <div className="summary-row total"><span>Total if confirmed</span><span>{money(total())}{unlisted.length > 0 ? ' + area fee' : ''}</span></div>
            {unlisted.length > 0 && (
              <p className="summary-note" style={{ marginTop: 10 }}>
                ZIP {unlisted.join(' and ')} isn't on our delivery list yet. We'll email you the area fee to approve before anything is charged.
              </p>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="consent-box">
            <h4>Before you submit</h4>
            <ul>
              <li><strong>Your card is saved, not charged.</strong> We charge the rental only after we review and approve your request.</li>
              <li><strong>Cancel or reschedule free</strong> with {POLICY.cancelFreeHours}+ hours' notice before delivery. <a href="/fees" target="_blank" rel="noopener">Details</a></li>
              <li>Have everything emptied and ready on pickup day. Late, missing or damaged equipment carries fees. <a href="/fees" target="_blank" rel="noopener">See all fees</a></li>
            </ul>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.6, color: '#4c4a42' }}>
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              I have read and understand the{' '}
              <a href="/fees" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Fees &amp; Charges</a>,{' '}
              <a href="/terms" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Terms &amp; Conditions</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
              I authorize Midland Moving Box Co. to securely store my card with Square, to charge it for this
              rental once confirmed, and to charge it for any extension I approve and for the fees described on the Fees &amp; Charges page.
            </span>
          </label>
        </div>

        {submitError && <div className="pay-error">{submitError}</div>}

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Reservation Request'}
        </button>
      </form>
    </>
  );
}
