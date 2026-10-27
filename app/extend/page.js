'use client';

import { useEffect, useState } from 'react';
import SiteLogo from '../../components/SiteLogo';
import { POLICY } from '../../lib/policy';

export default function Extend() {
  const [order, setOrder] = useState('');
  const [email, setEmail] = useState('');
  const [weeks, setWeeks] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get('order');
    if (o) setOrder(o);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order, email, weeks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <>
      <div className="book-header">
        <div className="wrap">
          <SiteLogo height={56} />
          <h1 style={{ marginTop: 18 }}>Need more time?</h1>
          <p>Ask for extra weeks with your totes. Nothing is charged until we confirm with you.</p>
        </div>
      </div>
      <div className="book-wrap">
        {done ? (
          <div className="form-section">
            <h2 style={{ fontSize: 30 }}>Request sent.</h2>
            <p style={{ lineHeight: 1.6 }}>
              If your order number and email match a confirmed reservation, you'll get an email shortly. We'll confirm
              the extra time with you before anything is charged to your card on file.
            </p>
            <a href="/" className="btn-primary" style={{ display: 'inline-block', marginTop: 12 }}>Back to homepage</a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="form-section">
              <div className="field">
                <label>Order number</label>
                <input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="MMB-1A2B3C4D" required />
                <div className="summary-note" style={{ marginTop: 6 }}>It's in your confirmation email.</div>
              </div>
              <div className="field">
                <label>Email you booked with</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label>Extra weeks</label>
                <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((w) => <option key={w} value={w}>{w} week{w > 1 ? 's' : ''}</option>)}
                </select>
                <div className="summary-note" style={{ marginTop: 6 }}>
                  ${POLICY.extensionPerToteWeek.toFixed(2)} per tote, per week, plus sales tax. Your pickup date moves out by the same amount.
                </div>
              </div>
            </div>
            {error && <div className="pay-error">{error}</div>}
            <button type="submit" className="submit-btn" disabled={busy}>{busy ? 'Sending…' : 'Request extension'}</button>
          </form>
        )}
      </div>
    </>
  );
}
