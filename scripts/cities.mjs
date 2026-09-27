// The cities the site knows. The page has a matching table; keep the keys in step.
export const CITIES = {
  utrecht: {
    lat: 52.0907, lon: 5.1214, tz: "Europe/Amsterdam",
    feeds: { a: "https://www.dutchnews.nl/feed/", b: "https://www.rtvutrecht.nl/rss/nieuws.xml" }
  },
  nyc: {
    lat: 40.7128, lon: -74.0060, tz: "America/New_York",
    feeds: { a: "https://www.amny.com/feed/", b: "https://www.thecity.nyc/feed/" }
  }
};
export const UA = { "user-agent": "utrecht-news-and-weather (github.com/talmanjoseph-creator/utrecht-news-and-weather)" };
