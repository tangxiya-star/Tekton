#!/usr/bin/env node
/** Headless screenshots of the viewer for visual self-checks and the vision verifier. */
import { chromium } from "playwright";

const URL = process.env.URL ?? "http://localhost:3003";
const browser = await chromium.launch({ args: ["--use-angle=swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const cam of ["default", "front", "bracket", "eave"]) {
  await page.goto(`${URL}/?cam=${cam}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(cam === "default" ? 3500 : 1500);
  await page.screenshot({ path: `artifacts/preview-${cam}.png` });
}
await page.click("button:has-text('溯源图层')");
await page.waitForTimeout(800);
await page.screenshot({ path: "artifacts/preview-provenance.png" });
await browser.close();
console.log("saved previews: default, front, bracket, eave, provenance");
