'use client';

import { useRef, useState } from 'react';

// Address field with autocomplete suggestions (Geoapify). If the key is missing or
// the service is down, it quietly behaves like a normal text box.
function formatResult(r) {
  if (r.housenumber && r.street && r.city && r.state_code && r.postcode) {
    return `${r.housenumber} ${r.street}, ${r.city}, ${r.state_code} ${r.postcode}`;
  }
  return String(r.formatted || '').replace(/, United States of America$/, '');
}

export default function AddressInput({ value, onChange, placeholder, required }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

  function handleChange(e) {
    const v = e.target.value;
    onChange(v);
    if (!key) return;
    clearTimeout(timer.current);
    if (v.trim().length < 4) {
      setItems([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const url =
          'https://api.geoapify.com/v1/geocode/autocomplete?text=' + encodeURIComponent(v) +
          '&filter=countrycode:us&bias=proximity:-102.0779,31.9973&limit=5&format=json&apiKey=' + key;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.results || []).filter((r) => r.postcode).map(formatResult);
        setItems(list);
        setOpen(list.length > 0);
      } catch (err) {
        // autocomplete is a convenience only
      }
    }, 250);
  }

  function pick(text) {
    onChange(text);
    setItems([]);
    setOpen(false);
  }

  return (
    <div className="addr-wrap">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => items.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {open && (
        <ul className="addr-list">
          {items.map((t) => (
            <li key={t} onMouseDown={(e) => { e.preventDefault(); pick(t); }}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
