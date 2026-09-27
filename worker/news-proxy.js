/* Utrecht News and Weather — news proxy
 *
 * A Cloudflare Worker that fetches the two RSS feeds the site's ticker uses
 * and returns them as small JSON, with CORS, cached for ten minutes at the
 * edge. Replaces the rss2json free tier.
 *
 *   GET https://<your-worker>.workers.dev/?feed=en   → DutchNews.nl
 *   GET https://<your-worker>.workers.dev/?feed=nl   → RTV Utrecht
 *
 * Response: { "status": "ok", "items": [ { "title": "...", "link": "..." }, … ] }
 */

const FEEDS = {
  en: "https://www.dutchnews.nl/feed/",
  nl: "https://www.rtvutrecht.nl/rss/nieuws.xml"
};

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "cache-control": "public, max-age=600"
};

function text(block, tag){
  const m = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
  if (!m) return "";
  return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
             .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").trim();
}

export default {
  async fetch(request) {
    const url  = new URL(request.url);
    const key  = FEEDS[url.searchParams.get("feed")] ? url.searchParams.get("feed") : "en";
    try {
      const res = await fetch(FEEDS[key], {
        headers: { "user-agent": "utrecht-news-and-weather/1.0 (+github.com/talmanjoseph-creator/utrecht-news-and-weather)" },
        cf: { cacheTtl: 600, cacheEverything: true }
      });
      if (!res.ok) throw new Error("upstream " + res.status);
      const xml   = await res.text();
      const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
        .slice(0, 12)
        .map(m => ({ title: text(m[1], "title"), link: text(m[1], "link") }))
        .filter(i => i.title);
      return new Response(JSON.stringify({ status: "ok", feed: key, items }), { headers: HEADERS });
    } catch (e) {
      return new Response(JSON.stringify({ status: "error", feed: key, items: [], message: String(e) }),
                          { status: 502, headers: HEADERS });
    }
  }
};
