'use client';

import { useEffect, useRef, useState } from 'react';
import { surchargeFor } from '../../lib/zones';
import { feeSummaryLines } from '../../lib/policy';
import AddressInput from '../../components/AddressInput';

const PACKAGES = {
  small: { name: 'Small Move', desc: '20 totes · 1 dolly · 1 bedroom/apartment', price: 109 },
  home: { name: 'Home Move', desc: '40 totes · 2 dollies · 2–3 bedrooms · Most booked', price: 179 },
  big: { name: 'Big Move', desc: '60 totes · 3 dollies · 4+ bedrooms', price: 239 },
};
const ADDONS = [
  { id: 'tote', name: 'Extra tote (single)', price: 4 },
  { id: 'dolly', name: 'Extra tote dolly', price: 12 },
  { id: 'blankets', name: 'Moving blankets (set of 6)', price: 15 },
  { id: 'wardrobe', name: 'Wardrobe box', price: 18 },
  { id: 'tv', name: 'TV box, up to 65"', price: 20 },
  { id: 'wrap', name: 'Stretch wrap roll', price: 8 },
  { id: 'mattress', name: 'Mattress bag', price: 10 },
  { id: 'kit', name: 'Kitchen packing kit', price: 14 },
];
const TAX_RATE = 0.0825;

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
    setAddons((a) => ({ ...a, [id]: Math.max(0, (a[id] || 0) + delta) }));
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
        <div className="wrap">
          <a className="back-link" href="/">← Back to Midland Moving Box Co.</a>
          <h1>Reserve your totes</h1>
          <p>We'll securely save your card and review your dates before anything is charged.</p>
        </div>
      </div>

      <form className="book-wrap" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title"><span className="num">1</span> Choose your package</div>
          {Object.entries(PACKAGES).map(([key, p]) => (
            <label key={key} className="pkg-choice">
              <input type="radio" name="package" checked={pkg === key} onChange={() => setPkg(key)} />
              <div className="info">
                <div className="title-row"><span className="title">{p.name}</span><span className="price">${p.price}</span></div>
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
          {ADDONS.map((a) => (
            <div className="addon-row" key={a.id}>
              <span className="name">{a.name}<span className="price">{money(a.price)}</span></span>
              <div className="stepper">
                <button type="button" onClick={() => changeAddon(a.id, -1)}>−</button>
                <span className="count">{addons[a.id] || 0}</span>
                <button type="button" onClick={() => changeAddon(a.id, 1)}>+</button>
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
            <h4>Before you submit, please read</h4>
            <ul>
              {feeSummaryLines().map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.6, color: '#4c4a42' }}>
            <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              I have read and understand the fees and timelines above and the{' '}
              <a href="/terms" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Terms &amp; Conditions</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
              I authorize Midland Moving Box Co. to securely store my card with Square, to charge it for this
              rental once confirmed, and to charge it for any extension I approve and for the damage, missing
              item, not-ready, late-cancellation and other fees described above.
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
