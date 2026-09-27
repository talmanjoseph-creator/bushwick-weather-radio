// Fetches the current Utrecht forecast from Open-Meteo and writes weather.json
// for the site, so visitors read a file from the repo instead of calling the
// API themselves. Run by .github/workflows/data.yml every 15 minutes.
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const URL = "https://api.open-meteo.com/v1/forecast?latitude=52.0907&longitude=5.1214" +
  "&current=temperature_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m" +
  "&daily=sunrise,sunset&forecast_days=2&timeformat=unixtime&timezone=Europe%2FAmsterdam" +
  "&hourly=temperature_2m,weather_code,is_day,precipitation&past_days=1";

try {
  const res = await fetch(URL, { headers: { "user-agent": "utrecht-news-and-weather (github.com/talmanjoseph-creator/utrecht-news-and-weather)" } });
  const d = await res.json();
  if (!res.ok || !d || !d.current) throw new Error((d && d.reason) || ("HTTP " + res.status));
  d.fetchedAt = Date.now();
  // the last 24 hours, one entry per hour, for the strip under the scene
  const h = d.hourly || {}, nowH = Math.floor(Date.now()/3600000)*3600;
  const hours = (h.time || []).map((t, i) => ({ t, temp: h.temperature_2m[i], code: h.weather_code[i], day: h.is_day[i], mm: h.precipitation[i] }))
                               .filter(e => e.t <= nowH && e.t > nowH - 24*3600 && e.temp !== null);
  delete d.hourly; delete d.hourly_units;
  writeFileSync("weather.json", JSON.stringify(d) + "\n");
  writeFileSync("history.json", JSON.stringify({ fetchedAt: d.fetchedAt, hours }) + "\n");
  console.log("history:", hours.length, "hours");
  console.log("weather:", d.current.temperature_2m + "°C", "code", d.current.weather_code, "wind", d.current.wind_speed_10m);
} catch (e) {
  // keep the previous file rather than publishing nothing
  console.log("weather fetch failed:", e.message, existsSync("weather.json") ? "- kept previous" : "- no previous file");
  process.exitCode = 0;
}
