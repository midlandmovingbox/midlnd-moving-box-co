export default function sitemap() {
  const base = 'https://midlandmovingbox.com';
  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/book`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
