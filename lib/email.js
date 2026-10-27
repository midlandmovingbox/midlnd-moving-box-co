// Server-side only. Sends email through Resend (https://resend.com) using plain fetch.
// Email problems must NEVER break a booking, so every function swallows errors.

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'midlandmovingbox@gmail.com';
const FROM = process.env.EMAIL_FROM || 'Midland Moving Box Co. <reservations@midlandmovingbox.com>';
const SITE_URL = process.env.SITE_URL || 'https://midlandmovingbox.com';
const PHONE = process.env.BUSINESS_PHONE || '';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '$' + Number(n).toFixed(2);

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !to) return { ok: false, skipped: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: OWNER_EMAIL, subject, html }),
    });
    if (!res.ok) {
      console.error('email send failed:', res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('email send error:', err);
    return { ok: false };
  }
}

function wrap(heading, body) {
  const contact = `Questions? Reply to this email${PHONE ? ` or call/text ${esc(PHONE)}` : ''}.`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a17">
  <div style="background:#1a1a17;color:#F5B800;padding:16px 20px;font-weight:bold;letter-spacing:.04em">MIDLAND MOVING BOX CO.</div>
  <div style="padding:22px 20px;border:1px solid #e6e2d6;border-top:0">
    <h2 style="margin:0 0 12px">${heading}</h2>${body}
    <p style="color:#6b6759;font-size:13px;margin-top:24px">${contact}</p>
  </div></div>`;
}

const fee = (r) => Number(r.delivery_surcharge || 0) + Number(r.pickup_surcharge || 0) + Number(r.quote_fee || 0);

function summary(r) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0">
  <tr><td style="padding:4px 0;color:#6b6759">Package</td><td style="text-align:right">${esc(r.package_name || r.package)}</td></tr>
  <tr><td style="padding:4px 0;color:#6b6759">Delivery</td><td style="text-align:right">${esc(r.delivery_date)}${r.delivery_window ? ' (' + esc(r.delivery_window) + ')' : ''}</td></tr>
  <tr><td style="padding:4px 0;color:#6b6759">Pickup</td><td style="text-align:right">${esc(r.pickup_date)}</td></tr>
  <tr><td style="padding:4px 0;color:#6b6759">Moving from (delivery)</td><td style="text-align:right">${esc(r.from_address || r.address)}</td></tr>
  ${r.to_address ? `<tr><td style="padding:4px 0;color:#6b6759">Moving to (pickup)</td><td style="text-align:right">${esc(r.to_address)}</td></tr>` : ''}
  ${fee(r) > 0 ? `<tr><td style="padding:4px 0;color:#6b6759">Delivery area fee</td><td style="text-align:right">${money(fee(r))}</td></tr>` : ''}
  <tr><td style="padding:4px 0;color:#6b6759"><strong>Total (incl. tax)</strong></td><td style="text-align:right"><strong>${money(r.total)}</strong></td></tr></table>`;
}

const PKG = { small: 'Small Move', home: 'Home Move', big: 'Big Move' };
const withName = (r) => ({ ...r, package_name: PKG[r.package] || r.package });

export function emailRequestReceived(r) {
  r = withName(r);
  return sendEmail({
    to: r.email,
    subject: 'We got your tote reservation request',
    html: wrap(
      'We got your request',
      `<p>Thanks, ${esc(r.name)}! Your card is saved but <strong>has not been charged</strong>. We'll review your request and email you as soon as it's confirmed.</p>
      ${r.needs_quote ? `<p><strong>One of your addresses is outside our standard delivery area.</strong> We'll email you the delivery fee for it, and nothing is charged until you approve that fee. The total below doesn't include it yet.</p>` : ''}${summary(r)}`
    ),
  });
}

export function emailOwnerNewRequest(r) {
  r = withName(r);
  return sendEmail({
    to: OWNER_EMAIL,
    subject: `New tote request: ${r.package_name} - ${r.name}`,
    html: wrap(
      'New reservation request',
      `<p><strong>${esc(r.name)}</strong><br>${esc(r.phone)}${r.email ? '<br>' + esc(r.email) : ''}</p>${summary(r)}
      ${r.notes ? `<p><strong>Notes:</strong> ${esc(r.notes)}</p>` : ''}
      <p><a href="${SITE_URL}/admin" style="background:#F5B800;color:#1a1a17;padding:10px 16px;text-decoration:none;font-weight:bold;display:inline-block">Review in admin</a></p>`
    ),
  });
}

export function emailConfirmed(r) {
  r = withName(r);
  return sendEmail({
    to: r.email,
    subject: "You're booked - Midland Moving Box Co.",
    html: wrap(
      "You're booked!",
      `<p>Good news, ${esc(r.name)}: your reservation is confirmed and we charged ${money(r.total)} to your ${esc(r.square_card_brand || 'card')} ending ${esc(r.square_card_last4 || '----')}.</p>${summary(r)}
      <p>We'll bring your totes on the delivery date and pick them up on the pickup date. If we need to charge anything extra (like an additional week), we'll let you know first.</p>`
    ),
  });
}

export function emailDeclined(r, reasonText, note) {
  return sendEmail({
    to: r.email,
    subject: 'About your tote reservation request',
    html: wrap(
      "We couldn't fit this one in",
      `<p>Hi ${esc(r.name)}, unfortunately we can't fulfill your reservation request. <strong>Your card was not charged.</strong></p>
      ${reasonText ? `<p>${esc(reasonText)}</p>` : ''}
      ${note ? `<p style="background:#f7f5ee;border-left:3px solid #F5B800;padding:10px 12px"><strong>A note from us:</strong><br>${esc(note).replace(/\n/g, '<br>')}</p>` : ''}
      <p>If you'd like to try different dates or have questions, just reply to this email.</p>`
    ),
  });
}

export function emailQuote(r) {
  r = withName(r);
  return sendEmail({
    to: r.email,
    subject: 'Please approve your delivery fee - Midland Moving Box Co.',
    html: wrap(
      'One quick thing: approve your delivery fee',
      `<p>Hi ${esc(r.name)}, one of your addresses is outside our standard delivery area, so your reservation includes an area fee of <strong>${money(fee(r))}</strong>. Your new total is <strong>${money(r.total)}</strong>.</p>
      ${summary(r)}
      <p><strong>Reply "OK" to this email to approve</strong> and we'll confirm your reservation and charge your card on file. Nothing has been charged yet. If that doesn't work for you, just reply and we'll sort it out.</p>`
    ),
  });
}
