// Delivery zones by ZIP code. Edit these lists to change your service area or fees.
// The fee applies to EACH end of the rental (delivery address and pickup address).

export const FREE_ZIPS = ['79701', '79702', '79703', '79704', '79705', '79712'];

export const SURCHARGE_ZIPS = {
  79706: 20,
  79782: 20,
  79765: 20,
  79758: 20,
  79749: 30,
  79783: 30,
  79763: 30,
  79764: 30,
  79761: 30,
  79762: 30,
  79766: 30,
};

// Last 5-digit number in the address (so a 5-digit street number isn't mistaken for the ZIP).
export function extractZip(address) {
  const m = String(address || '').match(/\b\d{5}\b/g);
  return m ? m[m.length - 1] : null;
}

// fee: number (0 = free), or null if the ZIP isn't on our list (needs a manual quote)
export function zoneFor(address) {
  const zip = extractZip(address);
  if (!zip) return { zip: null, fee: null };
  if (FREE_ZIPS.includes(zip)) return { zip, fee: 0 };
  if (SURCHARGE_ZIPS[zip] !== undefined) return { zip, fee: SURCHARGE_ZIPS[zip] };
  return { zip, fee: null };
}

export function surchargeFor(fromAddress, toAddress) {
  const from = zoneFor(fromAddress);
  const to = zoneFor(toAddress);
  return {
    from,
    to,
    knownTotal: (from.fee || 0) + (to.fee || 0),
    needsQuote: from.fee === null || to.fee === null,
  };
}
