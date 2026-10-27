// Server-side only. Sends email through Resend (https://resend.com) using plain fetch.
// Email problems must NEVER break a booking, so every function swallows errors.

import { zoneFor } from './zones';
import { orderNumber } from './order';

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
  <div style="background:#1D1D1B;padding:16px 20px"><img src="${SITE_URL}/logo-lockup.png" alt="MIDLAND MOVING BOX CO." height="52" style="height:52px;width:auto;display:block;color:#F5F2EA;font-weight:bold"></div>
  <div style="padding:22px 20px;border:1px solid #e6e2d6;border-top:0">
    <h2 style="margin:0 0 12px">${heading}</h2>${body}
    <p style="color:#6b6759;font-size:13px;margin-top:24px">${contact}</p>
  </div></div>`;
}

const fee = (r) => Number(r.delivery_surcharge || 0) + Number(r.pickup_surcharge || 0) + Number(r.quote_fee || 0);

function summary(r) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0">
  ${r.id ? `<tr><td style="padding:4px 0;color:#6b6759">Order number</td><td style="text-align:right"><strong>${esc(orderNumber(r.id))}</strong></td></tr>` : ''}
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

function unlistedText(r) {
  const parts = [];
  const f = zoneFor(r.from_address || r.address);
  const t = zoneFor(r.to_address);
  if (f.zip && f.fee === null) parts.push(`${f.zip} (drop-off)`);
  if (t.zip && t.fee === null) parts.push(`${t.zip} (pickup)`);
  return parts.join(' and ');
}

function agreedBlock() {
  return `<p style="margin-top:18px;font-size:12px;color:#6b6759">Fees and policies: <a href="${SITE_URL}/fees">Fees &amp; Charges</a> · <a href="${SITE_URL}/terms">Terms &amp; Conditions</a> · <a href="${SITE_URL}/privacy">Privacy Policy</a></p>`;
}

function extendLine(r) {
  return `<p style="font-size:13px;color:#4c4a42">Need more time? <a href="${SITE_URL}/extend?order=${esc(orderNumber(r.id))}">Request an extension</a> (order ${esc(orderNumber(r.id))}).</p>`;
}

export function emailRequestReceived(r) {
  r = withName(r);
  const unlisted = r.needs_quote ? unlistedText(r) : '';
  return sendEmail({
    to: r.email,
    subject: 'We got your tote reservation request',
    html: wrap(
      'We got your request',
      `<p>Thanks, ${esc(r.name)}! Your card is saved but <strong>has not been charged</strong>. We'll review your request and email you as soon as it's confirmed.</p>
      ${unlisted ? `<p><strong>ZIP ${esc(unlisted)} isn't on our delivery list yet.</strong> We'll email you the delivery fee for it, and nothing is charged until you approve that fee. The total below doesn't include it yet.</p>` : ''}${summary(r)}${agreedBlock()}`
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
      <p><a href="${SITE_URL}/admin" style="background:#C5512D;color:#ffffff;padding:10px 16px;text-decoration:none;font-weight:bold;display:inline-block">Review in admin</a></p>`
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
      <p>We'll bring your totes on the delivery date and pick them up on the pickup date. If we need to charge anything extra (like an additional week), we'll let you know first.</p>${extendLine(r)}${agreedBlock()}`
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
      ${note ? `<p style="background:#f7f5ee;border-left:3px solid #FFC72C;padding:10px 12px"><strong>A note from us:</strong><br>${esc(note).replace(/\n/g, '<br>')}</p>` : ''}
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

function itemsTable(items, total) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0">
  ${items.map((i) => `<tr><td style="padding:4px 0">${esc(i.label)}</td><td style="text-align:right">${money(i.amount)}</td></tr>`).join('')}
  <tr><td style="padding:8px 0 0;border-top:1px solid #e6e2d6"><strong>Total charged</strong></td><td style="text-align:right;border-top:1px solid #e6e2d6;padding-top:8px"><strong>${money(total)}</strong></td></tr></table>`;
}

const cardLine = (r) => `${esc(r.square_card_brand || 'card')} ending ${esc(r.square_card_last4 || '----')}`;

export function emailDelivered(r) {
  return sendEmail({
    to: r.email,
    subject: 'Your totes were delivered - please check the count',
    html: wrap(
      'Your totes are here',
      `<p>Hi ${esc(r.name)}, we delivered:</p>
      <p style="font-size:18px"><strong>${r.delivered_totes} totes</strong> and <strong>${r.delivered_dollies} ${r.delivered_dollies === 1 ? 'dolly' : 'dollies'}</strong></p>
      <p>If that count doesn't match what you received, <strong>reply to this email within 24 hours</strong>. After that we treat this count as correct. Your pickup date is <strong>${esc(r.pickup_date)}</strong>. Please have everything emptied and ready.</p>${extendLine(r)}`
    ),
  });
}

