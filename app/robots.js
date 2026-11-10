export default function robots() {
  const priv = ['/admin', '/api/', '/extend'];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: priv },
      // AI search and assistant crawlers are welcome so people can be pointed to us.
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'], allow: '/', disallow: priv },
    ],
    sitemap: 'https://midlandmovingbox.com/sitemap.xml',
    host: 'https://midlandmovingbox.com',
  };
}
