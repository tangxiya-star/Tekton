#!/usr/bin/env node
/**
 * Verifier — Notre-Dame spire (deterministic layer).
 *
 * Re-measures the spire verifier_targets from the component geometry in
 * artifacts/structural-spec.notre-dame.json. It NEVER trusts key_dimensions —
 * that block is the Rule Engine's own claim. Every value below is recomputed
 * from component positions + dimensions.
 *
 * Layer 2 grades the headless renders artifacts/preview-nd-*.png: non-blank,
 * and the provenance view shows all four evidence-class colors.
 *
 * V08 contract (critical): the verifier must NOT accept a spire "corrected" away
 * from the measured 96 m total / ~30 m base toward a geometric ideal. That is a
 * CRITICAL failure, not a pass.
 *
 * Output: artifacts/verifier-report.json (+ verifier-report.notre-dame.json), and
 * an immutable verifier-report.<stamp>.failed.json on any failure. Sets
 * process.exitCode so the --building dispatcher in verify.mjs exits non-zero.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = join(ROOT, "artifacts/structural-spec.notre-dame.json");
const CANON_PATH = join(ROOT, "data/notre-dame-canonical.json");
const REPORT_PATH = join(ROOT, "artifacts/verifier-report.json");
const REPORT_PATH_ND = join(ROOT, "artifacts/verifier-report.notre-dame.json");

const spec = JSON.parse(readFileSync(SPEC_PATH, "utf8"));
const canon = JSON.parse(readFileSync(CANON_PATH, "utf8"));
const comps = spec.components;

const REG = canon.source_registry;
const EXCL = canon.rights_excluded || {};
const USABLE = new Set(
  Object.entries(REG).filter(([, v]) => v && (v.verdict === "use" || v.verdict === "use-data")).map(([k]) => k)
);
// source keys backing a measured canonical node with >=2 independent sources
const MULTI_SOURCED = new Set();
(function collect(obj) {
  if (obj && typeof obj === "object") {
    if (obj.provenance === "measured" && typeof obj.source === "string" && Array.isArray(obj.corroborating_sources) && obj.corroborating_sources.length >= 1) MULTI_SOURCED.add(obj.source);
    for (const v of Object.values(obj)) collect(v);
  }
})(canon);

const within = (m, e, tolPct) => Math.abs(m - e) <= Math.abs(e) * (tolPct / 100);
const r2 = (x) => Math.round(x * 1000) / 1000;
const COSF = Math.cos(Math.PI / 8); // octagon circumradius → half across-flats factor

// ---------- geometry bounds (recomputed from coords) ----------
function topY(c) {
  const g = c.geometry, y = c.position[1];
  if (g.type === "lathe") return y + Math.max(...g.pts.map((p) => p[1]));
  if (g.type === "poly") return Math.max(...g.pts.map((p) => p[1]));
  if (g.type === "capsule") return y + g.h / 2 + g.r;
  if (g.type === "sphere") return y + g.r * ((g.scale && g.scale[1]) || 1);
  if (g.type === "cone" || g.type === "box" || g.type === "cylinder") return y + g.h / 2;
  if (g.type === "torus") return y + (g.r || 0);
  return y;
}
function bottomY(c) {
  const g = c.geometry, y = c.position[1];
  if (g.type === "lathe") return y + Math.min(...g.pts.map((p) => p[1]));
  if (g.type === "poly") return Math.min(...g.pts.map((p) => p[1]));
  if (g.type === "capsule") return y - g.h / 2 - g.r;
  if (g.type === "sphere") return y - g.r * ((g.scale && g.scale[1]) || 1);
  if (g.type === "cone" || g.type === "box" || g.type === "cylinder") return y - g.h / 2;
  if (g.type === "torus") return y - (g.r || 0);
  return y;
}
// across-flats width of an octagonal lathe shell, at its top or bottom
function latheRadiusAt(c, which) {
  const pts = c.geometry.pts;
  const target = which === "top" ? Math.max(...pts.map((p) => p[1])) : Math.min(...pts.map((p) => p[1]));
  const at = pts.find((p) => p[1] === target);
  return at[0];
}
const acrossFlats = (radius) => 2 * radius * COSF;

const shells = comps.filter((c) => c.category === "shell");
const byPart = Object.fromEntries(shells.map((c) => [c.part, c]));
const statues = comps.filter((c) => c.category === "statue" && !c.id.endsWith("-head"));
const coq = comps.find((c) => c.category === "coq");

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

check(
  "V08",
  "Spire total height = 96 m, base ~30 m (30–33), visible ≈ 66 m — measured-reality guard: NOT idealized toward a geometric ideal",
  () => {
    const total = Math.max(...comps.map(topY));
    const tabouret = byPart["tabouret"];
    const base = bottomY(tabouret);
    const visible = total - base;
    const baseWidth = acrossFlats(latheRadiusAt(byPart["souche"], "bottom"));
    // Tolerances tightened to the source's precision (the measured 96 m is multiply
    // confirmed). The measured-reality guard: ANY spire compressed toward a geometric
    // rule (Roriczer "spire ~7× base width", ad-triangulum height-from-width, etc.)
    // drops total/visible below the measured anchors — that is the idealization signature.
    const totalOk = within(total, 96, 0.4);
    const baseOk = base >= 30 - 0.3 && base <= 33 + 0.3;
    const visOk = within(visible, 66, 3);
    const roriczerIdeal = baseWidth * 7; // the rule the demo:corrupt applies
    const looksIdealized = total < 96 - 0.4 || visible < 66 - 2.5 || Math.abs(visible - roriczerIdeal) < 4;
    return {
      pass: totalOk && baseOk && visOk && !looksIdealized,
      critical: true,
      measured: { total_m: r2(total), base_m: r2(base), visible_m: r2(visible), base_width_m: r2(baseWidth), roriczer_ideal_m: r2(roriczerIdeal) },
      expected: { total_m: 96, base_m: "30–33", visible_m: 66, tolerance: "±0.4 m, no idealization" },
      note: looksIdealized
        ? "FAILED THE PROVENANCE CONTRACT: spire height normalized toward a Gothic geometric ideal away from the measured 96 m. Measured reality wins."
        : "measured 96 m / 30 m preserved, not idealized",
    };
  },
  { critical: true }
);

check("V09", "Spire octagonal (8 faces) on the ~14 m crossing footprint; six-part profile present", () => {
  const octShells = shells.filter((c) => c.geometry.type === "lathe" && c.geometry.seg === 8);
  const faces = octShells.length ? octShells[0].geometry.seg : 0;
  const parts = ["tabouret", "souche", "fut", "gallery1", "gallery2", "aiguille"];
  const present = parts.filter((p) => byPart[p]);
  const footprint = acrossFlats(latheRadiusAt(byPart["souche"], "bottom"));
  const footOk = footprint > 5 && footprint <= 15; // octagon inscribed in the ~14 m crossing
  return {
    pass: faces === 8 && present.length === 6 && footOk,
    measured: { faces, profile_parts: present, base_across_flats_m: r2(footprint) },
    expected: { faces: 8, profile_parts: parts, footprint_m: "≤14 (inscribed in crossing)" },
  };
});

check("V10", "16 statues = 12 apostles (4 groups of 3) + 4 evangelist symbols; apostle ≈3.40 m, evangelist ≈2.0 m; St Thomas faces inward", () => {
  const apostles = statues.filter((c) => c.statue_kind === "apostle");
  const evangelists = statues.filter((c) => c.statue_kind === "evangelist");
  // recompute each statue's height from coords: head.top − body.bottom
  const heightOf = (body) => {
    const head = comps.find((c) => c.id === `${body.id}-head`);
    return head ? topY(head) - bottomY(body) : topY(body) - bottomY(body);
  };
  const apH = apostles.map(heightOf);
  const evH = evangelists.map(heightOf);
  const apOk = apH.length === 12 && apH.every((h) => within(h, 3.4, 5));
  const evOk = evH.length === 4 && evH.every((h) => within(h, 2.0, 5));
  const inward = statues.filter((c) => c.faces_inward);
  const thomas = comps.find((c) => c.id === "apostle-thomas");
  const thomasOk = inward.length === 1 && thomas && thomas.faces_inward === true;
  return {
    pass: statues.length === 16 && apOk && evOk && thomasOk,
    measured: {
      total: statues.length,
      apostles: apostles.length,
      evangelists: evangelists.length,
      apostle_h_m: [...new Set(apH.map((h) => r2(h)))],
      evangelist_h_m: [...new Set(evH.map((h) => r2(h)))],
      faces_inward: inward.map((c) => c.id),
    },
    expected: { total: 16, apostles: 12, evangelists: 4, apostle_h_m: 3.4, evangelist_h_m: 2.0, inward: ["apostle-thomas"] },
  };
});

check("V11", "Taper monotonic: octagon width strictly decreases souche→aiguille (no bulge); rooster is the single topmost component", () => {
  const order = ["souche", "fut", "gallery1", "gallery2", "aiguille"];
  const widths = order.map((p) => r2(acrossFlats(latheRadiusAt(byPart[p], "top"))));
  let monotonic = true;
  for (let i = 1; i < widths.length; i++) if (!(widths[i] < widths[i - 1])) monotonic = false;
  // rooster topmost
  const topComp = comps.reduce((a, b) => (topY(b) > topY(a) ? b : a));
  const roosterTop = coq && topComp.id === coq.id;
  return {
    pass: monotonic && roosterTop,
    measured: { taper_across_flats_m: widths, topmost: topComp.id },
    expected: { monotonic_decreasing: true, topmost: "coq" },
  };
});

check("V12", "Provenance audit: every component classed + sourced; 0 unsourced; GAP-class never rendered; all four classes present", () => {
  const CLASSES = new Set(["measured", "reconstructed_design", "rule_derived", "conjecture"]);
  const unsourced = comps.filter((c) => !CLASSES.has(c.provenance) || typeof c.source !== "string" || !c.source);
  const noUrl = comps.filter((c) => typeof c.url !== "string" || !/^https?:\/\//.test(c.url));
  const noRights = comps.filter((c) => typeof c.rights !== "string" || !c.rights);
  const present = new Set(comps.map((c) => c.provenance));
  const allFour = [...CLASSES].every((k) => present.has(k));
  return {
    pass: unsourced.length === 0 && noUrl.length === 0 && noRights.length === 0 && allFour,
    measured: {
      total: comps.length,
      unsourced: unsourced.map((c) => c.id),
      missing_url: noUrl.map((c) => c.id),
      missing_rights: noRights.map((c) => c.id),
      classes_present: [...present],
    },
    expected: "0 unsourced, every component {provenance,source,url,rights}, all four classes present",
  };
});

check("V13", "No-invention guard: no `measured` component cites a restricted source or a cited-uncertain value; rooster is NOT measured", () => {
  const violations = [];
  for (const c of comps) {
    if (c.provenance === "measured") {
      if (EXCL[c.source]) violations.push(`${c.id}: measured but cites restricted ${c.source}`);
      if (!REG[c.source]) violations.push(`${c.id}: measured but source ${c.source} not in registry`);
      else if (!MULTI_SOURCED.has(c.source)) violations.push(`${c.id}: measured but ${c.source} is not multiply-sourced (>=2-source rule)`);
    }
  }
  if (coq && coq.provenance === "measured") violations.push("coq is measured — its weight is cited-uncertain, must be conjecture");
  return {
    pass: violations.length === 0,
    measured: { violations },
    expected: "0 violations",
  };
});

check("V14", "Rights gate (G09): every component source resolves to the rights-cleared registry with a use/use-data verdict", () => {
  const bad = [];
  for (const c of comps) {
    if (EXCL[c.source]) bad.push(`${c.id}: source ${c.source} is RESTRICTED (${EXCL[c.source].verdict})`);
    else if (!REG[c.source]) bad.push(`${c.id}: source ${c.source} not in registry`);
    else if (!USABLE.has(c.source)) bad.push(`${c.id}: source ${c.source} verdict not use/use-data`);
  }
  return {
    pass: bad.length === 0,
    measured: { offenders: bad, registry_size: Object.keys(REG).length },
    expected: "0 components from excluded/unknown sources",
  };
});

// ---------- layer 2: pixel checks on the spire renders ----------
const PROV_COLORS = Object.fromEntries(
  Object.entries(spec.provenance_colors).map(([k, hex]) => [
    k,
    [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)],
  ])
);
const BG = [0x14, 0x14, 0x16];
const VIEWS = ["default", "front", "detail", "provenance"];
const png = (v) => join(ROOT, `artifacts/preview-nd-${v}.png`);

async function refreshScreenshotsIfServerUp() {
  const url = process.env.URL ?? "http://localhost:3003";
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    await fetch(`${url}/?building=notre-dame`, { signal: ctl.signal });
    clearTimeout(t);
  } catch {
    return { refreshed: false, note: `viewer not reachable at ${url}; grading existing PNGs` };
  }
  const run = spawnSync("node", [join(ROOT, "scripts/screenshot-notre-dame.mjs")], { stdio: "inherit" });
  return run.status === 0 ? { refreshed: true } : { refreshed: false, note: "screenshot failed; grading existing PNGs" };
}

async function pixelChecks() {
  const results = [];
  const missing = VIEWS.filter((v) => !existsSync(png(v)));
  results.push({ id: "P01", assert: "all spire canonical views rendered", method: "pixels", pass: missing.length === 0, measured: { missing } });
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
let vision = { status: "pending", note: "vision-verifier sub-agent runs in a fresh context (ND-15); merged by orchestrate." };
if (existsSync(REPORT_PATH_ND)) {
  try {
    const prev = JSON.parse(readFileSync(REPORT_PATH_ND, "utf8"));
    if (prev.vision && prev.vision.status && prev.vision.status !== "pending") vision = prev.vision;
  } catch {}
}

const report = {
  generated_at: new Date().toISOString(),
  building: "notre-dame",
  spec: "artifacts/structural-spec.notre-dame.json",
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
writeFileSync(REPORT_PATH_ND, JSON.stringify(report, null, 2));
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
