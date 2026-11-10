export default function sitemap() {
  const base = 'https://midlandmovingbox.com';
  const page = (path, priority, changeFrequency = 'monthly') => ({ url: base + path, changeFrequency, priority, lastModified: new Date() });
  return [
    page('', 1),
    page('/book', 0.8),
    page('/moving-box-rental-midland-tx', 0.8),
    page('/moving-box-rental-odessa-tx', 0.8),
    page('/moving-tote-rental-vs-cardboard-boxes', 0.7),
    page('/fees', 0.4),
    page('/terms', 0.2, 'yearly'),
    page('/privacy', 0.2, 'yearly'),
  ];
}
