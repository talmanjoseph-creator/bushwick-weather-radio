// Fetches the ticker's two RSS feeds and writes news.json for the site.
// Run by .github/workflows/data.yml every 15 minutes.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const FEEDS = {
  en: "https://www.dutchnews.nl/feed/",
  nl: "https://www.rtvutrecht.nl/rss/nieuws.xml"
};

function text(block, tag){
  const m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
             .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#8217;/g, "’").trim();
}

const previous = existsSync("news.json") ? JSON.parse(readFileSync("news.json", "utf8")) : {};
const out = { updated: new Date().toISOString() };

for (const [key, url] of Object.entries(FEEDS)){
  try {
    const res = await fetch(url, { headers: { "user-agent": "utrecht-news-and-weather (github.com/talmanjoseph-creator/utrecht-news-and-weather)" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
      .slice(0, 12)
      .map(m => ({ title: text(m[1], "title"), link: text(m[1], "link") }))
      .filter(i => i.title);
    if (!items.length) throw new Error("no items");
    out[key] = items;
    console.log(key, items.length, "headlines");
  } catch (e) {
    // keep the last good list rather than publishing an empty one
    out[key] = previous[key] || [];
    console.log(key, "failed:", e.message, "- kept", out[key].length, "previous");
  }
}

writeFileSync("news.json", JSON.stringify(out, null, 1) + "\n");
