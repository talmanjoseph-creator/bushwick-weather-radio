// Fetches each city's two RSS feeds and writes news-<city>.json for the site.
// Run by .github/workflows/data.yml every 15 minutes.
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { CITIES, UA } from "./cities.mjs";

function text(block, tag){
  const m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
             .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#8217;/g, "’")
             .replace(/&#8216;/g, "‘").replace(/&#8220;|&#8221;/g, '"').trim();
}

for (const [city, cfg] of Object.entries(CITIES)){
  const file = `news-${city}.json`;
  const previous = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const out = { updated: new Date().toISOString() };
  for (const [key, url] of Object.entries(cfg.feeds)){
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const xml = await res.text();
      const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
        .slice(0, 12)
        .map(m => ({ title: text(m[1], "title"), link: text(m[1], "link") }))
        .filter(i => i.title);
      if (!items.length) throw new Error("no items");
      out[key] = items;
      console.log(city, key, items.length, "headlines");
    } catch (e) {
      out[key] = previous[key] || [];   // keep the last good list
      console.log(city, key, "failed:", e.message, "- kept", out[key].length, "previous");
    }
  }
  writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
}
