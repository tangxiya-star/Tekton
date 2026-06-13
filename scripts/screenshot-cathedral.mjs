#!/usr/bin/env node
/** Headless whole-cathedral screenshots → artifacts/preview-cathedral-*.png
 *  (Stage 4 render + review). Captures the whole-cathedral framing (massing +
 *  full-fidelity spire) from each cathedral camera station, plus the provenance
 *  fidelity gradient and the spire close-up (regression that the spire still renders).
 *  Uses ?cam= so the viewer skips the drawing reveal and the verifier/grader sees
 *  the 3D scene. */
import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:3041";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const ready = async () => { await page.waitForSelector("canvas", { timeout: 30000 }); };

for (const cam of ["default", "front", "aerial", "detail"]) {
  await page.goto(`${URL}/?building=notre-dame&cam=${cam}`, { waitUntil: "domcontentloaded" });
  await ready();
  // give the camera fly-in + HDRI + shadow maps time to settle on the long building
  await page.waitForTimeout(cam === "default" ? 5500 : 4000);
  await page.screenshot({ path: `artifacts/preview-cathedral-${cam}.png` });
  console.log(`saved preview-cathedral-${cam}.png`);
}

// provenance fidelity gradient from the default whole-cathedral station
await page.goto(`${URL}/?building=notre-dame&cam=default`, { waitUntil: "domcontentloaded" });
await ready();
await page.waitForTimeout(4500);
await page.click("button:has-text('Provenance')");
await page.waitForTimeout(2000);
await page.screenshot({ path: "artifacts/preview-cathedral-provenance.png" });
console.log("saved preview-cathedral-provenance.png");

await browser.close();
console.log("done: default, front, aerial, detail, provenance");
