// Customer-facing order number = first 8 hex characters of the reservation id, e.g. MMB-1A2B3C4D.
export function orderNumber(id) {
  return id ? 'MMB-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase() : '';
}

// Turns what a customer typed into the 8-char prefix, or null if it isn't one.
export function parseOrderNumber(input) {
  const hex = String(input || '').toUpperCase().replace(/^\s*MMB[-\s]*/, '').replace(/[^A-F0-9]/g, '');
  return /^[A-F0-9]{8}$/.test(hex) ? hex.toLowerCase() : null;
}
