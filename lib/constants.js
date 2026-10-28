export const PACKAGES = {
  small: { name: 'Small Move', desc: '20 totes · 1 dolly', price: 109, totes: 20, dollies: 1, maxExtraTotes: 15, maxExtraDollies: 2 },
  home: { name: 'Home Move', desc: '40 totes · 2 dollies', price: 179, totes: 40, dollies: 2, maxExtraTotes: 15, maxExtraDollies: 2 },
  big: { name: 'Big Move', desc: '60 totes · 3 dollies', price: 239, totes: 60, dollies: 3, maxExtraTotes: null, maxExtraDollies: null },
};

export const ADDONS = [
  { id: 'tote', name: 'Extra tote (single)', price: 4 },
  { id: 'dolly', name: 'Extra tote dolly', price: 12 },
  { id: 'blankets', name: 'Moving blankets (set of 6)', price: 15, note: 'Each blanket is 40" x 50"' },
];

export const TAX_RATE = 0.0825;

export function computeTotals(pkgKey, addonCounts, surcharge = 0) {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) throw new Error('Unknown package: ' + pkgKey);
  let addonsTotal = 0;
  const cleanAddons = {};
  for (const [id, qty] of Object.entries(addonCounts || {})) {
    const def = ADDONS.find((a) => a.id === id);
    let n = Math.max(0, parseInt(qty, 10) || 0);
    if (id === 'tote' && pkg.maxExtraTotes != null) n = Math.min(n, pkg.maxExtraTotes);
    if (id === 'dolly' && pkg.maxExtraDollies != null) n = Math.min(n, pkg.maxExtraDollies);
    if (def && n > 0) {
      addonsTotal += def.price * n;
      cleanAddons[id] = n;
    }
  }
  const subtotal = pkg.price + addonsTotal + (Number(surcharge) || 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total, cleanAddons, totes: pkg.totes };
}

// Returns an error message if add-ons exceed the package's limits, otherwise null.
export function addonLimitError(pkgKey, addonCounts) {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) return 'Unknown package';
  const a = addonCounts || {};
  const t = parseInt(a.tote, 10) || 0;
  const d = parseInt(a.dolly, 10) || 0;
  if (pkg.maxExtraTotes != null && t > pkg.maxExtraTotes) return `The ${pkg.name} allows up to ${pkg.maxExtraTotes} extra totes. For more, choose a larger package.`;
  if (pkg.maxExtraDollies != null && d > pkg.maxExtraDollies) return `The ${pkg.name} allows up to ${pkg.maxExtraDollies} extra dollies. For more, choose a larger package.`;
  return null;
}
