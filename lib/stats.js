// Pure number-crunching for the admin dashboard (no database calls in here).
import { TAX_RATE } from './constants';
import { expectedEquipment } from './policy';
import { extractZip } from './zones';

const r2 = (n) => Math.round(n * 100) / 100;
const DAY = 86400000;

export const DEFAULT_SETTINGS = {
  totes_owned: 50,
  tote_cost_total: 377.79,
  dollies_owned: 4,
  dolly_cost_total: 146.13,
  mpg: 18.23,
  gas_price: 3.58, // Texas average; edit to your Midland price on the dashboard
  hourly_rate: 20, // placeholder; edit on the dashboard
  fee_pct: 2.9,
  fee_flat: 0.3,
};

export function rangeStart(range, now) {
  if (range === '30d') return new Date(now.getTime() - 30 * DAY);
  if (range === 'year') return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  if (range === 'all') return null;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); // 'month'
}

const dateStr = (d) => d.toISOString().slice(0, 10);

export function computeStats({ reservations, charges, trips, settings, range = 'month', now = new Date() }) {
  const S = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const today = dateStr(now);
  const resById = new Map(reservations.map((r) => [r.id, r]));

  // ---- refunds, matched to the payment they came from (note holds "[paymentId]")
  const refundedBy = {};
  for (const c of charges) {
    if (Number(c.amount) < 0) {
      const m = String(c.note || '').match(/\[([^\]]+)\]/);
      if (m) refundedBy[m[1]] = (refundedBy[m[1]] || 0) + Math.abs(Number(c.amount));
    }
  }

  // ---- every payment we've actually collected
  const payments = [];
  for (const r of reservations) {
    if (r.square_payment_id) {
      payments.push({ id: r.square_payment_id, resId: r.id, amount: Number(r.total), tax: Number(r.tax), date: new Date(r.created_at), kind: 'rental' });
    }
  }
  for (const c of charges) {
    const amt = Number(c.amount);
    if (amt > 0) payments.push({ id: c.square_payment_id, resId: c.reservation_id, amount: amt, tax: amt - amt / (1 + TAX_RATE), date: new Date(c.created_at), kind: 'extra' });
  }
  for (const p of payments) {
    p.refunded = Math.min(p.amount, refundedBy[p.id] || 0);
    p.net = p.amount - p.refunded;
    p.fee = p.amount * (S.fee_pct / 100) + S.fee_flat; // Square keeps its fee even on refunds
  }

  // orders whose rental payment was refunded in full don't count as sales/orders
  const fullyRefundedOrders = new Set(payments.filter((p) => p.kind === 'rental' && p.refunded >= p.amount - 0.01).map((p) => p.resId));

  const gasPerMile = S.mpg > 0 ? S.gas_price / S.mpg : 0;

  function moneyFor(from) {
    const inR = (d) => !from || d >= from;
    const ps = payments.filter((p) => inR(p.date));
    const gross = ps.reduce((a, p) => a + p.amount, 0);
    const refunds = ps.reduce((a, p) => a + p.refunded, 0);
    const netCollected = gross - refunds;
    const netTax = ps.reduce((a, p) => a + (p.amount > 0 ? p.tax * (p.net / p.amount) : 0), 0);
    const netSales = netCollected - netTax;
    const fees = ps.reduce((a, p) => a + p.fee, 0);
    const feesOnRefunded = ps.filter((p) => p.refunded > 0).reduce((a, p) => a + p.fee, 0);
    const ts = trips.filter((t) => !from || new Date(t.logged_on + 'T12:00:00Z') >= from);
    const miles = ts.reduce((a, t) => a + Number(t.miles || 0), 0);
    const minutes = ts.reduce((a, t) => a + Number(t.minutes || 0), 0);
    const gas = miles * gasPerMile;
    const labor = (minutes / 60) * S.hourly_rate;
    return {
      gross: r2(gross), refunds: r2(refunds), netCollected: r2(netCollected), salesTax: r2(netTax), netSales: r2(netSales),
      fees: r2(fees), feesOnRefunded: r2(feesOnRefunded), miles: r2(miles), minutes, gas: r2(gas), labor: r2(labor),
      profit: r2(netSales - fees - gas - labor),
    };
  }

  const start = rangeStart(range, now);
  const period = moneyFor(start);
  const lifetime = moneyFor(null);
  const invested = Number(S.tote_cost_total) + Number(S.dolly_cost_total);

  // ---- orders in range (created in range, charged, not fully refunded)
  const orders = reservations.filter((r) => r.square_payment_id && !fullyRefundedOrders.has(r.id) && (!start || new Date(r.created_at) >= start));
  const pkgMix = {};
  const zips = {};
  let days = 0;
  for (const r of orders) {
    pkgMix[r.package] = (pkgMix[r.package] || 0) + 1;
    const z = extractZip(r.from_address || r.address);
    if (z) zips[z] = (zips[z] || 0) + 1;
    days += Math.max(0, Math.round((new Date(r.pickup_date) - new Date(r.delivery_date)) / DAY));
  }
  const orderRevenue = orders.reduce((a, r) => a + Number(r.total), 0);

  // ---- pipeline
  const active = reservations.filter((r) => r.status === 'confirmed' && !r.picked_up_at && !fullyRefundedOrders.has(r.id));
  const out = active.filter((r) => r.delivered_at);
  const eq = (r) => expectedEquipment(r);
  const outTotes = out.reduce((a, r) => a + (r.delivered_totes ?? eq(r).totes), 0);
  const outDollies = out.reduce((a, r) => a + (r.delivered_dollies ?? eq(r).dollies), 0);
  const requested = reservations.filter((r) => r.status === 'requested');
  const dueSoon = active
    .filter((r) => r.pickup_date >= today && r.pickup_date <= dateStr(new Date(now.getTime() + 7 * DAY)))
    .sort((a, b) => (a.pickup_date < b.pickup_date ? -1 : 1))
    .map((r) => ({ id: r.id, name: r.name, pickup_date: r.pickup_date, totes: eq(r).totes }));
  const overdue = active.filter((r) => r.pickup_date < today).map((r) => ({ id: r.id, name: r.name, pickup_date: r.pickup_date }));

  // ---- 14-day equipment demand
  let peak = { totes: 0, dollies: 0, totesWithRequests: 0, dolliesWithRequests: 0, toteDay: null };
  for (let i = 0; i < 14; i++) {
    const d = dateStr(new Date(now.getTime() + i * DAY));
    const on = (r) => r.delivery_date <= d && d <= r.pickup_date;
    const conf = active.filter(on);
    const req = requested.filter(on);
    const t = conf.reduce((a, r) => a + eq(r).totes, 0);
    const dl = conf.reduce((a, r) => a + eq(r).dollies, 0);
    const tr = t + req.reduce((a, r) => a + eq(r).totes, 0);
    const dr = dl + req.reduce((a, r) => a + eq(r).dollies, 0);
    if (t > peak.totes) { peak.totes = t; peak.toteDay = d; }
    if (dl > peak.dollies) peak.dollies = dl;
    peak.totesWithRequests = Math.max(peak.totesWithRequests, tr);
    peak.dolliesWithRequests = Math.max(peak.dolliesWithRequests, dr);
  }

  const tripRows = [...trips]
    .sort((a, b) => (a.logged_on < b.logged_on ? 1 : -1))
    .slice(0, 25)
    .map((t) => ({ ...t, name: t.reservation_id ? (resById.get(t.reservation_id) || {}).name || null : null }));

  return {
    range, settings: S,
    period, lifetime,
    equipment: {
      invested: r2(invested), paidOff: r2(Math.min(invested, Math.max(0, lifetime.profit))), remaining: r2(Math.max(0, invested - lifetime.profit)),
      costPerTote: S.totes_owned ? r2(S.tote_cost_total / S.totes_owned) : 0,
      costPerDolly: S.dollies_owned ? r2(S.dolly_cost_total / S.dollies_owned) : 0,
    },
    orders: { count: orders.length, avgOrder: orders.length ? r2(orderRevenue / orders.length) : 0, avgDays: orders.length ? Math.round((days / orders.length) * 10) / 10 : 0, pkgMix, topZips: Object.entries(zips).sort((a, b) => b[1] - a[1]).slice(0, 5) },
    pipeline: { requested: requested.length, needsQuote: requested.filter((r) => r.needs_quote).length, confirmedUpcoming: active.filter((r) => !r.delivered_at).length, outNow: out.length, dueSoon, overdue },
    inventory: { totesOwned: S.totes_owned, dolliesOwned: S.dollies_owned, totesOut: outTotes, dolliesOut: outDollies, totesAvailable: S.totes_owned - outTotes, dolliesAvailable: S.dollies_owned - outDollies, peak },
    trips: { gasPerMile: r2(gasPerMile * 1000) / 1000, recent: tripRows },
  };
}
