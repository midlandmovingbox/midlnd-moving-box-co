export const PACKAGES = {
  small: { name: 'Small Move', desc: '20 totes · 1 dolly', price: 109, totes: 20, dollies: 1, maxExtraTotes: 15 },
  home: { name: 'Home Move', desc: '40 totes · 2 dollies', price: 179, totes: 40, dollies: 2, maxExtraTotes: 15 },
  big: { name: 'Big Move', desc: '60 totes · 3 dollies', price: 239, totes: 60, dollies: 3, maxExtraTotes: null },
};

export const ADDONS = [
  { id: 'tote', name: 'Extra tote (single)', price: 4 },
  { id: 'dolly', name: 'Extra tote dolly', price: 12 },
  { id: 'blankets', name: 'Moving blankets (set of 6)', price: 15 },
  { id: 'wardrobe', name: 'Wardrobe box', price: 18 },
  { id: 'tv', name: 'TV box, up to 65"', price: 20 },
  { id: 'wrap', name: 'Stretch wrap roll', price: 8 },
  { id: 'mattress', name: 'Mattress bag', price: 10 },
  { id: 'kit', name: 'Kitchen packing kit', price: 14 },
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
