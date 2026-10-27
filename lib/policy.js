// ONE place for every fee and rule. The booking page, Terms, FAQ, emails and
// admin all read from here, so changing a number here changes it everywhere.
import { zoneFor } from './zones';
import { TAX_RATE } from './constants';

export const POLICY = {
  version: '2026-10-27',
  extensionPerToteWeek: 2.5,
  toteMissing: 18,
  toteDamaged: 18,
  toteDirty: 15,
  dollyMissing: 100,
  dollyDamaged: 100,
  tripFeeFree: 25, // return trip, free-delivery ZIPs
  tripFeeExtended: 50, // return trip, +$20 / +$30 ZIPs
  tripFeeOutside: 100, // return trip, ZIPs not on our list
  cancelFreeHours: 72,
  cancelFee: 50,
  rescheduleFee: 25,
  chargeWindowDays: 7,
  countWindowHours: 24,
};

// Sales tax: applied to every charge (rental, extra time, equipment fees, trip, cancel, reschedule).
export const taxOn = (amount) => Math.round(Number(amount) * TAX_RATE * 100) / 100;
export const taxed = (amount) => Math.round((Number(amount) + taxOn(amount)) * 100) / 100;

export const usd = (n) => '$' + Number(n).toFixed(2).replace(/\.00$/, '');

// Return-trip fee depends on the pickup address' ZIP
export function tripFeeFor(address) {
  const z = zoneFor(address);
  if (z.fee === 0) return POLICY.tripFeeFree;
  if (z.fee > 0) return POLICY.tripFeeExtended;
  return POLICY.tripFeeOutside;
}

const DOLLIES = { small: 1, home: 2, big: 3 };
const TOTES = { small: 20, home: 40, big: 60 };

// What we should have delivered for a reservation (package + add-ons)
export function expectedEquipment(r) {
  const a = r.addons || {};
  return {
    totes: (TOTES[r.package] || r.totes || 0) + (parseInt(a.tote, 10) || 0),
    dollies: (DOLLIES[r.package] || 0) + (parseInt(a.dolly, 10) || 0),
  };
}

// Bullet list used on the booking page, FAQ and Terms
export function feeSummaryLines() {
  const p = POLICY;
  return [
    `Your card is saved when you submit, but not charged. The rental total is charged only after we approve your request.`,
    `Extra time: ${usd(p.extensionPerToteWeek)} per tote, per week, only when you approve the extension.`,
    `Totes not ready at pickup: one full week at ${usd(p.extensionPerToteWeek)} per tote, plus a return-trip fee if we have to come back (${usd(p.tripFeeFree)} in our free delivery area, ${usd(p.tripFeeExtended)} in our extended area, ${usd(p.tripFeeOutside)} beyond).`,
    `Missing or damaged/unusable tote: ${usd(p.toteMissing)} each. Missing or damaged dolly: ${usd(p.dollyMissing)} each. Very dirty tote: ${usd(p.toteDirty)} each. `,
    `We count what we pick up. We photograph equipment before loading, and missing items found at pickup are charged automatically.`,
    `Texas sales tax (8.25%) is added to the rental and to every fee and charge.`,
    `Any fees are charged within ${p.chargeWindowDays} days of pickup, and we email you an itemized receipt.`,
    `Tell us within ${p.countWindowHours} hours of delivery if the count is off.`,
    `Cancel free with ${p.cancelFreeHours}+ hours' notice; after that, ${usd(p.cancelFee)}. Reschedule free with ${p.cancelFreeHours}+ hours' notice; after that, ${usd(p.rescheduleFee)}.`,
  ];
}