export function emailPickup(r, { deliveredTotes, deliveredDollies, items, fee }) {
  return sendEmail({
    to: r.email,
    subject: 'We picked up your totes',
    html: wrap(
      'Pickup complete',
      `<p>Hi ${esc(r.name)}, thanks for renting with us. Here's the count:</p>
      <table style="font-size:14px;margin:10px 0"><tr><td style="padding:2px 14px 2px 0;color:#6b6759">Delivered</td><td>${deliveredTotes} totes, ${deliveredDollies} dollies</td></tr>
      <tr><td style="padding:2px 14px 2px 0;color:#6b6759">Picked up</td><td>${r.picked_up_totes} totes, ${r.picked_up_dollies} dollies</td></tr></table>
      ${fee > 0 ? `<p>Some equipment was missing at pickup, so these were charged to your ${cardLine(r)}:</p>${itemsTable(items, fee)}<p style="font-size:13px;color:#6b6759">If you think this is a mistake, reply within 7 days and we'll review it.</p>` : '<p>Everything came back. Nothing further is owed, unless our inspection finds damage, in which case we\'ll email you an itemized receipt within 7 days.</p>'}`
    ),
  });
}

export function emailFees(r, { intro, items, total }) {
  return sendEmail({
    to: r.email,
    subject: 'Receipt for additional charges - Midland Moving Box Co.',
    html: wrap(
      'Itemized receipt',
      `<p>Hi ${esc(r.name)}, ${esc(intro)}</p>${itemsTable(items, total)}<p>Charged to your ${cardLine(r)}.</p>
      <p style="font-size:13px;color:#6b6759">If you think this is a mistake, reply within 7 days and we'll review it.</p>`
    ),
  });
}

export function emailRescheduled(r, fee) {
  return sendEmail({
    to: r.email,
    subject: 'Your reservation was rescheduled',
    html: wrap(
      'Reservation rescheduled',
      `<p>Hi ${esc(r.name)}, your reservation has new dates:</p>${summary(r)}
      ${fee > 0 ? `<p>A ${money(fee)} reschedule fee, including sales tax (less than 72 hours' notice), was charged to your ${cardLine(r)}.</p>` : ''}`
    ),
  });
}

export function emailCancelled(r, { fee, refunded }) {
  return sendEmail({
    to: r.email,
    subject: 'Your reservation was cancelled',
    html: wrap(
      'Reservation cancelled',
      `<p>Hi ${esc(r.name)}, your reservation has been cancelled.</p>
      ${refunded > 0 ? `<p>We refunded <strong>${money(refunded)}</strong> to your ${cardLine(r)}. It can take a few business days to appear.</p>` : ''}
      ${fee > 0 ? `<p>Because it was cancelled with less than 72 hours' notice, a ${money(fee)} cancellation fee (including sales tax) applies.</p>` : '<p>No fee applies.</p>'}`
    ),
  });
}

export function emailExtensionAck(r, weeks) {
  return sendEmail({
    to: r.email,
    subject: 'We got your extension request',
    html: wrap('Extension request received', `<p>Hi ${esc(r.name)}, we got your request to extend order <strong>${esc(orderNumber(r.id))}</strong> by <strong>${weeks} week${weeks > 1 ? 's' : ''}</strong>.</p><p>Nothing has been charged. We'll confirm with you by email first, and once it's confirmed we'll charge the card on file and send your new pickup date.</p>`),
  });
}

export function emailOwnerExtension(r, weeks, amount) {
  return sendEmail({
    to: OWNER_EMAIL,
    subject: `Extension request: ${orderNumber(r.id)} - ${r.name} (${weeks} wk)`,
    html: wrap('Extension request', `<p><strong>${esc(r.name)}</strong> (${esc(r.email)}${r.phone ? ', ' + esc(r.phone) : ''}) wants <strong>${weeks} more week${weeks > 1 ? 's' : ''}</strong> on order <strong>${esc(orderNumber(r.id))}</strong>.</p><p>Current pickup: ${esc(r.pickup_date)}. Estimated charge: about ${money(amount)} including tax.</p><p>Nothing is charged until you approve it in admin (Confirmed tab, Extend).</p><p><a href="${SITE_URL}/admin" style="background:#C5512D;color:#ffffff;padding:10px 16px;text-decoration:none;font-weight:bold;display:inline-block">Open admin</a></p>`),
  });
}
