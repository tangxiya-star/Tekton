#!/usr/bin/env node
/** Headless west-towers screenshots → artifacts/preview-ndt-*.png (for the verifier + vision grader).
 *  Captures the four verifier views (default, front, detail, provenance) plus the
 *  four close-up stations (tympanum, rose, king, gargoyle) for the demo gallery. */
import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:3003";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const ready = async () => { await page.waitForSelector("canvas", { timeout: 20000 }); };

// geometry/closeup stations — the first three are verifier-graded camera views
for (const cam of ["default", "front", "detail", "tympanum", "rose", "king", "gargoyle"]) {
  await page.goto(`${URL}/?building=notre-dame-towers&cam=${cam}`, { waitUntil: "domcontentloaded" });
  await ready();
  await page.waitForTimeout(cam === "default" ? 4500 : 2800);
  await page.screenshot({ path: `artifacts/preview-ndt-${cam}.png` });
}

// provenance view from the default station (verifier-graded for all four classes)
await page.goto(`${URL}/?building=notre-dame-towers&cam=default`, { waitUntil: "domcontentloaded" });
await ready();
await page.waitForTimeout(3500);
await page.click("button:has-text('Provenance')");
await page.waitForTimeout(1600);
await page.screenshot({ path: "artifacts/preview-ndt-provenance.png" });

await browser.close();
console.log("saved towers previews: default, front, detail, tympanum, rose, king, gargoyle, provenance");
