import { test, expect } from "bun:test";

test("example test", () => {
  expect(1 + 1).toBe(2);
});

// You can add more tests here later, for example:
// import { fetchMarsWeather } from "./index.ts"; // Assuming you export functions from index.ts
// test("fetches Mars weather data", async () => {
//   const weather = await fetchMarsWeather(); // This would require mocking API calls or running with actual API keys
//   expect(weather).toBeDefined();
// });
