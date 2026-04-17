const API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const url = `https://api.nasa.gov/insight_weather/?api_key=${API_KEY}&feedtype=json&ver=1.0`;

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  const sols = data.sol_keys;

  if (!sols || sols.length === 0) {
    console.log("🔴 No recent Mars weather data available from NASA InSight.");
    console.log("ℹ️  The InSight lander mission ended in Dec 2022.");
    console.log("   Last known Mars surface temps: avg ~ -60°C (-76°F)");
    process.exit(0);
  }

  const latestSol = sols[sols.length - 1];
  const solData = data[latestSol];

  console.log(`🔴 Mars Weather Report (Sol ${latestSol})`);
  console.log("─".repeat(35));

  if (solData.AT) {
    console.log(`🌡️  Temperature:`);
    console.log(`   Avg: ${solData.AT.av.toFixed(1)}°C`);
    console.log(`   Min: ${solData.AT.mn.toFixed(1)}°C`);
    console.log(`   Max: ${solData.AT.mx.toFixed(1)}°C`);
  }

  if (solData.PRE) {
    console.log(`💨 Pressure: ${solData.PRE.av.toFixed(1)} Pa`);
  }

  if (solData.HWS) {
    console.log(`🌬️  Wind Speed: ${solData.HWS.av.toFixed(1)} m/s`);
  }
} catch (err) {
  console.error("Failed to fetch Mars weather:", (err as Error).message);
  process.exit(1);
}
