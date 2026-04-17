#!/usr/bin/env bun

const API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.status === 429 && i < retries - 1) {
      const wait = delayMs * (i + 1);
      console.error(`  ⏳ Rate limited, retrying in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}

async function fetchMarsWeather() {
  const url = `https://api.nasa.gov/insight_weather/?api_key=${API_KEY}&feedtype=json&ver=1.0`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json() as { sol_keys: string[]; [key: string]: any };
  const sols = data.sol_keys;

  console.log("🔴 Mars Weather Report");
  console.log("─".repeat(40));

  if (!sols || sols.length === 0) {
    console.log("  No recent data (InSight mission ended Dec 2022)");
    console.log("  Last known surface temp: avg ~ -60°C (-76°F)");
  } else {
    const latestSol = sols[sols.length - 1];
    // Ensure latestSol is a valid key before accessing data
    if (latestSol && data[latestSol]) {
      const s = data[latestSol];

      console.log(`  Sol ${latestSol}`);
      if (s.AT) {
        console.log(`  🌡️  Temp:  avg ${s.AT.av.toFixed(1)}°C | min ${s.AT.mn.toFixed(1)}°C | max ${s.AT.mx.toFixed(1)}°C`);
      }
      if (s.PRE) {
        console.log(`  💨 Pressure: ${s.PRE.av.toFixed(1)} Pa`);
      }
      if (s.HWS) {
        console.log(`  🌬️  Wind: ${s.HWS.av.toFixed(1)} m/s`);
      }
    } else {
      console.log("  No valid Mars sol data found for the latest entry.");
    }
  }
}

async function fetchSunWeather() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const flareRes = await fetchWithRetry(`https://api.nasa.gov/DONKI/FLR?startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&api_key=${API_KEY}`);
  const stormRes = await fetchWithRetry(`https://api.nasa.gov/DONKI/GST?startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&api_key=${API_KEY}`);
  const cmeRes = await fetchWithRetry(`https://api.nasa.gov/DONKI/CME?startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&api_key=${API_KEY}`);

  const [flares, storms, cmes] = await Promise.all([
    flareRes.json() as Promise<any[]>,
    stormRes.json() as Promise<any[]>,
    cmeRes.json() as Promise<any[]>,
  ]);

  console.log("\n☀️  Sun Weather Report (past 7 days)");
  console.log("─".repeat(40));

  // Solar Flares
  if (flares.length > 0) {
    const strongest = flares.reduce((a, b) =>
      (a.classType || "") > (b.classType || "") ? a : b
    );
    console.log(`  🔥 Solar Flares: ${flares.length} detected`);
    console.log(`     Strongest: ${strongest.classType} (${new Date(strongest.peakTime).toLocaleDateString()})`);
  } else {
    console.log("  🔥 Solar Flares: none");
  }

  // Geomagnetic Storms
  if (storms.length > 0) {
    const maxKp = storms.reduce((max, s) => {
      const kp = s.allKpIndex?.reduce((m: number, k: any) => Math.max(m, k.kpIndex || 0), 0) || 0;
      return kp > max.kp ? { kp, storm: s } : max;
    }, { kp: 0, storm: storms[0] });
    console.log(`  🧲 Geomagnetic Storms: ${storms.length} detected`);
    console.log(`     Max Kp Index: ${maxKp.kp}`);
  } else {
    console.log("  🧲 Geomagnetic Storms: none");
  }

  // Coronal Mass Ejections
  if (cmes.length > 0) {
    console.log(`  💥 Coronal Mass Ejections: ${cmes.length} detected`);
    const latest = cmes[cmes.length - 1];
    if (latest.cmeAnalyses?.[0]?.speed) {
      console.log(`     Latest speed: ${latest.cmeAnalyses[0].speed} km/s`);
    }
  } else {
    console.log("  💥 Coronal Mass Ejections: none");
  }
}

function getMoonPhase(): { name: string; illumination: number; emoji: string } {
  // Calculate moon phase using synodic month
  const now = new Date();
  // Known new moon: Jan 6, 2000 18:14 UTC
  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const synodicMonth = 29.53058770576;
  const daysSince = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const fraction = phase / synodicMonth;
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * fraction));

  let name: string;
  let emoji: string;
  if (fraction < 0.0625)      { name = "New Moon";         emoji = "🌑"; }
  else if (fraction < 0.1875) { name = "Waxing Crescent";  emoji = "🌒"; }
  else if (fraction < 0.3125) { name = "First Quarter";    emoji = "🌓"; }
  else if (fraction < 0.4375) { name = "Waxing Gibbous";   emoji = "🌔"; }
  else if (fraction < 0.5625) { name = "Full Moon";        emoji = "🌕"; }
  else if (fraction < 0.6875) { name = "Waning Gibbous";   emoji = "🌖"; }
  else if (fraction < 0.8125) { name = "Third Quarter";    emoji = "🌗"; }
  else if (fraction < 0.9375) { name = "Waning Crescent";  emoji = "🌘"; }
  else                        { name = "New Moon";         emoji = "🌑"; }

  return { name, illumination, emoji };
}

async function fetchMoonWeather() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  // Fetch near-Earth objects from NASA
  const neoRes = await fetchWithRetry(
    `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(weekAgo)}&end_date=${fmt(today)}&api_key=${API_KEY}`
  );

  const moon = getMoonPhase();

  console.log("\n🌙 Moon Report");
  console.log("─".repeat(40));

  // Moon phase
  console.log(`  ${moon.emoji} Phase: ${moon.name}`);
  console.log(`  💡 Illumination: ${(moon.illumination * 100).toFixed(1)}%`);

  // Surface temp estimate based on illumination
  const dayTemp = Math.round(127 * moon.illumination);
  const nightTemp = Math.round(-173 * (1 - moon.illumination * 0.3));
  console.log(`  🌡️  Est. Surface Temp:`);
  console.log(`     Sunlit side:  ~${dayTemp}°C`);
  console.log(`     Dark side:    ~${nightTemp}°C`);

  // NEO data
  if (neoRes.ok) {
    const neoData = await neoRes.json() as { element_count: number; near_earth_objects: { [date: string]: any[] }; };
    const totalNeos = neoData.element_count || 0;
    const allNeos = Object.values(neoData.near_earth_objects || {}).flat() as any[];
    const hazardous = allNeos.filter((n: any) => n.is_potentially_hazardous_asteroid);
    console.log(`  ☄️  Near-Earth Objects (past 7 days): ${totalNeos}`);
    console.log(`     Potentially hazardous: ${hazardous.length}`);
    if (hazardous.length > 0) {
      const closest = hazardous.reduce((a: any, b: any) => {
        const distA = parseFloat(a.close_approach_data?.[0]?.miss_distance?.kilometers || "Infinity");
        const distB = parseFloat(b.close_approach_data?.[0]?.miss_distance?.kilometers || "Infinity");
        return distA < distB ? a : b;
      });
      const dist = parseFloat(closest.close_approach_data?.[0]?.miss_distance?.lunar || "0");
      console.log(`     Closest hazardous: ${closest.name} (${dist.toFixed(2)} lunar distances)`);
    }
  }
}

try {
  await fetchMarsWeather();
  await fetchSunWeather();
} catch (err) {
  console.error("Failed to fetch weather:", (err as Error).message);
}

await fetchMoonWeather();
