const API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

async function fetchMarsWeather() {
  const url = `https://api.nasa.gov/insight_weather/?api_key=${API_KEY}&feedtype=json&ver=1.0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  const sols = data.sol_keys;

  console.log("🔴 Mars Weather Report");
  console.log("─".repeat(40));

  if (!sols || sols.length === 0) {
    console.log("  No recent data (InSight mission ended Dec 2022)");
    console.log("  Last known surface temp: avg ~ -60°C (-76°F)");
  } else {
    const latestSol = sols[sols.length - 1];
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
  }
}

async function fetchSunWeather() {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [flareRes, stormRes, cmeRes] = await Promise.all([
    fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&api_key=${API_KEY}`),
    fetch(`https://api.nasa.gov/DONKI/GST?startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&api_key=${API_KEY}`),
    fetch(`https://api.nasa.gov/DONKI/CME?startDate=${fmt(weekAgo)}&endDate=${fmt(today)}&api_key=${API_KEY}`),
  ]);

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

try {
  await Promise.all([fetchMarsWeather(), fetchSunWeather()]);
} catch (err) {
  console.error("Failed to fetch weather:", (err as Error).message);
  process.exit(1);
}
