#!/usr/bin/env node
/**
 * Verifier — Notre-Dame WEST TOWERS + FAÇADE (tier v2, deterministic layer).
 *
 * Re-measures the towers verifier_targets from the component geometry in
 * artifacts/structural-spec.notre-dame-towers.json. It NEVER trusts
 * key_dimensions — that block is the Rule Engine's own claim. Every value below
 * is recomputed from component positions + dimensions (T01–T09), exactly as the
 * spire verifier recomputes the spire from coords.
 *
 * Layer 2 grades the headless renders artifacts/preview-ndt-*.png: non-blank,
 * and the provenance view shows all four evidence-class colors.
 *
 * T02 contract (critical): the verifier must NOT accept the towers "corrected"
 * away from the measured 69 m culmination / 43.5 m width / 9.6 m rose toward an
 * ad-quadratum / ad-triangulum geometric ideal. That is a CRITICAL failure.
 *
 * Output: artifacts/verifier-report.notre-dame-towers.json (mirrored to
 * verifier-report.json), and an immutable verifier-report.<stamp>.failed.json on
 * any failure. Sets process.exitCode so the --building dispatcher in verify.mjs
 * exits non-zero.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = join(ROOT, "artifacts/structural-spec.notre-dame-towers.json");
const CANON_PATH = join(ROOT, "data/notre-dame-towers-canonical.json");
const REPORT_PATH = join(ROOT, "artifacts/verifier-report.json");
const REPORT_PATH_NDT = join(ROOT, "artifacts/verifier-report.notre-dame-towers.json");

const spec = JSON.parse(readFileSync(SPEC_PATH, "utf8"));
const canon = JSON.parse(readFileSync(CANON_PATH, "utf8"));
const comps = spec.components;

const REG = canon.source_registry;
const EXCL = canon.rights_excluded || {};
const MATCLASS = canon.$schema_notes.material_classes || {};
const USABLE = new Set(
  Object.entries(REG).filter(([, v]) => v && (v.verdict === "use" || v.verdict === "use-data")).map(([k]) => k)
);
// source keys backing a measured canonical node with >=1 corroborating source (>=2 total)
const MULTI_SOURCED = new Set();
(function collect(obj) {
  if (obj && typeof obj === "object") {
    if (obj.provenance === "measured" && typeof obj.source === "string" && Array.isArray(obj.corroborating_sources) && obj.corroborating_sources.length >= 1) MULTI_SOURCED.add(obj.source);
    for (const v of Object.values(obj)) collect(v);
  }
})(canon);

const within = (m, e, tolPct) => Math.abs(m - e) <= Math.abs(e) * (tolPct / 100);
const r2 = (x) => Math.round(x * 1000) / 1000;

// ---------- geometry bounds (recomputed from coords) ----------
function topY(c) {
  const g = c.geometry, y = c.position[1];
  if (g.type === "lathe") return y + Math.max(...g.pts.map((p) => p[1]));
  if (g.type === "poly") return Math.max(...g.pts.map((p) => p[1]));
  if (g.type === "capsule") return y + g.h / 2 + g.r;
  if (g.type === "sphere") return y + g.r * ((g.scale && g.scale[1]) || 1);
  if (g.type === "cone" || g.type === "box") return y + g.h / 2;
  if (g.type === "cylinder") return g.axis === "z" ? y + g.r : y + g.h / 2;
  if (g.type === "torus") return y + (g.r + (g.rt || 0));
  return y;
}
function bottomY(c) {
  const g = c.geometry, y = c.position[1];
  if (g.type === "lathe") return y + Math.min(...g.pts.map((p) => p[1]));
  if (g.type === "poly") return Math.min(...g.pts.map((p) => p[1]));
  if (g.type === "capsule") return y - g.h / 2 - g.r;
  if (g.type === "sphere") return y - g.r * ((g.scale && g.scale[1]) || 1);
  if (g.type === "cone" || g.type === "box") return y - g.h / 2;
  if (g.type === "cylinder") return g.axis === "z" ? y - g.r : y - g.h / 2;
  if (g.type === "torus") return y - (g.r + (g.rt || 0));
  return y;
}
// horizontal X extent of a box component
function xMin(c) { return c.geometry.type === "box" ? c.position[0] - c.geometry.w / 2 : c.position[0]; }
function xMax(c) { return c.geometry.type === "box" ? c.position[0] + c.geometry.w / 2 : c.position[0]; }

const byId = Object.fromEntries(comps.map((c) => [c.id, c]));
const facadeComps = comps.filter((c) => c.category === "facade");
const towerBoxes = comps.filter((c) => c.category === "tower" && /^tower-(north|south)$/.test(c.id));
const towerComps = comps.filter((c) => c.category === "tower");
const buttresses = comps.filter((c) => c.category === "buttress");
const kings = comps.filter((c) => c.category === "king" && !c.id.endsWith("-head"));
const portalBoxes = comps.filter((c) => c.category === "portal" && !/-arch$/.test(c.id));
const portalArches = comps.filter((c) => c.category === "portal" && /-arch$/.test(c.id));
const roseRing = comps.find((c) => c.id === "rose-outer-ring");
const roseRays = comps.filter((c) => /^rose-ray-/.test(c.id));

// ---------- checks ----------
const checks = [];
function check(id, assert, fn, opts = {}) {
  let result;
  try {
    result = fn();
  } catch (err) {
    result = { pass: false, note: `check threw: ${err.message}` };
  }
  checks.push({ id, assert, method: "spec-geometry", ...opts, ...result });
}

check("T01", "Façade total width = 43.5 m (±2%): extreme X span of the façade/tower/buttress components", () => {
  const planar = comps.filter((c) => ["facade", "tower", "buttress"].includes(c.category) && c.geometry.type === "box");
  const mn = Math.min(...planar.map(xMin));
  const mx = Math.max(...planar.map(xMax));
  const span = mx - mn;
  const facadeBody = byId["facade-body"];
  const bodyW = facadeBody.geometry.w;
  return {
    pass: within(span, 43.5, 2) && within(bodyW, 43.5, 2),
    measured: { facade_span_m: r2(span), facade_body_width_m: r2(bodyW), x_range: [r2(mn), r2(mx)] },
    expected: { width_m: 43.5, tolerance: "±2%" },
  };
});

check(
  "T02",
  "Tower culmination = 69 m (±2%, critical); façade body ≈ 45 m — measured-reality guard: NOT idealized toward ad-quadratum/triangulum",
  () => {
    const towerTop = Math.max(...towerBoxes.map(topY));
    const facadeBody = byId["facade-body"];
    const bodyH = topY(facadeBody) - bottomY(facadeBody);
    const facadeWidth = facadeBody.geometry.w;
    const heightOk = within(towerTop, 69, 2);
    const bodyOk = within(bodyH, 45, 3);
    const towerCount = towerBoxes.length === 2;
    // Idealization signatures the engine must NOT have applied:
    //   ad-triangulum: height = width × √3/2  ≈ 37.67 m
    //   ad-quadratum:  height = width / √2    ≈ 30.76 m  (or × √2 ≈ 61.5 m)
    const adTri = facadeWidth * Math.sqrt(3) / 2;
    const adQuadUp = facadeWidth * Math.sqrt(2);
    const looksIdealized =
      towerTop < 69 - 1.4 || // compressed below measured
      Math.abs(towerTop - adTri) < 2 ||
      Math.abs(towerTop - adQuadUp) < 2;
    return {
      pass: heightOk && bodyOk && towerCount && !looksIdealized,
      critical: true,
      measured: { tower_top_m: r2(towerTop), facade_body_h_m: r2(bodyH), tower_count: towerBoxes.length, ad_triangulum_m: r2(adTri), ad_quadratum_x2_m: r2(adQuadUp) },
      expected: { tower_top_m: 69, facade_body_h_m: 45, tower_count: 2, tolerance: "±2%, no idealization" },
      note: looksIdealized
        ? "FAILED THE PROVENANCE CONTRACT: tower height normalized toward a Gothic geometric ideal away from the measured 69 m. Measured reality wins."
        : "measured 69 m / 45 m preserved, not idealized",
    };
  },
  { critical: true }
);

check("T03", "Gallery of Kings = exactly 28 king figures across the façade band", () => {
  const heads = comps.filter((c) => c.category === "king" && c.id.endsWith("-head")).length;
  // figure heights recomputed from coords: head.top − body.bottom (~3.5 m)
  const heightOf = (body) => {
    const head = byId[`${body.id}-head`];
    return head ? topY(head) - bottomY(body) : topY(body) - bottomY(body);
  };
  const hs = kings.map(heightOf);
  const hsOk = hs.length === 28 && hs.every((h) => within(h, 3.5, 8));
  return {
    pass: kings.length === 28 && heads === 28 && hsOk,
    measured: { king_figures: kings.length, king_heads: heads, figure_h_m: [...new Set(hs.map((h) => r2(h)))] },
    expected: { king_figures: 28, figure_h_m: 3.5 },
  };
});

check("T04", "Three west portals present; centre portal is the widest (recomputed from box widths)", () => {
  const widths = portalBoxes.map((c) => ({ id: c.id, w: r2(c.geometry.w) }));
  const centre = portalBoxes.find((c) => c.id === "portal-centre");
  const others = portalBoxes.filter((c) => c.id !== "portal-centre");
  const centreWidest = centre && others.every((c) => centre.geometry.w > c.geometry.w);
  // each portal box must have its pointed two-centred arch head above it
  const archesOk = portalArches.length === 3;
  return {
    pass: portalBoxes.length === 3 && centreWidest && archesOk,
    measured: { portals: widths, arches: portalArches.length, centre_widest: !!centreWidest },
    expected: { portals: 3, centre_widest: true, arches: 3 },
  };
});

check("T05", "West rose diameter ≈ 9.6 m (±5%), recomputed from ray-tip span; radial tracery present", () => {
  const cx = roseRing.position[0], cy = roseRing.position[1];
  // ray-tip diameter: 2 × max distance from rose centre to a spoke's far end
  let maxR = 0;
  for (const r of roseRays) {
    const d = Math.hypot(r.position[0] - cx, r.position[1] - cy) + r.geometry.h / 2;
    maxR = Math.max(maxR, d);
  }
  const dRay = 2 * maxR;
  const dRingOuter = 2 * (roseRing.geometry.r + (roseRing.geometry.rt || 0));
  const tracery = roseRays.length >= 12;
  return {
    pass: within(dRay, 9.6, 5) && tracery,
    measured: { ray_tip_diameter_m: r2(dRay), ring_outer_diameter_m: r2(dRingOuter), ray_count: roseRays.length },
    expected: { diameter_m: 9.6, tolerance: "±5%", radial_rays: ">=12" },
  };
});

check("T06", "Four façade buttresses dividing the tripartite bays (count exact)", () => {
  // buttresses must be distinct vertical piers at distinct X
  const xs = [...new Set(buttresses.map((c) => r2(c.position[0])))];
  return {
    pass: buttresses.length === 4 && xs.length === 4,
    measured: { buttress_count: buttresses.length, buttress_x: xs.sort((a, b) => a - b) },
    expected: { buttress_count: 4 },
  };
});

check("T07", "Provenance audit: every component classed + sourced {provenance,source,url,rights}; 0 unsourced; source resolves to the registry (use/use-data); all four classes present", () => {
  const CLASSES = new Set(["measured", "reconstructed_design", "rule_derived", "conjecture"]);
  const unsourced = comps.filter((c) => !CLASSES.has(c.provenance) || typeof c.source !== "string" || !c.source);
  const noUrl = comps.filter((c) => typeof c.url !== "string" || !/^https?:\/\//.test(c.url));
  const noRights = comps.filter((c) => typeof c.rights !== "string" || !c.rights);
  const unregistered = comps.filter((c) => !REG[c.source] || !USABLE.has(c.source));
  const present = new Set(comps.map((c) => c.provenance));
  const allFour = [...CLASSES].every((k) => present.has(k));
  return {
    pass: unsourced.length === 0 && noUrl.length === 0 && noRights.length === 0 && unregistered.length === 0 && allFour,
    measured: {
      total: comps.length,
      unsourced: unsourced.map((c) => c.id),
      missing_url: noUrl.map((c) => c.id),
      missing_rights: noRights.map((c) => c.id),
      unregistered_source: unregistered.map((c) => `${c.id}:${c.source}`),
      classes_present: [...present],
    },
    expected: "0 unsourced, every component {provenance,source,url,rights} resolving to a use/use-data registry source, all four classes present",
  };
});

check("T08", "No-invention guard: no `measured` component cites a restricted/cite-only/single source; chimeras are reconstructed_design/conjecture, never measured; GAPs never rendered", () => {
  const violations = [];
  for (const c of comps) {
    if (c.provenance === "measured") {
      if (EXCL[c.source]) violations.push(`${c.id}: measured but cites restricted ${c.source}`);
      else if (!REG[c.source]) violations.push(`${c.id}: measured but source ${c.source} not in registry`);
      else if (!MULTI_SOURCED.has(c.source)) violations.push(`${c.id}: measured but ${c.source} is not multiply-sourced (>=2-source rule)`);
    }
    // GAP-class is never an emittable provenance — nothing may render as a GAP value
    if (c.provenance === "GAP" || c.provenance === "gap") violations.push(`${c.id}: rendered with GAP provenance`);
  }
  // chimeras/gargoyles are 19th-c VLD inventions: reconstructed_design (form) flagged conjecture — NEVER measured
  const chimerasMeasured = comps.filter((c) => c.category === "gargoyle" && c.provenance === "measured");
  for (const c of chimerasMeasured) violations.push(`${c.id}: chimera/gargoyle marked measured — must be conjecture (19th-c invention)`);
  return {
    pass: violations.length === 0,
    measured: { violations, chimera_classes: [...new Set(comps.filter((c) => c.category === "gargoyle").map((c) => c.provenance))] },
    expected: "0 violations",
  };
});

check("T09", "Materials sourced: every surface carries a material whose canonical class resolves to a use/use-data source; Lutetian limestone measured; exact colour conjecture not measured", () => {
  const bad = [];
  for (const c of comps) {
    if (typeof c.material !== "string" || !c.material) { bad.push(`${c.id}: no material`); continue; }
    const mc = MATCLASS[c.material];
    if (!mc) { bad.push(`${c.id}: material ${c.material} not in canonical material_classes`); continue; }
    if (!REG[mc.source] || !USABLE.has(mc.source)) bad.push(`${c.id}: material ${c.material} source ${mc.source} not use/use-data`);
  }
  // the stone TYPE is measured; exact colour must remain a GAP/conjecture, never invented as a measured RGB
  const limestone = MATCLASS["limestone"] || {};
  const colourGuarded = limestone.exact_rgb === "GAP" && limestone.provenance === "measured";
  const usedMaterials = [...new Set(comps.map((c) => c.material))];
  return {
    pass: bad.length === 0 && colourGuarded,
    measured: { materials_used: usedMaterials, offenders: bad, limestone_type: limestone.type, exact_rgb: limestone.exact_rgb },
    expected: "every material resolves to a use/use-data source; limestone TYPE measured; exact RGB stays GAP (never invented)",
  };
});

// ---------- layer 2: pixel checks on the towers renders ----------
const PROV_COLORS = Object.fromEntries(
  Object.entries(spec.provenance_colors).map(([k, hex]) => [
    k,
    [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)],
  ])
);
const BG = [0x14, 0x14, 0x16];
const VIEWS = ["default", "front", "detail", "provenance"];
const png = (v) => join(ROOT, `artifacts/preview-ndt-${v}.png`);

async function refreshScreenshotsIfServerUp() {
  const url = process.env.URL ?? "http://localhost:3003";
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    await fetch(`${url}/?building=notre-dame-towers`, { signal: ctl.signal });
    clearTimeout(t);
  } catch {
    return { refreshed: false, note: `viewer not reachable at ${url}; grading existing PNGs` };
  }
  const run = spawnSync("node", [join(ROOT, "scripts/screenshot-notre-dame-towers.mjs")], { stdio: "inherit" });
  return run.status === 0 ? { refreshed: true } : { refreshed: false, note: "screenshot failed; grading existing PNGs" };
}

async function pixelChecks() {
  const results = [];
  const missing = VIEWS.filter((v) => !existsSync(png(v)));
  results.push({ id: "P01", assert: "all towers canonical views rendered", method: "pixels", pass: missing.length === 0, measured: { missing } });
  if (missing.length === VIEWS.length) return results;

  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const histo = async (view) => {
    const b64 = readFileSync(png(view)).toString("base64");
    return page.evaluate(
      async ({ b64, palette, bg }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const cv = document.createElement("canvas");
        cv.width = img.width; cv.height = img.height;
        const g = cv.getContext("2d");
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, cv.width, cv.height).data;
        const counts = Object.fromEntries(Object.keys(palette).map((k) => [k, 0]));
        let nonBg = 0;
        const total = cv.width * cv.height;
        for (let i = 0; i < d.length; i += 4) {
          const [r, g2, b] = [d[i], d[i + 1], d[i + 2]];
          if (Math.abs(r - bg[0]) + Math.abs(g2 - bg[1]) + Math.abs(b - bg[2]) > 30) nonBg++;
          let best = null, bd = 90;
          for (const [k, [pr, pg, pb]] of Object.entries(palette)) {
            const dd = Math.abs(r - pr) + Math.abs(g2 - pg) + Math.abs(b - pb);
            if (dd < bd) { bd = dd; best = k; }
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
    });
  }

  if (!missing.includes("provenance")) {
    const h = await histo("provenance");
    const pct = Object.fromEntries(Object.entries(h.counts).map(([k, n]) => [k, +((n / h.total) * 100).toFixed(3)]));
    const pass = pct.conjecture > 0.05 && pct.reconstructed_design > 0.1 && pct.rule_derived > 0.05 && pct.measured > 0.02;
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

// carry forward a prior vision-verifier grade if one was merged (orchestrate sets it fresh)
let vision = { status: "pending", note: "vision-verifier sub-agent runs in a fresh context; merged by orchestrate." };
if (existsSync(REPORT_PATH_NDT)) {
  try {
    const prev = JSON.parse(readFileSync(REPORT_PATH_NDT, "utf8"));
    if (prev.vision && prev.vision.status && prev.vision.status !== "pending") vision = prev.vision;
  } catch {}
}

const report = {
  generated_at: new Date().toISOString(),
  building: "notre-dame-towers",
  spec: "artifacts/structural-spec.notre-dame-towers.json",
  screenshot_refresh: refresh,
  summary: {
    total: all.length,
    pass: all.length - failures.length,
    fail: failures.length,
    critical_failures: failures.filter((c) => c.critical).map((c) => c.id),
  },
  vision,
  checks: all,
};
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
writeFileSync(REPORT_PATH_NDT, JSON.stringify(report, null, 2));
if (failures.length) {
  const stamp = report.generated_at.replace(/[:.]/g, "-");
  writeFileSync(join(ROOT, `artifacts/verifier-report.${stamp}.failed.json`), JSON.stringify(report, null, 2));
}

for (const c of all) {
  const mark = c.pass ? "✓" : c.critical ? "✗ CRITICAL" : "✗";
  console.log(`${mark}  ${c.id}  ${c.assert}`);
  if (!c.pass) console.log(`     measured: ${JSON.stringify(c.measured)}${c.note ? ` — ${c.note}` : ""}`);
}
console.log(`\n${report.summary.pass}/${report.summary.total} checks passed → ${REPORT_PATH}`);
process.exitCode = failures.length ? 1 : 0;
