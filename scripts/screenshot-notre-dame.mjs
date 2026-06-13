#!/usr/bin/env node
/** Headless spire screenshots → artifacts/preview-nd-*.png (for the verifier + vision grader). */
import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:3003";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const ready = async () => { await page.waitForSelector("canvas", { timeout: 20000 }); };

for (const cam of ["default", "front", "detail"]) {
  await page.goto(`${URL}/?building=notre-dame&cam=${cam}`, { waitUntil: "domcontentloaded" });
  await ready();
  await page.waitForTimeout(cam === "default" ? 4500 : 2800);
  await page.screenshot({ path: `artifacts/preview-nd-${cam}.png` });
}

// provenance view from the default station
await page.goto(`${URL}/?building=notre-dame&cam=default`, { waitUntil: "domcontentloaded" });
await ready();
await page.waitForTimeout(3500);
await page.click("button:has-text('Provenance')");
await page.waitForTimeout(1600);
await page.screenshot({ path: "artifacts/preview-nd-provenance.png" });

await browser.close();
console.log("saved spire previews: default, front, detail, provenance");
