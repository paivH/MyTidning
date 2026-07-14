// scripts/fetch-news.mjs
// Fetches RSS feeds server-side and writes news.json to the repo root.
// Run by .github/workflows/news.yml every 30 minutes.

import { writeFileSync } from 'node:fs';

const FEEDS = [
  { name: 'SVT', url: 'https://www.svt.se/nyheter/rss.xml' },
  { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
];

const PER_FEED = 5;

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .trim();

const items = [];

for (const feed of FEEDS) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'user-agent': 'gryning-dashboard (github actions)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const matches = [
      ...xml.matchAll(
        /<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g
      ),
    ].slice(0, PER_FEED);
    for (const m of matches) {
      items.push({
        src: feed.name,
        title: decode(m[1]),
        date: new Date(decode(m[2])).toISOString(),
      });
    }
    console.log(`${feed.name}: ${matches.length} items`);
  } catch (e) {
    console.error(`${feed.name} failed: ${e.message}`);
  }
}

writeFileSync(
  'news.json',
  JSON.stringify({ updated: new Date().toISOString(), items }, null, 1)
);
console.log(`wrote news.json with ${items.length} items`);
