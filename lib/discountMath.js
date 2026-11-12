// Shared by the booking page (preview) and the server (the real calculation).
import { PACKAGES } from './constants';

export const normalizeCode = (c) => String(c || '').trim().toUpperCase().replace(/\s+/g, '');

// code: { type: 'percent' | 'amount', value, applies_to: 'base' | 'total' }
// subtotal: package + add-ons + delivery area fees, before tax.
// rentals: package + add-ons (no delivery area fees).
// 'base' = package price only. 'rentals' = package + add-ons. 'total' = everything in the subtotal.
export function discountAmount(code, pkgKey, subtotal, rentals = subtotal) {
  if (!code || !PACKAGES[pkgKey]) return 0;
  let amt;
  if (code.type === 'percent') {
    const of = code.applies_to === 'base' ? PACKAGES[pkgKey].price : code.applies_to === 'rentals' ? rentals : subtotal;
    amt = (of * Number(code.value)) / 100;
  } else {
    amt = Number(code.value);
  }
  amt = Math.min(Math.max(0, amt), subtotal);
  return Math.round(amt * 100) / 100;
}

export function describeCode(c) {
  const v = Number(c.value);
  if (c.type === 'amount') return `$${v.toFixed(2)} off`;
  return `${v}% off ${c.applies_to === 'base' ? 'the package price' : c.applies_to === 'rentals' ? 'your rental' : 'your total'}`;
}
