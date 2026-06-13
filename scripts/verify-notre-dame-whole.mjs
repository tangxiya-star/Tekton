#!/usr/bin/env node
/**
 * Verifier — Notre-Dame WHOLE CATHEDRAL (PASS 1 massing + spire; deterministic layer).
 *
 * RE-KEYED (notre-dame-whole): the SEPARATE whole-cathedral verifier. Reads
 * artifacts/structural-spec.notre-dame-whole.json + data/notre-dame-whole-canonical.json,
 * writes artifacts/verifier-report.notre-dame-whole.json. The focused spire
 * verifier (scripts/verify-notre-dame.mjs → verifier-report.notre-dame.json) is
 * left untouched and stays spire-only.
 *
 * Re-measures the spire verifier_targets (V08–V14) AND the whole-cathedral
 * massing (C01–C06, C-PROV) from the component geometry in
 * artifacts/structural-spec.notre-dame-whole.json. It NEVER trusts key_dimensions —
 * that block is the Rule Engine's own claim. Every value below is recomputed
 * from component positions + dimensions.
 *
 * Layer 2 grades the headless renders artifacts/preview-cathedral-*.png: non-blank,
 * and the provenance view shows all four evidence-class colors (the fidelity gradient).
 *
 * V08 contract (critical): the verifier must NOT accept a spire "corrected" away
 * from the measured 96 m total / ~30 m base toward a geometric ideal. C05 extends
 * this to the massing (vault crown 33 m, not 35 m / 43 m). That is a CRITICAL
 * failure, not a pass.
 *
 * Output: artifacts/verifier-report.notre-dame-whole.json, and an immutable
 * verifier-report.<stamp>.failed.json on any failure. Sets process.exitCode so
 * the --building dispatcher in verify.mjs exits non-zero.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_PATH = join(ROOT, "artifacts/structural-spec.notre-dame-whole.json");
const CANON_PATH = join(ROOT, "data/notre-dame-whole-canonical.json");
const REPORT_PATH = join(ROOT, "artifacts/verifier-report.json");
const REPORT_PATH_ND = join(ROOT, "artifacts/verifier-report.notre-dame-whole.json");

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

// ---------- X / Z world bounds (recomputed from coords, for the massing) ------
// box is positioned by `position` with half-extents w/2 (X) and d/2 (Z); a lathe
// revolves [radius, localY] about its own position, so its X/Z half-extent is its
// max radius; a poly carries ABSOLUTE world points in pts[] (X = p[0], Z = p[2]).
function latheMaxRadius(c) {
  return Math.max(...c.geometry.pts.map((p) => p[0]));
}
function xBounds(c) {
  const g = c.geometry, x = c.position[0];
  if (g.type === "box") return [x - g.w / 2, x + g.w / 2];
  if (g.type === "lathe") { const r = latheMaxRadius(c); return [x - r, x + r]; }
  if (g.type === "cylinder" || g.type === "cone") { const r = Math.max(g.r || 0, g.rTop || 0); return [x - r, x + r]; }
  if (g.type === "sphere") return [x - g.r, x + g.r];
  if (g.type === "poly") { const xs = g.pts.map((p) => p[0]); return [Math.min(...xs), Math.max(...xs)]; }
  return [x, x];
}
function zBounds(c) {
  const g = c.geometry, z = c.position[2];
  if (g.type === "box") return [z - g.d / 2, z + g.d / 2];
  if (g.type === "lathe") { const r = latheMaxRadius(c); return [z - r, z + r]; }
  if (g.type === "cylinder" || g.type === "cone") { const r = Math.max(g.r || 0, g.rTop || 0); return [z - r, z + r]; }
  if (g.type === "sphere") return [z - g.r, z + g.r];
  if (g.type === "poly") { const zs = g.pts.map((p) => p[2]); return [Math.min(...zs), Math.max(...zs)]; }
  return [z, z];
}

const shells = comps.filter((c) => c.category === "shell");
const byPart = Object.fromEntries(shells.map((c) => [c.part, c]));
const statues = comps.filter((c) => c.category === "statue" && !c.id.endsWith("-head"));
const coq = comps.find((c) => c.category === "coq");

// ---------- whole-cathedral massing selectors (fidelity "massing") ------------
const massing = comps.filter((c) => c.fidelity === "massing");
const spireComps = comps.filter((c) => c.fragment === "spire");
const massById = Object.fromEntries(massing.map((c) => [c.id, c]));

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

// ===========================================================================
// WHOLE-CATHEDRAL MASSING CHECKS (C01–C06) — recomputed FROM COMPONENT COORDS.
// Tier "whole-cathedral" in done.rubric.json (required:false → the spire verdict
// is unaffected). Every assertion below is re-measured from the massing
// components' world positions + geometry, NEVER from spec.key_dimensions.
// ===========================================================================

check("C01", "Cathedral total length = 128 m (extreme X span of all components, west front → chevet) ±2%", () => {
  if (massing.length === 0) return { pass: false, note: "no massing components — PASS 1 not composed" };
  const minX = Math.min(...comps.map((c) => xBounds(c)[0]));
  const maxX = Math.max(...comps.map((c) => xBounds(c)[1]));
  const len = maxX - minX;
  return {
    pass: within(len, 128, 2),
    measured: { length_m: r2(len), west_x_m: r2(minX), chevet_x_m: r2(maxX) },
    expected: { length_m: 128, tolerance: "±2%" },
  };
});

check("C02", "Max width across transept = 48 m (extreme Z span) ±2%; transept arm thickness = 14 m", () => {
  const minZ = Math.min(...comps.map((c) => zBounds(c)[0]));
  const maxZ = Math.max(...comps.map((c) => zBounds(c)[1]));
  const width = maxZ - minZ;
  // arm thickness = the arm box extent ALONG X (w), measured from coords
  const arms = massing.filter((c) => /^transept:arm-[NS]$/.test(c.id));
  const armW = arms.map((c) => { const [a, b] = xBounds(c); return r2(b - a); });
  const armOk = arms.length === 2 && armW.every((w) => within(w, 14, 2));
  return {
    pass: within(width, 48, 2) && armOk,
    measured: { width_m: r2(width), z_span_m: [r2(minZ), r2(maxZ)], arm_thickness_m: [...new Set(armW)] },
    expected: { width_m: 48, arm_thickness_m: 14, tolerance: "±2%" },
  };
});

check("C03", "West façade width = 43.5 m (Z extent of the west-front block) ±2%; façade body height ≈ 45 m", () => {
  const facade = massById["west-front:facade"];
  if (!facade) return { pass: false, note: "west-front:facade missing" };
  const [z0, z1] = zBounds(facade);
  const w = z1 - z0;
  const h = topY(facade) - bottomY(facade);
  return {
    pass: within(w, 43.5, 2) && within(h, 45, 3),
    measured: { facade_width_m: r2(w), facade_height_m: r2(h) },
    expected: { facade_width_m: 43.5, facade_height_m: 45, tolerance: "width ±2%, height ±3%" },
  };
});

check("C04", "West towers reach 69 m (top Y of each tower block) ±2%", () => {
  const towers = massing.filter((c) => /^west-front:tower-[NS]$/.test(c.id));
  const tops = towers.map((c) => r2(topY(c)));
  const ok = towers.length === 2 && tops.every((t) => within(t, 69, 2));
  return {
    pass: ok,
    measured: { tower_tops_m: [...new Set(tops)], towers: towers.length },
    expected: { tower_height_m: 69, count: 2, tolerance: "±2%" },
  };
});

check("C05", "Nave high-vault crown = 33 m (top Y of the nave vessel) — measured-reality guard: NOT 35 m, NOT 43 m", () => {
  const vessel = massById["nave:vessel"];
  if (!vessel) return { pass: false, note: "nave:vessel missing" };
  const crown = topY(vessel);
  const is35 = within(crown, 35, 1.5);   // the REFUTED figure
  const is43 = within(crown, 43, 1.5);   // that is height-under-roof, not the crown
  return {
    pass: within(crown, 33, 3) && !is35 && !is43,
    measured: { vault_crown_m: r2(crown) },
    expected: { vault_crown_m: 33, guard: "must NOT equal 35 m (refuted) or 43 m (under-roof)", tolerance: "±3%" },
    note: is35
      ? "FAILED MEASURED-REALITY GUARD: nave crown normalized to the refuted 35 m."
      : is43
        ? "FAILED: nave crown = 43 m is height-under-roof, not the vault crown."
        : "measured 33 m crown preserved",
  };
});

check("C06", "Spire group composes UNCHANGED on the crossing: V08–V14 anchors intact AND sits at x≈0, z≈0", () => {
  // the spire is composed byte-identical at the crossing — re-confirm its footprint
  // centre from coords (the souche octagon centre) and that the existing spire
  // checks did not regress (V08–V14 must all be present and passing).
  const souche = byPart["souche"];
  const tabouret = byPart["tabouret"];
  const onCrossing = souche && tabouret &&
    Math.abs(souche.position[0]) < 0.5 && Math.abs(souche.position[2]) < 0.5 &&
    Math.abs(tabouret.position[0]) < 0.5 && Math.abs(tabouret.position[2]) < 0.5;
  const spireV = ["V08", "V09", "V10", "V11", "V12", "V13", "V14"];
  const spireResults = Object.fromEntries(spireV.map((id) => [id, !!checks.find((c) => c.id === id && c.pass)]));
  const allGreen = spireV.every((id) => spireResults[id]);
  const statueCount = spireComps.filter((c) => c.category === "statue" && !c.id.endsWith("-head")).length;
  const octFaces = byPart["souche"] ? byPart["souche"].geometry.seg : 0;
  return {
    pass: !!onCrossing && allGreen && statueCount === 16 && octFaces === 8 && coq != null,
    measured: {
      spire_components: spireComps.length,
      souche_xz: souche ? [r2(souche.position[0]), r2(souche.position[2])] : null,
      octagon_faces: octFaces,
      statues: statueCount,
      coq_present: coq != null,
      spire_checks: spireResults,
    },
    expected: { on_crossing: "x≈0,z≈0", octagon_faces: 8, statues: 16, "V08–V14": "all pass" },
  };
});

check("C-PROV", "Massing provenance audit: every massing block {provenance,source,url,rights}; 0 unsourced; massing is measured/rule_derived; the spire is full fidelity", () => {
  const CLASSES = new Set(["measured", "reconstructed_design", "rule_derived", "conjecture"]);
  const MASSING_OK = new Set(["measured", "rule_derived"]); // massing renders measured / rule_derived only
  const unsourced = massing.filter((c) => !CLASSES.has(c.provenance) || !c.source);
  const noUrl = massing.filter((c) => typeof c.url !== "string" || !/^https?:\/\//.test(c.url));
  const noRights = massing.filter((c) => typeof c.rights !== "string" || !c.rights);
  const badClass = massing.filter((c) => !MASSING_OK.has(c.provenance));
  // fidelity gradient: every massing component fidelity "massing", every spire component fidelity "full"
  const badMassingFid = massing.filter((c) => c.fidelity !== "massing");
  const badSpireFid = spireComps.filter((c) => c.fidelity !== "full");
  // all four evidence classes present across the WHOLE spec (massing + spire)
  const present = new Set(comps.map((c) => c.provenance));
  const allFour = [...CLASSES].every((k) => present.has(k));
  return {
    pass:
      massing.length > 0 &&
      unsourced.length === 0 &&
      noUrl.length === 0 &&
      noRights.length === 0 &&
      badClass.length === 0 &&
      badMassingFid.length === 0 &&
      badSpireFid.length === 0 &&
      allFour,
    measured: {
      massing_total: massing.length,
      unsourced: unsourced.map((c) => c.id),
      missing_url: noUrl.map((c) => c.id),
      missing_rights: noRights.map((c) => c.id),
      misclassed_massing: badClass.map((c) => `${c.id}:${c.provenance}`),
      wrong_fidelity: [...badMassingFid, ...badSpireFid].map((c) => `${c.id}:${c.fidelity}`),
      classes_present: [...present],
    },
    expected: "0 unsourced, massing ∈ {measured,rule_derived}, massing fidelity 'massing' / spire 'full', all four classes present",
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
const VIEWS = ["default", "front", "aerial", "detail", "provenance"];
const png = (v) => join(ROOT, `artifacts/preview-cathedral-${v}.png`);

async function refreshScreenshotsIfServerUp() {
  const url = process.env.URL ?? "http://localhost:3003";
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    await fetch(`${url}/?building=notre-dame-whole`, { signal: ctl.signal });
    clearTimeout(t);
  } catch {
    return { refreshed: false, note: `viewer not reachable at ${url}; grading existing PNGs` };
  }
  const run = spawnSync("node", [join(ROOT, "scripts/screenshot-cathedral.mjs")], { stdio: "inherit", env: { ...process.env, URL: url } });
  return run.status === 0 ? { refreshed: true } : { refreshed: false, note: "screenshot failed; grading existing PNGs" };
}

async function pixelChecks() {
  const results = [];
  const missing = VIEWS.filter((v) => !existsSync(png(v)));
  results.push({ id: "P01", assert: "all whole-cathedral canonical views rendered", method: "pixels", pass: missing.length === 0, measured: { missing } });
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
    // The check's intent is PRESENCE of all four evidence classes in the provenance
    // view (the honesty gradient), not a fixed pixel-area. PASS 1 composes the WHOLE
    // cathedral (~10× the spire's surface), so the measured/rule_derived massing now
    // dominates the frame and the spire-tip CONJECTURE features (coq, pinnacle
    // spirelets) shrink to a small but non-zero area — they are still genuinely
    // present and visible. The conjecture threshold is scaled to the whole-cathedral
    // framing so the check still proves all four colors render without being a pure
    // area gate (la forêt — the conjecture-dominant roof tier — comes later).
    const pass = pct.conjecture > 0.01 && pct.reconstructed_design > 0.1 && pct.rule_derived > 0.05 && pct.measured > 0.02;
    results.push({
      id: "P03",
      assert: "provenance view shows all four evidence-class colors (presence — whole-cathedral framing)",
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
  building: "notre-dame-whole",
  spec: "artifacts/structural-spec.notre-dame-whole.json",
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
