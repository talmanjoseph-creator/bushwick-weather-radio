# News proxy (Cloudflare Worker)

The ticker reads two RSS feeds. Browsers can't fetch RSS cross-origin, so the
site goes through a proxy. Out of the box that's rss2json's free tier, which
rate-limits and can change terms. This Worker replaces it: free, yours, cached.

## Deploy (about two minutes, no command line)

1. Sign in at **dash.cloudflare.com** → **Workers & Pages** → **Create** →
   **Create Worker**.
2. Name it `utrecht-news` (or anything) → **Deploy**.
3. Click **Edit code**, delete the sample, paste in `news-proxy.js`, then
   **Deploy** again.
4. Copy the Worker's URL, e.g. `https://utrecht-news.<you>.workers.dev`.
5. Test it in a browser tab: `…workers.dev/?feed=en` should show JSON with
   headlines.

## Wire it into the site

In `index.html`, find

```js
var NEWS_PROXY = "";
```

and put the Worker URL between the quotes. Push. The site tries the Worker
first and falls back to rss2json if it ever fails.

Free plan limits (100k requests/day) are far beyond what this page needs; the
edge cache means the feeds themselves are fetched at most once every ten
minutes per region.
