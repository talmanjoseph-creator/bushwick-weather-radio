// Fetches each city's forecast from Open-Meteo and writes weather-<city>.json
// (current + sunrise/sunset) and history-<city>.json (the last 24 hours and
// the next 24, hourly). Run by .github/workflows/data.yml every 15 minutes.
import { writeFileSync, existsSync } from "node:fs";
import { CITIES, UA } from "./cities.mjs";

for (const [city, cfg] of Object.entries(CITIES)){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.lat}&longitude=${cfg.lon}` +
    "&current=temperature_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m" +
    "&daily=sunrise,sunset&forecast_days=2&timeformat=unixtime&timezone=" + encodeURIComponent(cfg.tz) +
    "&hourly=temperature_2m,weather_code,is_day,precipitation&past_days=1";
  try {
    const res = await fetch(url, { headers: UA });
    const d = await res.json();
    if (!res.ok || !d || !d.current) throw new Error((d && d.reason) || ("HTTP " + res.status));
    d.fetchedAt = Date.now();
    const h = d.hourly || {}, nowH = Math.floor(Date.now()/3600000)*3600;
    const all = (h.time || []).map((t, i) => ({ t, temp: h.temperature_2m[i], code: h.weather_code[i], day: h.is_day[i], mm: h.precipitation[i] }))
                              .filter(e => e.temp !== null && e.temp !== undefined);
    const hours = all.filter(e => e.t <= nowH && e.t > nowH - 24*3600);
    const next  = all.filter(e => e.t >  nowH && e.t <= nowH + 24*3600);
    delete d.hourly; delete d.hourly_units;
    writeFileSync(`weather-${city}.json`, JSON.stringify(d) + "\n");
    writeFileSync(`history-${city}.json`, JSON.stringify({ fetchedAt: d.fetchedAt, hours, next }) + "\n");
    console.log(city, d.current.temperature_2m + "°C", "code", d.current.weather_code, "| history", hours.length, "next", next.length);
  } catch (e) {
    console.log(city, "weather fetch failed:", e.message, existsSync(`weather-${city}.json`) ? "- kept previous" : "- no previous file");
  }
}
