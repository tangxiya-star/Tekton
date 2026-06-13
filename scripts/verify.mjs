#!/usr/bin/env node
/**
 * Vision Verifier — deterministic layer.
 *
 * Re-measures the 12 verifier_targets (data/nanchan-canonical.json) from the
 * component geometry in structural-spec.json. It never trusts key_dimensions —
 * that block is the Rule Engine's own claim; verifying it against itself would
 * prove nothing. Every value below is recomputed from component positions and
 * dimensions.
 *
 * Layer 2 checks the headless renders in artifacts/preview-*.png: non-blank,
 * and the provenance view shows all four evidence-class colors.
 *
 * Output: artifacts/verifier-report.json. Exit 1 on any failure, so
 * `npm run build` (derive && verify && next build) cannot ship a bad spec.
 *
 * V09 contract: the verifier must NOT correct the building toward the Fashi
 * ideal. A roof normalized to 1:3 is a CRITICAL failure, not a pass.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

// --- multi-building dispatch (ND-6) ----------------------------------------
function argBuilding() {
  const av = process.argv.slice(2);
  const eq = av.find((a) => a.startsWith("--building="));
  if (eq) return eq.split("=")[1];
  const i = av.indexOf("--building");
  if (i >= 0 && av[i + 1]) return av[i + 1];
  return "nanchan";
}
const BUILDING = argBuilding();
if (BUILDING === "notre-dame" || BUILDING === "notredame") {
  await import("./verify-notre-dame.mjs");
  process.exit(process.exitCode ?? 0);
}

const SPEC_PATH = "artifacts/structural-spec.json";
const REPORT_PATH = "artifacts/verifier-report.json";
// Namespaced Nanchan report (INT-07): written alongside the canonical report so
// each building's viewer HUD can fetch its own. ND keeps verifier-report.notre-dame.json.
const NANCHAN_REPORT_PATH = "artifacts/verifier-report.nanchan.json";
const spec = JSON.parse(readFileSync(SPEC_PATH, "utf8"));
const comps = spec.components;

// ---------- helpers ----------
const FEN_PER_CHI = 300 / spec.units.fen_mm; // 营造尺 300 mm ÷ 16.5 mm/fen ≈ 18.18

const within = (measured, expected, tolPct) =>
  Math.abs(measured - expected) <= Math.abs(expected) * (tolPct / 100);
const r2 = (x) => Math.round(x * 100) / 100;

const boxTop = (c) => c.position[1] + c.geometry.h / 2;
const boxBottom = (c) => c.position[1] - c.geometry.h / 2;
const cylTop = (c) => c.position[1] + c.geometry.r;

const columns = comps.filter((c) => /^col-\d+$/.test(c.id));
const isCorner = (c) =>
  Math.abs(Math.abs(c.position[0]) - 350) < 5 && Math.abs(Math.abs(c.position[2]) - 300) < 5;

// puzuo sets grouped by pz-<n>-
const sets = new Map();
for (const c of comps) {
  const m = c.id.match(/^pz-(\d+)-(\w+)$/);
  if (!m) continue;
  if (!sets.has(m[1])) sets.set(m[1], {});
  sets.get(m[1])[m[2]] = c;
}

const liaoyans = comps.filter((c) => /^fang-liaoyan-[NSEW]$/.test(c.id));
const ridgePurlin = comps.find((c) => c.id === "tuan-ji");

// ---------- the 12 checks ----------
const checks = [];
function check(id, assert, fn) {
  let result;
  try {
    result = fn();
  } catch (err) {
    result = { pass: false, note: `check threw: ${err.message}` };
  }
  checks.push({ id, assert, method: "spec-geometry", ...result });
}

check("V01", "bay rhythm facade = 200:300:200 fen (±2%)", () => {
  const rows = [-300, 300].map((z) => {
    const xs = columns
      .filter((c) => Math.abs(c.position[2] - z) < 5)
      .map((c) => c.position[0])
      .sort((a, b) => a - b);
    return xs.slice(1).map((x, i) => x - xs[i]);
  });
  const pass = rows.every(
    (bays) =>
      bays.length === 3 &&
      within(bays[0], 200, 2) &&
      within(bays[1], 300, 2) &&
      within(bays[2], 200, 2)
  );
  return { pass, measured: rows.map((b) => b.join(":")), expected: "200:300:200 (both eave walls)" };
});

check("V02", "depth bays equal, 200 fen each (±2%)", () => {
  const cols = [-350, 350].map((x) => {
    const zs = columns
      .filter((c) => Math.abs(c.position[0] - x) < 5)
      .map((c) => c.position[2])
      .sort((a, b) => a - b);
    return zs.slice(1).map((z, i) => z - zs[i]);
  });
  const pass = cols.every((bays) => bays.length === 3 && bays.every((b) => within(b, 200, 2)));
  return { pass, measured: cols.map((b) => b.join(":")), expected: "200:200:200 (both gable walls)" };
});

check("V03", "central bay : side bay = 3:2", () => {
  const xs = columns
    .filter((c) => Math.abs(c.position[2] - 300) < 5)
    .map((c) => c.position[0])
    .sort((a, b) => a - b);
  const [s1, central, s2] = xs.slice(1).map((x, i) => x - xs[i]);
  const ratio = central / ((s1 + s2) / 2);
  return { pass: within(ratio, 1.5, 2), measured: r2(ratio), expected: 1.5 };
});

check("V04", "pingzhu height = 13 chi; corner columns +2 fen rise", () => {
  const pingzhu = columns.filter((c) => !isCorner(c)).map((c) => c.geometry.h);
  const corner = columns.filter(isCorner).map((c) => c.geometry.h);
  const expected = 13 * FEN_PER_CHI;
  const hOk = pingzhu.every((h) => within(h, expected, 0.5));
  const riseOk =
    corner.length === 4 && corner.every((h) => Math.abs(h - pingzhu[0] - 2) < 0.2);
  return {
    pass: hOk && riseOk,
    measured: { pingzhu_fen: pingzhu[0], corner_fen: corner[0], corner_count: corner.length },
    expected: { pingzhu_fen: r2(expected), corner_rise_fen: 2 },
  };
});

check("V05", "puzuo = 5-puzuo, 2 hua-gong tiers, column-top only, no intercolumnar sets", () => {
  const problems = [];
  if (sets.size !== columns.length)
    problems.push(`${sets.size} sets vs ${columns.length} columns`);
  for (const [n, set] of sets) {
    if (!set.ludou || !set.hg1 || !set.hg2 || !set.nidao)
      problems.push(`set ${n} incomplete: ${Object.keys(set).join(",")}`);
    if (set.ludou) {
      const onColumn = columns.some(
        (c) =>
          Math.abs(c.position[0] - set.ludou.position[0]) < 1 &&
          Math.abs(c.position[2] - set.ludou.position[2]) < 1
      );
      if (!onColumn) problems.push(`set ${n} ludou is not on a column axis (intercolumnar?)`);
    }
  }
  return {
    pass: problems.length === 0,
    measured: { sets: sets.size, problems },
    expected: "12 sets × {ludou, hg1, hg2, nidao}, each on a column axis",
  };
});

check("V06", "outward jumps 27+20 fen; liaoyan offset from niuji = 47 fen", () => {
  // The two jumps land the liaoyan fang (and the ling arm under it) 47 fen
  // outside the column axis — that heart line is what the geometry can prove.
  const liaoOffsets = liaoyans.map((c) => {
    const axis = c.id.endsWith("E") || c.id.endsWith("W") ? 350 : 300;
    const coord = c.id.endsWith("E") || c.id.endsWith("W") ? c.position[0] : c.position[2];
    return Math.abs(coord) - axis;
  });
  const lingOffsets = [...sets.values()]
    .filter((s) => s.ling && s.ludou)
    .map((s) =>
      Math.max(
        Math.abs(s.ling.position[0] - s.ludou.position[0]),
        Math.abs(s.ling.position[2] - s.ludou.position[2])
      )
    );
  const pass =
    liaoOffsets.length === 4 &&
    liaoOffsets.every((o) => within(o, 47, 2)) &&
    lingOffsets.length > 0 &&
    lingOffsets.every((o) => within(o, 47, 2));
  return {
    pass,
    measured: { liaoyan_offsets: liaoOffsets.map(r2), ling_offsets: [...new Set(lingOffsets.map(r2))] },
    expected: "47 fen (27 + 20) on all four liaoyan fang and every ling arm",
  };
});

check("V07", "puzuo stack height = 95 fen from ludou underside to liaoyan top", () => {
  const liaoTop = boxTop(liaoyans[0]);
  const stacks = [...sets.values()]
    .filter((s) => s.ludou)
    .filter((s) => !isCorner({ position: s.ludou.position })) // corners ride the +2 fen 生起 rise
    .map((s) => liaoTop - boxBottom(s.ludou));
  const pass = stacks.length > 0 && stacks.every((h) => within(h, 95, 2));
  return { pass, measured: [...new Set(stacks.map(r2))], expected: 95 };
});

check("V08", "purlin intervals = 150 fen × 4; liaoyan span = 694 fen", () => {
  const lines = comps
    .filter((c) => /^(tuan-ji|tuan-ping-[NS]|fang-niuji-[NS])$/.test(c.id))
    .map((c) => c.position[2])
    .sort((a, b) => a - b);
  const intervals = lines.slice(1).map((z, i) => z - lines[i]);
  const spans = liaoyans.map((c) => Math.max(c.geometry.w, c.geometry.d));
  const pass =
    intervals.length === 4 &&
    intervals.every((i) => within(i, 150, 2)) &&
    spans.every((s) => within(s, 694, 2));
  return {
    pass,
    measured: { purlin_intervals: intervals.map(r2), liaoyan_spans: [...new Set(spans.map(r2))] },
    expected: { purlin_intervals: "150 × 4", liaoyan_span: 694 },
  };
});

check(
  "V09",
  "roof rise ≈ 130 fen (ratio ≈ 1:2.67), GENTLER than Fashi 1:3 — must NOT be 'corrected'",
  () => {
    const ridgeTop = cylTop(ridgePurlin);
    const eaveTop = boxTop(liaoyans.find((c) => c.id === "fang-liaoyan-N"));
    const rise = ridgeTop - eaveTop;
    const halfSpan = Math.abs(liaoyans.find((c) => c.id === "fang-liaoyan-N").position[2]);
    const ratio = halfSpan / rise;
    const correctedTowardFashi = within(ratio, 3.0, 4);
    return {
      pass: within(rise, 130, 2) && within(ratio, 2.67, 2) && !correctedTowardFashi,
      critical: true,
      measured: { rise_fen: r2(rise), half_span_fen: halfSpan, ratio: `1:${r2(ratio)}` },
      expected: { rise_fen: 130, ratio: "1:2.67" },
      note: correctedTowardFashi
        ? "FAILED THE PROVENANCE CONTRACT: roof was normalized toward the Fashi 1:3 rule. Measured reality wins."
        : "measured deviation from Fashi 1:3 preserved, as required",
    };
  }
);

check("V10", "hip-gable roof form; open interior, zero interior columns", () => {
  const hips = comps.filter((c) => /^roof-hip-[EW]$/.test(c.id)).length;
  const gables = comps.filter((c) => /^gable-[EW]$/.test(c.id)).length;
  const interior = columns.filter(
    (c) => Math.abs(c.position[0]) < 340 && Math.abs(c.position[2]) < 290
  );
  return {
    pass: hips === 2 && gables === 2 && interior.length === 0,
    measured: { hip_planes: hips, gable_planes: gables, interior_columns: interior.map((c) => c.id) },
    expected: { hip_planes: 2, gable_planes: 2, interior_columns: [] },
  };
});

check(
  "V11",
  "provenance audit: every component classed+sourced; eave projection, ridge members, square columns = conjecture",
  () => {
    const CLASSES = new Set(["measured", "reconstructed_design", "rule_derived", "conjecture"]);
    const unsourced = comps.filter(
      (c) => !CLASSES.has(c.provenance) || typeof c.source !== "string" || c.source.length === 0
    );
    const mustBeConjecture = comps.filter(
      (c) =>
        /^(roof-eave-[NSEW]|chuan-.*|tuan-ji|chiwei-[EW])$/.test(c.id) ||
        (/^col-\d+$/.test(c.id) && c.geometry.type === "box")
    );
    const misclassed = mustBeConjecture.filter((c) => c.provenance !== "conjecture");
    return {
      pass: unsourced.length === 0 && misclassed.length === 0 && mustBeConjecture.length > 0,
      measured: {
        total: comps.length,
        unsourced: unsourced.map((c) => c.id),
        conjecture_required: mustBeConjecture.length,
        misclassed: misclassed.map((c) => `${c.id}:${c.provenance}`),
      },
      expected: "0 unsourced, 0 misclassed",
    };
  }
);

check("V12", "load-bearing hua-gong 11 fen wide vs 10 fen elsewhere (zucai visible)", () => {
  // ZHANG2022 rule as derived (derivation-log §4): ALL first-jump arms are
  // strengthened to 11 fen, plus the second jumps of the central-bay sets on
  // the eave walls (x=±150, z=±300) which carry the beam ends. Everything
  // else — other 2nd jumps, nidao, ling — stays at the modular 10.
  const thick = (c) => Math.min(c.geometry.w, c.geometry.d);
  const isCentralEave = (s) =>
    Math.abs(Math.abs(s.ludou.position[0]) - 150) < 5 &&
    Math.abs(Math.abs(s.ludou.position[2]) - 300) < 5;
  const bad = [];
  for (const [n, s] of sets) {
    if (s.hg1 && thick(s.hg1) !== 11) bad.push(`pz-${n}-hg1=${thick(s.hg1)} (want 11)`);
    if (s.hg2) {
      const want = isCentralEave(s) ? 11 : 10;
      if (thick(s.hg2) !== want) bad.push(`pz-${n}-hg2=${thick(s.hg2)} (want ${want})`);
    }
    for (const arm of [s.nidao, s.ling].filter(Boolean))
      if (thick(arm) !== 10) bad.push(`${arm.id}=${thick(arm)} (want 10)`);
  }
  const strengthened2nd = [...sets.values()].filter((s) => s.hg2 && thick(s.hg2) === 11).length;
  return {
    pass: bad.length === 0 && strengthened2nd === 4,
    measured: { violations: bad, strengthened_2nd_jumps: strengthened2nd },
    expected: "hg1=11 everywhere; hg2=11 on the 4 central-bay eave-wall sets, 10 elsewhere; nidao/ling=10",
  };
});

// ---------- layer 2: pixel checks on the headless renders ----------
const PROV_COLORS = {
  measured: [0xd9, 0xa8, 0x43],
  reconstructed_design: [0xa3, 0x81, 0x2f],
  rule_derived: [0x5e, 0x6c, 0xa8],
  conjecture: [0xb3, 0x4a, 0x38],
};
const BG = [0x14, 0x14, 0x16];
const VIEWS = ["default", "front", "bracket", "eave", "altar", "provenance"];

async function refreshScreenshotsIfServerUp() {
  const url = process.env.URL ?? "http://localhost:3003";
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
  } catch {
    return { refreshed: false, note: `viewer not reachable at ${url}; grading existing PNGs` };
  }
  const run = spawnSync("node", ["scripts/screenshot.mjs"], { stdio: "inherit" });
  return run.status === 0
    ? { refreshed: true }
    : { refreshed: false, note: "screenshot.mjs failed; grading existing PNGs" };
}

async function pixelChecks() {
  const results = [];
  const missing = VIEWS.filter((v) => !existsSync(`artifacts/preview-${v}.png`));
  results.push({
    id: "P01",
    assert: "all six canonical views rendered",
    method: "pixels",
    pass: missing.length === 0,
    measured: { missing },
  });
  if (missing.length === VIEWS.length) return results;

  const specMtime = statSync(SPEC_PATH).mtimeMs;
  const stale = VIEWS.filter(
    (v) => existsSync(`artifacts/preview-${v}.png`) && statSync(`artifacts/preview-${v}.png`).mtimeMs < specMtime
  );

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const histo = async (view) => {
    const b64 = readFileSync(`artifacts/preview-${view}.png`).toString("base64");
    return page.evaluate(
      async ({ b64, palette, bg }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width;
        cv.height = img.height;
        const g = cv.getContext("2d");
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        const counts = Object.fromEntries(Object.keys(palette).map((k) => [k, 0]));
        let nonBg = 0;
        const total = cv.width * cv.height;
        for (let i = 0; i < d.length; i += 4) {
          const [r, g2, b] = [d[i], d[i + 1], d[i + 2]];
          if (Math.abs(r - bg[0]) + Math.abs(g2 - bg[1]) + Math.abs(b - bg[2]) > 30) nonBg++;
          // assign each pixel to its NEAREST palette color within tolerance — not
          // the first match. conjecture (#b34a38) and reconstructed_design (#a3812f)
          // are only 80 apart, so a first-match-within-90 scan aliases conjecture
          // pixels into whichever of the two iterates first.
          let best = null;
          let bd = 90;
          for (const [k, [pr, pg, pb]] of Object.entries(palette)) {
            const dd = Math.abs(r - pr) + Math.abs(g2 - pg) + Math.abs(b - pb);
            if (dd < bd) {
              bd = dd;
              best = k;
            }
          }
          if (best) counts[best]++;
        }
        return { total, nonBg, counts };
      },
      { b64, palette: PROV_COLORS, bg: BG }
    );
  };

  for (const view of VIEWS.filter((v) => !missing.includes(v))) {
    const h = await histo(view);
    const frac = h.nonBg / h.total;
    results.push({
      id: `P02-${view}`,
      assert: "render is not blank (>3% non-background pixels)",
      method: "pixels",
      pass: frac > 0.03,
      measured: { non_background: `${(frac * 100).toFixed(1)}%` },
      ...(stale.includes(view) ? { note: "PNG predates structural-spec.json — re-run screenshots" } : {}),
    });
  }

  if (!missing.includes("provenance")) {
    const h = await histo("provenance");
    const pct = Object.fromEntries(
      Object.entries(h.counts).map(([k, n]) => [k, +((n / h.total) * 100).toFixed(3)])
    );
    // the lone measured component (the altar) is interior — the legend swatch
    // guarantees its color a minimal footprint even when occluded
    const pass =
      pct.conjecture > 0.5 &&
      pct.reconstructed_design > 0.5 &&
      pct.rule_derived > 0.05 &&
      pct.measured > 0.003;
    results.push({
      id: "P03",
      assert: "provenance view shows all four evidence-class colors",
      method: "pixels",
      pass,
      measured: { class_pixel_pct: pct },
    });
  }

  await browser.close();
  return results;
}

// ---------- run ----------
const refresh = await refreshScreenshotsIfServerUp();
const pixels = await pixelChecks();

const all = [...checks, ...pixels];
const failures = all.filter((c) => !c.pass);
const report = {
  generated_at: new Date().toISOString(),
  spec: SPEC_PATH,
  screenshot_refresh: refresh,
  summary: {
    total: all.length,
    pass: all.length - failures.length,
    fail: failures.length,
    critical_failures: failures.filter((c) => c.critical).map((c) => c.id),
  },
  checks: all,
};
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
// INT-07: also emit the namespaced Nanchan report (additive; canonical path unchanged).
writeFileSync(NANCHAN_REPORT_PATH, JSON.stringify(report, null, 2));
// PRD §7.4: reports are kept, including failures — a logged fail→revise→pass
// cycle is evidence, not a blemish. Failed runs get an immutable copy.
if (failures.length) {
  const stamp = report.generated_at.replace(/[:.]/g, "-");
  writeFileSync(`artifacts/verifier-report.${stamp}.failed.json`, JSON.stringify(report, null, 2));
}

for (const c of all) {
  const mark = c.pass ? "✓" : c.critical ? "✗ CRITICAL" : "✗";
  console.log(`${mark}  ${c.id}  ${c.assert}`);
  if (!c.pass) console.log(`     measured: ${JSON.stringify(c.measured)}${c.note ? ` — ${c.note}` : ""}`);
}
console.log(`\n${report.summary.pass}/${report.summary.total} checks passed → ${REPORT_PATH}`);
process.exit(failures.length ? 1 : 0);
