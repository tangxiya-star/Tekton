#!/usr/bin/env node
/**
 * ND-37 — record the run (BULLETPROOF).
 *
 * Records a ~30-40s WEBM walkthrough of the live Notre-Dame spire demo and
 * writes it to artifacts/run-<stamp>.webm.
 *
 * Design contract — this script can NEVER hang its parent:
 *   • A HARD wall-clock watchdog (WATCHDOG_MS) force-finalizes the video and
 *     calls process.exit no matter what await is stuck. Default 75s.
 *   • Every navigation / selector / interaction await is individually bounded
 *     and wrapped so a single stall can't block the flow.
 *   • The video is finalized (context.close, raced against a timeout) and moved
 *     to artifacts/<RUN_ID>.webm on BOTH the normal and the watchdog path.
 *   • Exit code is 0 iff a non-empty .webm landed at the destination, else 1.
 *
 * Usage:
 *   node scripts/record-run.mjs                 # records http://localhost:3003
 *   URL=http://localhost:3019 node scripts/record-run.mjs
 *   RUN_ID=my-run node scripts/record-run.mjs
 *
 * This is a normal node script (not a workflow script), so `Date` is fine here.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = process.env.URL ?? "http://localhost:3003";
const RUN_ID =
  process.env.RUN_ID ??
  "run-" +
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19)
      .replace("T", "_");

const REC_DIR = path.join("artifacts", ".rec");
const OUT_PATH = path.join("artifacts", `${RUN_ID}.webm`);
const SIZE = { width: 1440, height: 900 };

// Bounded-time knobs (ms).
const WATCHDOG_MS = Number(process.env.RECORD_WATCHDOG_MS ?? 75000); // hard wall clock
const NAV_TIMEOUT = 20000; // goto / navigation
const ACTION_TIMEOUT = 5000; // per-interaction default
const CLOSE_TIMEOUT = 15000; // context.close() finalize race

let browser = null;
let context = null;
let page = null;
let videoPathPromise = null; // captured before close so we can find the .webm
let finished = false; // guard so we finalize exactly once

// Run a promise but never wait longer than `ms`. Resolves to `fallback` on timeout.
const withTimeout = (promise, ms, fallback = undefined) =>
  new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(fallback);
      }
    }, ms);
    Promise.resolve(promise)
      .then((v) => {
        if (!done) {
          done = true;
          clearTimeout(t);
          resolve(v);
        }
      })
      .catch(() => {
        if (!done) {
          done = true;
          clearTimeout(t);
          resolve(fallback);
        }
      });
  });

// Run an optional driving step bounded by its own timeout; never crash the recording.
const soft = async (label, fn, ms = ACTION_TIMEOUT) => {
  try {
    await withTimeout(
      Promise.resolve().then(fn),
      ms,
      undefined,
    );
  } catch (err) {
    console.warn(`  · step "${label}" skipped: ${err?.message ?? err}`);
  }
};

// A plain sleep we can also bound, so even waitForTimeout can't hang us.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Locate the produced .webm (prefer the API path, else newest in REC_DIR) and
// move it to the stable destination. Returns the final path or null. Sync + safe
// to call from the watchdog.
function locateAndMoveVideo(apiPath) {
  let produced = apiPath && fs.existsSync(apiPath) ? apiPath : null;
  if (!produced) {
    try {
      const candidates = fs
        .readdirSync(REC_DIR)
        .filter((f) => f.endsWith(".webm"))
        .map((f) => path.join(REC_DIR, f))
        .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      produced = candidates[0]?.p ?? null;
    } catch {
      produced = null;
    }
  }
  if (!produced || !fs.existsSync(produced)) return null;
  try {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    try {
      fs.renameSync(produced, OUT_PATH);
    } catch {
      // rename can fail across devices — fall back to copy + unlink
      fs.copyFileSync(produced, OUT_PATH);
      try { fs.unlinkSync(produced); } catch {}
    }
    return OUT_PATH;
  } catch {
    // if the move fails, fall back to whatever raw file we have
    return produced;
  }
}

// Single finalize path: flush the video, move it, and exit. Idempotent.
async function finalize(reason) {
  if (finished) return;
  finished = true;
  clearTimeout(watchdog);
  console.warn(`finalizing (${reason})`);

  // Capture the API video path (best-effort) before closing.
  let apiPath = null;
  if (videoPathPromise) {
    apiPath = await withTimeout(videoPathPromise, 3000, null);
  }

  // context.close() flushes/finalizes the .webm — race it against a timeout so a
  // stuck close can't hang us. If it times out, the partial file is still on disk.
  if (context) {
    await withTimeout(context.close().catch(() => {}), CLOSE_TIMEOUT, null);
  }
  // Re-resolve the API path now that the video is finalized.
  if (videoPathPromise && !apiPath) {
    apiPath = await withTimeout(videoPathPromise, 3000, null);
  }

  const finalPath = locateAndMoveVideo(apiPath);

  // Best-effort browser teardown, bounded.
  if (browser) {
    await withTimeout(browser.close().catch(() => {}), 5000, null);
  }

  if (finalPath && fs.existsSync(finalPath)) {
    const bytes = fs.statSync(finalPath).size;
    if (bytes > 0) {
      console.log(finalPath);
      process.exit(0);
    }
    console.error(`produced video is empty: ${finalPath}`);
    process.exit(1);
  }
  console.error("no .webm video was produced");
  process.exit(1);
}

// HARD wall-clock watchdog — force-finalize no matter what is stuck above.
const watchdog = setTimeout(() => {
  console.warn(`watchdog fired after ${WATCHDOG_MS}ms — force finalizing`);
  // finalize is async but bounded; also arm a last-resort hard exit in case even
  // finalize's bounded awaits somehow wedge (e.g. a hung fs call).
  finalize("watchdog");
  setTimeout(() => {
    // last resort: decide exit purely from the destination file on disk.
    const ok = fs.existsSync(OUT_PATH) && fs.statSync(OUT_PATH).size > 0;
    console.warn("hard exit after watchdog finalize");
    process.exit(ok ? 0 : 1);
  }, CLOSE_TIMEOUT + 8000).unref?.();
}, WATCHDOG_MS);
watchdog.unref?.();

async function main() {
  fs.mkdirSync(REC_DIR, { recursive: true });
  console.log(`recording ${URL}/?building=notre-dame → ${OUT_PATH}`);

  browser = await chromium.launch({ args: ["--use-angle=swiftshader"] });
  context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: REC_DIR, size: SIZE },
  });
  page = await context.newPage();

  // Keep auto-waiting short so no single await can stall the recording.
  page.setDefaultTimeout(ACTION_TIMEOUT);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);

  // Capture the video handle/path up front (the page exists for the whole run).
  const video = page.video();
  videoPathPromise = video ? video.path() : null;

  // (0) Navigate — resilient: domcontentloaded + try/catch, bounded.
  await soft(
    "goto",
    async () => {
      try {
        await page.goto(`${URL}/?building=notre-dame`, {
          waitUntil: "domcontentloaded",
          timeout: NAV_TIMEOUT,
        });
      } catch (e) {
        console.warn("goto slow/failed, continuing:", e?.message ?? e);
      }
    },
    NAV_TIMEOUT + 2000,
  );

  // (0b) Wait for the canvas to mount, but never block forever.
  await page
    .waitForSelector("canvas", { timeout: 15000 })
    .catch(() => console.warn("canvas wait slow — continuing"));

  const canvas = page.locator("canvas").first();

  // (1) Lift the "Reveal in 3D" / scroll-to-reveal drawing overlay, if present.
  await soft("reveal", async () => {
    const reveal = page
      .getByRole("button", { name: /reveal|scroll|3d|explore|enter/i })
      .first();
    const visible = await reveal.isVisible({ timeout: 1500 }).catch(() => false);
    if (visible) {
      await reveal.click({ timeout: 1500 }).catch(() => {});
    } else {
      // no button — nudge the scene with a wheel event to dismiss the drawing veil
      await canvas.hover({ timeout: 1500 }).catch(() => {});
      await page.mouse.wheel(0, 600).catch(() => {});
    }
  });

  // (2) let the spire settle
  await sleep(2000);

  // (3) play the construction sequence and watch it build
  await soft("play build", async () => {
    await page
      .getByRole("button", { name: /play build|replay build/i })
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
  });
  await sleep(8000);

  // (4) toggle provenance colours
  await soft("provenance", async () => {
    await page
      .getByRole("button", { name: /^provenance$/i })
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
  });
  await sleep(3000);

  // (5) click near the middle of the canvas to inspect a component
  await soft("inspect", async () => {
    const box = await withTimeout(canvas.boundingBox(), 2000, null);
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.55).catch(() => {});
    }
  });
  await sleep(2000);

  // (6) back to the built view
  await soft("built", async () => {
    await page
      .getByRole("button", { name: /^built$/i })
      .first()
      .click({ timeout: 2000 })
      .catch(() => {});
  });
  await sleep(800);

  // (7) slowly orbit by dragging the canvas (bounded so it can't run past budget)
  await soft(
    "orbit",
    async () => {
      const box = await withTimeout(canvas.boundingBox(), 2000, null);
      if (!box) return;
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy).catch(() => {});
      await page.mouse.down().catch(() => {});
      const steps = 60;
      for (let i = 1; i <= steps; i++) {
        if (finished) break;
        const t = (i / steps) * Math.PI * 2;
        await page.mouse
          .move(cx + Math.cos(t) * 220, cy + Math.sin(t) * 70)
          .catch(() => {});
        await sleep(120);
      }
      await page.mouse.up().catch(() => {});
    },
    12000,
  );

  // give the final frame a moment to render
  await sleep(1200);

  // Normal-path finalize (the watchdog handles any stall above).
  await finalize("complete");
}

main().catch(async (err) => {
  console.error("record-run error:", err?.message ?? err);
  await finalize("error");
});
