// Fetches NOAA's planetary K-index (geomagnetic activity) and writes kp.json.
// When it's high enough, the night sky on the site gets an aurora.
import { writeFileSync, existsSync } from "node:fs";
import { UA } from "./cities.mjs";
try {
  const res = await fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", { headers: UA });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const rows = await res.json();
  const last = rows[rows.length - 1];
  const kp = Number(last.Kp), at = last.time_tag + "Z";
  const recent = rows.slice(-8).map(r => Number(r.Kp));   // the last 24 hours, 3-hourly
  writeFileSync("kp.json", JSON.stringify({ fetchedAt: Date.now(), kp, at, max24h: Math.max(...recent), recent }) + "\n");
  console.log("kp:", kp, "at", at, "| 24h max", Math.max(...recent));
} catch (e) {
  console.log("kp fetch failed:", e.message, existsSync("kp.json") ? "- kept previous" : "");
}
