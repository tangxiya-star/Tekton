#!/usr/bin/env node
/**
 * Yingzao Rule Engine — Notre-Dame de Paris WEST TOWERS + FACADE (tier v2).
 *
 * Derives artifacts/structural-spec.notre-dame-towers.json from
 * data/notre-dame-towers-canonical.json + the Gothic ruleset. Deterministic,
 * zero API calls. WEST TOWERS + FACADE ONLY (v2). The spire (v1) and Nanchan are
 * separate building keys and are NOT touched.
 *
 * Precedence contract (PRD §7.2 / GOAL §3), identical to the spire engine:
 *   measured / reconstructed_design  >  Gothic rule (rule_derived)  >  conjecture
 * A sourced value is NEVER overridden by a rule. The MEASURED anchors —
 * facade 43.5 m wide, towers 69 m, west rose 9.6 m, exactly 28 kings — set the
 * absolute scale; everything else is the VLD/Dehio-Bezold public-domain drawings'
 * reconstructed design proportions (reconstructed_design), the Gothic geometry
 * rules (rule_derived: two-centred arch, rose radial, ad quadratum, Roriczer
 * pinnacle), or flagged conjecture (the 19th-c chimeras/gargoyles).
 *
 * T02 (critical): the engine must NOT idealize toward an ad-quadratum /
 * ad-triangulum ideal — 43.5 m / 45 m / 69 m / 9.6 m are measured and win.
 *
 * Outputs:
 *   artifacts/structural-spec.notre-dame-towers.json
 *   artifacts/derivation-log.notre-dame-towers.md
 *   artifacts/derivation-stream.notre-dame-towers.jsonl (one event per component)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const C = JSON.parse(readFileSync(join(ROOT, "data/notre-dame-towers-canonical.json"), "utf8"));

const REG = C.source_registry;
const EXCL = C.rights_excluded || {};
const USABLE = new Set(
  Object.entries(REG)
    .filter(([, v]) => v && (v.verdict === "use" || v.verdict === "use-data"))
    .map(([k]) => k)
);

// Source keys that back at least one MEASURED canonical node carrying corroborating
// sources (i.e. >=2 independent sources). comp() enforces the >=2-source rule for
// any `measured` component at emit time — defense in depth alongside research ingest.
const MULTI_SOURCED = new Set();
(function collect(obj) {
  if (obj && typeof obj === "object") {
    if (obj.provenance === "measured" && typeof obj.source === "string" && Array.isArray(obj.corroborating_sources) && obj.corroborating_sources.length >= 1) {
      MULTI_SOURCED.add(obj.source);
    }
    for (const v of Object.values(obj)) collect(v);
  }
})(C);

const log = [];
const L = (s) => log.push(s);
const components = [];
const stream = []; // JSONL: one event per emitted component, in order

const r2 = (n) => Math.round(n * 1000) / 1000;
const rad = (deg) => (deg * Math.PI) / 180;

/**
 * Push a component; hard-fail if it lacks provenance/source (audit gate), if its
 * source isn't in the rights-cleared registry with a use/use-data verdict (G09 at
 * emit time), or if a `measured` component cites a restricted or single source
 * (T08 defense in depth). Stamps the resolved {url, rights} so every spec
 * component literally carries {provenance, source, url, rights}.
 */
let seq = 0;
function comp(c) {
  if (!c.provenance || !c.source) {
    throw new Error(`UNSOURCED COMPONENT: ${c.id} — nothing renders without a source.`);
  }
  if (EXCL[c.source]) {
    throw new Error(`RIGHTS VIOLATION: ${c.id} cites restricted source ${c.source} (${EXCL[c.source].verdict}) — cite-only, never a rendered value.`);
  }
  if (!REG[c.source] || !USABLE.has(c.source)) {
    throw new Error(`UNREGISTERED SOURCE: ${c.id} cites ${c.source} which is not in the rights-cleared registry with a use/use-data verdict.`);
  }
  if (c.provenance === "measured" && REG[c.source].verdict !== "use" && REG[c.source].verdict !== "use-data") {
    throw new Error(`NO-INVENTION GUARD: ${c.id} measured but source ${c.source} is not usable.`);
  }
  if (c.provenance === "measured" && !MULTI_SOURCED.has(c.source)) {
    throw new Error(`>=2-SOURCE RULE: ${c.id} is "measured" but ${c.source} does not back any multiply-sourced canonical node (single-source values must be reconstructed_design/conjecture).`);
  }
  if (!c.category) {
    throw new Error(`UNCATEGORIZED COMPONENT: ${c.id} — every component needs a category (facade/tower/buttress/portal/king/rose/gargoyle/pinnacle).`);
  }
  const out = {
    ...c,
    url: c.url || REG[c.source].url,
    rights: REG[c.source].rights,
    seq: seq++,
  };
  components.push(out);
  stream.push({
    seq: out.seq,
    id: out.id,
    phase: out.phase,
    category: out.category,
    provenance: out.provenance,
    source: out.source,
    name_en: out.name_en,
    name_fr: out.name_fr,
  });
}

// ===========================================================================
// MEASURED ANCHORS (never recomputed from a geometric ideal — T02 critical)
const WIDTH = C.facade.total_width.m;            // 43.5 — MEASURED
const BODY_H = C.facade.body_height_no_towers.m; // 45   — MEASURED
const TOWER_H = C.towers.height.m;               // 69   — MEASURED
const ROSE_D = C.rose_window.diameter.m;         // 9.6  — MEASURED
const KINGS = C.gallery_of_kings.figure_count.value; // 28 — MEASURED
const ROSE_RAYS = C.rose_window.tracery.rays;    // 24
const BUTTRESS_N = C.facade.buttress_count.value; // 4 — MEASURED
const N_TOWER_W = C.towers.north_tower_width.m;  // 14.91 — reconstructed_design
const S_TOWER_W = C.towers.south_tower_width.m;  // 13.69 — reconstructed_design
const KING_H = C.gallery_of_kings.figure_height.m;      // 3.5 — measured
const KING_BAND_Y = C.gallery_of_kings.band_height_m.m; // 20  — reconstructed_design
const DEPTH = 11.0; // facade structural depth (Z) — rule_derived massing (no published facade depth)

L(`# Derivation Log — Façade occidentale & tours de Notre-Dame de Paris (v2)`);
L(``);
L(`Rule Engine run. Inputs: \`data/notre-dame-towers-canonical.json\` (adversarial cite-or-gap corpus) + the Gothic ruleset (ad quadratum/triangulum, two-centred arch, rose radial, Roriczer pinnacle).`);
L(`Module = pied du roi = ${C.$schema_notes.units.pied_du_roi_mm} mm. Positions emitted in METRES. Facade in the X–Y plane facing +Z; ground at y=0.`);
L(`Precedence: measured / reconstructed_design → rule → flagged conjecture. The MEASURED anchors are never recomputed from a geometric ideal (T02 critical).`);
L(``);
L(`## 0. Anchors (measured)`);
L(`- Facade total width = **${WIDTH} m** [${C.facade.total_width.source}; +${(C.facade.total_width.corroborating_sources || []).length} corroborating]`);
L(`- Facade body height (below towers) = **${BODY_H} m** [${C.facade.body_height_no_towers.source}]`);
L(`- Tower culmination = **${TOWER_H} m** [${C.towers.height.source}; +${(C.towers.height.corroborating_sources || []).length} corroborating]`);
L(`- West rose diameter = **${ROSE_D} m** [${C.rose_window.diameter.source}; +${(C.rose_window.diameter.corroborating_sources || []).length} corroborating]`);
L(`- Gallery of Kings = exactly **${KINGS}** figures [${C.gallery_of_kings.figure_count.source}; +${(C.gallery_of_kings.figure_count.corroborating_sources || []).length} corroborating]`);
L(``);

// ---------------------------------------------------------------------------
// TRIPARTITE BAY LAYOUT — the 4 buttresses divide the 43.5 m facade into 3 bays.
// Per-portal width is a documented GAP, so bay widths are RULE_DERIVED by dividing
// the measured 43.5 m across the buttressed tripartite scheme (never surveyed).
const BUTTRESS_W = 2.4; // buttress thickness — rule_derived massing
// 3 bays + 4 buttresses span the 43.5 m width. Centre bay widest (portals: centre widest).
const totalButtress = BUTTRESS_N * BUTTRESS_W;            // 9.6
const bayBudget = WIDTH - totalButtress;                  // 33.9 across 3 bays
const centreBay = bayBudget * 0.40;                       // centre widest (~13.56)
const sideBay = (bayBudget - centreBay) / 2;              // ~10.17 each
// x of each buttress centreline, left→right (4 of them)
const halfW = WIDTH / 2;
const bxs = [];
{
  let x = -halfW + BUTTRESS_W / 2;
  bxs.push(x);                                  // outer-left buttress
  x += BUTTRESS_W / 2 + sideBay + BUTTRESS_W / 2;
  bxs.push(x);                                  // left-of-centre
  x += BUTTRESS_W / 2 + centreBay + BUTTRESS_W / 2;
  bxs.push(x);                                  // right-of-centre
  x += BUTTRESS_W / 2 + sideBay + BUTTRESS_W / 2;
  bxs.push(x);                                  // outer-right buttress
}
// bay centre x positions (between consecutive buttresses): left, centre, right
const bayCx = [
  (bxs[0] + bxs[1]) / 2,
  (bxs[1] + bxs[2]) / 2,
  (bxs[2] + bxs[3]) / 2,
];
L(`## 1. Tripartite bay layout — ${BUTTRESS_N} buttresses divide the measured ${WIDTH} m into 3 bays (rule_derived)`);
L(`- Per-portal width is a GAP (canonical _GAP_portal_widths_m) → bay widths derived by dividing the ${WIDTH} m: centre **${r2(centreBay)} m** (widest), sides **${r2(sideBay)} m** each, ${BUTTRESS_N}×${BUTTRESS_W} m buttresses. Never asserted as surveyed.`);
L(`- Buttress centrelines x = ${bxs.map(r2).join(", ")} m; bay centres x = ${bayCx.map(r2).join(", ")} m.`);
L(``);

// --- FACADE BODY (box, measured width) -------------------------------------
L(`## 2. Facade body — box ${WIDTH} m wide × ${BODY_H} m high (limestone; width MEASURED, T01 anchor)`);
comp({
  id: "facade-body",
  name_fr: "corps de la façade occidentale",
  name_en: "West facade body",
  phase: "facade",
  category: "facade",
  role: "The harmonic-facade body below the towers — the measured 43.5 m width is the verifier's primary anchor (T01).",
  geometry: { type: "box", w: WIDTH, h: BODY_H, d: DEPTH },
  position: [0, r2(BODY_H / 2), r2(-DEPTH / 2)],
  provenance: "measured",
  source: "FRIENDS-WEST-FACADE",
  url: C.facade.total_width.url,
  material: "limestone",
  width_m: WIDTH,
  note: "Width 43.5 m multiply confirmed (FRIENDS-WEST-FACADE + TECHNO-SCIENCE + BNF). Body height 45 m. Stone TYPE measured (Lutetian limestone); exact colour is conjecture/GAP — not invented.",
});
// horizontal string-course capping the facade body / springing the towers (form from PD drawings)
comp({
  id: "facade-cornice",
  name_fr: "corniche de la galerie des chimères",
  name_en: "Chimera-gallery cornice (facade top)",
  phase: "facade",
  category: "facade",
  role: "The horizontal colonnade course (Galerie des Chimères level) linking the two towers across the facade top.",
  geometry: { type: "box", w: WIDTH, h: 2.2, d: DEPTH + 0.6 },
  position: [0, r2(BODY_H - 1.1), r2(-DEPTH / 2)],
  provenance: "reconstructed_design",
  source: "DEHIO-BEZOLD",
  material: "limestone",
  note: "Register course form scaled off the Dehio-Bezold PD section (reconstructed_design); the gallery's exact height above ground is a GAP.",
});
L(``);

// --- TWO TOWERS (flanking, up to 69 m, flat-topped, N wider than S) --------
L(`## 3. Two west towers — culminate at ${TOWER_H} m, flat-topped (spires never built); N (${N_TOWER_W} m) wider than S (${S_TOWER_W} m)`);
L(`- Tower height 69 m is MEASURED (T02 critical anchor). Widths are single-source → reconstructed_design (asymmetry preserved, never normalized to identical twins). The towers carry NO spire — rendered flat-topped per the canonical (never "completed" to a Gothic ideal).`);
const towerBaseY = BODY_H; // towers rise from the facade-body top
for (const [side, w, label_fr, label_en] of [
  ["north", N_TOWER_W, "tour nord", "North tower"],
  ["south", S_TOWER_W, "tour sud", "South tower"],
]) {
  // north tower sits over the left (−x) bay, south over the right (+x) bay
  const cx = side === "north" ? bayCx[0] : bayCx[2];
  const towerH = TOWER_H - towerBaseY; // visible tower shaft above the body
  comp({
    id: `tower-${side}`,
    name_fr: label_fr,
    name_en: `${label_en} (square belfry)`,
    phase: "tower",
    category: "tower",
    role: `Square belfry tower culminating at the measured ${TOWER_H} m; flat-topped — the intended spire was never built.`,
    geometry: { type: "box", w, h: towerH, d: DEPTH },
    position: [r2(cx), r2(towerBaseY + towerH / 2), r2(-DEPTH / 2)],
    provenance: "reconstructed_design",
    source: "EN-WIKI-NDP",
    url: C.towers.north_tower_width.url,
    material: "limestone",
    width_m: w,
    note: `Top at ${TOWER_H} m (MEASURED, T02). Width ${w} m is single-source → reconstructed_design. N≠S asymmetry preserved.`,
  });
  // flat parapet cap (NO spire — measured fact)
  comp({
    id: `tower-${side}-parapet`,
    name_fr: `couronnement plat (${label_fr})`,
    name_en: `${label_en} flat parapet (no spire)`,
    phase: "tower",
    category: "tower",
    role: "Flat belfry parapet — the documented fact that the towers were never given their planned spires.",
    geometry: { type: "box", w: w + 0.8, h: 1.6, d: DEPTH + 0.8 },
    position: [r2(cx), r2(TOWER_H + 0.8), r2(-DEPTH / 2)],
    provenance: "measured",
    source: "BNF-FACADE-9POINTS",
    url: C.towers.spires_never_built.url,
    material: "limestone",
    note: "Flat top is the MEASURED fact (spires_never_built); top edge marks the 69 m culmination.",
  });
}
L(``);

// --- 4 BUTTRESSES (divide tripartite bays) ---------------------------------
L(`## 4. Four buttresses — vertical piers dividing the tripartite bays [count MEASURED: ${BUTTRESS_N}; T06]`);
for (let i = 0; i < BUTTRESS_N; i++) {
  const cx = bxs[i];
  comp({
    id: `buttress-${i}`,
    name_fr: `contrefort ${i + 1}`,
    name_en: `Buttress ${i + 1}`,
    phase: "buttress",
    category: "buttress",
    role: "One of the four vertical buttresses dividing the facade into its tripartite bays.",
    geometry: { type: "box", w: BUTTRESS_W, h: BODY_H, d: DEPTH + 1.2 },
    position: [r2(cx), r2(BODY_H / 2), r2(-DEPTH / 2 + 0.6)],
    provenance: "measured",
    source: "FRIENDS-WEST-FACADE",
    url: C.facade.buttress_count.url,
    material: "limestone",
    note: `Buttress count = ${BUTTRESS_N} MEASURED (FRIENDS-WEST-FACADE + EN-WIKI-NDP). Thickness ${BUTTRESS_W} m is rule_derived massing.`,
  });
}
L(``);

// --- 3 PORTALS (base; centre widest; pointed two-centred arch = rule_derived)
L(`## 5. Three west portals — base; centre widest; pointed arch via the two-centred-arch rule (rule_derived)`);
L(`- L = Portal of the Virgin, centre = Last Judgment (widest), R = St-Anne [identities MEASURED; FRIENDS-PORTALS]. Per-portal widths are a GAP → opening widths rule_derived from the bay widths; the pointed arch head is struck by the two-centred-arch rule.`);
const PORTALS = [
  ["left", "portail de la Vierge", "Portal of the Virgin (north/left)", sideBay, false],
  ["centre", "portail du Jugement dernier", "Portal of the Last Judgment (centre, widest)", centreBay, true],
  ["right", "portail Sainte-Anne", "Portal of St-Anne (south/right)", sideBay, false],
];
for (let p = 0; p < PORTALS.length; p++) {
  const [key, fr, en, bayW, widest] = PORTALS[p];
  const cx = bayCx[p];
  const openW = bayW * 0.62;              // opening narrower than its bay — rule_derived
  const jambH = openW * 1.05;             // springing height (vertical jambs)
  const arcR = openW / 2;                 // two-centred arch: radius = full opening width / 2 from each springing
  // jambs/surround (box framing the opening)
  comp({
    id: `portal-${key}`,
    name_fr: fr,
    name_en: en,
    phase: "portal",
    category: "portal",
    role: widest
      ? "The central Portal of the Last Judgment — the widest of the three, per the cited record."
      : "Lateral west portal at the facade base.",
    geometry: { type: "box", w: openW, h: jambH, d: 2.2 },
    position: [r2(cx), r2(jambH / 2), r2(0.4)],
    rotation_deg: [0, 0, 0],
    provenance: "rule_derived",
    source: "TWO-CENTRED-ARCH",
    material: "limestone",
    portal_is_widest: widest,
    opening_width_m: r2(openW),
    note: "Per-portal width is a GAP (canonical _GAP_portal_widths_m); opening rule_derived from the bay width. Centre opening widest (FRIENDS-PORTALS confirms centre widest, gives no metric).",
  });
  // pointed arch head — two-centred (Gothic) arch struck from the two springing points
  // approximated as a polygonal pointed arch (apex above centre at jambH + arcR*√3/2 ~ equilateral two-centred)
  const apexY = jambH + arcR * Math.sqrt(3) / 2;
  const archPts = [
    [r2(cx - openW / 2), r2(jambH), r2(0.4)],
    [r2(cx + openW / 2), r2(jambH), r2(0.4)],
    [r2(cx), r2(apexY), r2(0.4)],
  ];
  comp({
    id: `portal-${key}-arch`,
    name_fr: `arc brisé (${fr})`,
    name_en: `Pointed (two-centred) arch — ${en}`,
    phase: "portal",
    category: "portal",
    role: "The pointed arch head struck by the two-centred-arch rule from the two springing points.",
    geometry: { type: "poly", pts: archPts },
    position: [0, 0, 0],
    provenance: "rule_derived",
    source: "TWO-CENTRED-ARCH",
    material: "limestone",
    note: "Two-centred (equilateral) Gothic arch — pure geometry struck from the springing points; rise = halfwidth × √3 (rule_derived, not surveyed).",
  });
}
L(``);

// --- GALLERY OF KINGS — EXACTLY 28 figures, ~3.5 m, band ~20 m up -----------
L(`## 6. Gallery of Kings — EXACTLY ${KINGS} figures, ≈${KING_H} m tall, band ≈${KING_BAND_Y} m up [count MEASURED, T03; figures reconstructed_design — 19th-c VLD restorations]`);
L(`- 28 Kings of Judah (NOT kings of France). The figures TODAY are Viollet-le-Duc's 19th-c restorations (21 original heads at the Musée de Cluny) → reconstructed_design, never presented as medieval fabric. Cite CLUNY-HEADS / PANORAMA-GALERIE-ROIS.`);
{
  // 28 statues evenly spaced across the facade width on the Gallery of Kings band.
  // The band sits ~20 m up (band_height_m, reconstructed_design — single source).
  const margin = 1.6;
  const span = WIDTH - 2 * margin;
  const baseY = KING_BAND_Y;
  for (let k = 0; k < KINGS; k++) {
    const x = -span / 2 + (span * k) / (KINGS - 1);
    // simple statue massing: a standing column-figure (body capsule + head sphere),
    // sized so head-top − body-bottom == the measured ~3.5 m figure height.
    const H = KING_H;
    const rBody = r2(0.13 * H), hBody = r2(0.6 * H), rHead = r2(0.11 * H);
    comp({
      id: `king-${k}`,
      name_fr: `roi de Juda ${k + 1}`,
      name_en: `King of Judah ${k + 1}`,
      phase: "king",
      category: "king",
      role: "One of the 28 Kings of Judah on the Gallery of Kings — a 19th-c Viollet-le-Duc restoration (the medieval originals were decapitated in 1793).",
      geometry: { type: "capsule", r: rBody, h: hBody },
      position: [r2(x), r2(baseY + 0.43 * H), r2(0.7)],
      provenance: "reconstructed_design",
      source: "PANORAMA-GALERIE-ROIS",
      url: C.gallery_of_kings.current_figures_origin.url,
      material: "limestone",
      figure_height_m: H,
      note: "Count 28 MEASURED (T03); figures reconstructed_design (19th-c VLD restoration, Geoffroi-Dechaume; 21 original heads at Cluny). Band height ~20 m is single-source → reconstructed_design placement, not surveyed.",
    });
    const H2 = KING_H;
    comp({
      id: `king-${k}-head`,
      name_fr: `roi de Juda ${k + 1} · tête`,
      name_en: `King of Judah ${k + 1} — head`,
      phase: "king",
      category: "king",
      role: "Head of a Gallery-of-Kings figure (19th-c restoration; the 21 medieval heads are at the Musée de Cluny).",
      geometry: { type: "sphere", r: rHead },
      position: [r2(x), r2(baseY + 0.9 * H2), r2(0.7)],
      provenance: "reconstructed_design",
      source: "CLUNY-HEADS",
      url: C.gallery_of_kings.current_figures_origin.url,
      material: "limestone",
      note: "Head top lands at band + 3.5 m (the measured figure height). Originals at the Musée de Cluny (CLUNY-HEADS).",
    });
  }
}
L(``);

// --- WEST ROSE WINDOW — 9.6 m diameter (measured), ~24 rays (rule_derived) --
L(`## 7. West rose window — diameter ${ROSE_D} m (MEASURED, T05), ${ROSE_RAYS}-ray radial wheel tracery (rule_derived geometry), centred above the central portal`);
{
  const roseR = ROSE_D / 2;
  // centre the rose above the central portal, on the rose-zone register (above the kings)
  const roseCx = bayCx[1];
  const roseCy = KING_BAND_Y + KING_H + roseR + 2.0; // above the kings band
  // outer ring of the rose (torus, measured diameter)
  comp({
    id: "rose-outer-ring",
    name_fr: "rose occidentale — cercle extérieur",
    name_en: "West rose — outer ring",
    phase: "rose",
    category: "rose",
    role: "The outer ring of the west rose window — its 9.6 m diameter is the verifier's rose anchor (T05).",
    geometry: { type: "torus", r: r2(roseR - 0.2), rt: 0.3 },
    position: [r2(roseCx), r2(roseCy), r2(0.5)],
    rotation_deg: [0, 0, 0],
    provenance: "measured",
    source: "FRIENDS-ROSE-WINDOWS",
    url: C.rose_window.diameter.url,
    material: "limestone",
    diameter_m: ROSE_D,
    note: "Diameter 9.6 m MEASURED (FRIENDS-ROSE-WINDOWS + TECHNO-SCIENCE + BNF). Radial geometry below is rule_derived from the cited 24-ray count.",
  });
  // hub
  comp({
    id: "rose-hub",
    name_fr: "rose occidentale — moyeu",
    name_en: "West rose — hub",
    phase: "rose",
    category: "rose",
    role: "Central hub of the radial wheel from which the spokes radiate.",
    geometry: { type: "cylinder", r: 0.55, h: 0.4, axis: "z" },
    position: [r2(roseCx), r2(roseCy), r2(0.5)],
    provenance: "rule_derived",
    source: "ROSE-RADIAL",
    material: "limestone",
    note: "Radial wheel hub — pure rose-radial geometry.",
  });
  // ~24 radial spokes (rays), rule_derived from the cited 24-ray count
  for (let k = 0; k < ROSE_RAYS; k++) {
    const phi = (360 / ROSE_RAYS) * k;
    const cx = Math.cos(rad(phi)), cy = Math.sin(rad(phi));
    const len = roseR - 0.4;
    const mid = (len / 2) + 0.4;
    comp({
      id: `rose-ray-${k}`,
      name_fr: `rose occidentale — rayon ${k + 1}`,
      name_en: `West rose — spoke ${k + 1}`,
      phase: "rose",
      category: "rose",
      role: "One radial spoke of the wheel tracery — radial geometry from the centre.",
      geometry: { type: "box", w: 0.12, h: len, d: 0.18 },
      position: [r2(roseCx + cx * mid), r2(roseCy + cy * mid), r2(0.5)],
      rotation_deg: [0, 0, r2(phi - 90)],
      provenance: "rule_derived",
      source: "ROSE-RADIAL",
      material: "limestone",
      note: `Spoke ${k + 1} of ${ROSE_RAYS} — rule_derived radial geometry (the ray count is the cited tracery datum; the diameter is measured).`,
    });
  }
}
L(``);

// --- CHIMERAS / GARGOYLES — representative few, flagged CONJECTURE -----------
L(`## 8. Chimeras / gargoyles — a representative few, flagged CONJECTURE (form reconstructed_design from VLD; NEVER a sourced count)`);
L(`- The Galerie des Chimères is a wholesale 19th-c VLD/Lassus invention (NOT medieval). No reliable total count is published (_GAP_gargoyle_count) → we render a representative few flagged conjecture; the form derives from the PD VLD drawings.`);
{
  const galleryY = BODY_H + 1.0; // on the chimera-gallery cornice level
  const REP = 6; // a representative FEW — explicitly not a sourced count
  for (let k = 0; k < REP; k++) {
    const x = -WIDTH / 2 + 3 + (WIDTH - 6) * (k / (REP - 1));
    comp({
      id: `chimera-${k}`,
      name_fr: `chimère ${k + 1} (galerie des chimères, 19e s.)`,
      name_en: `Chimera ${k + 1} (Gallery of Chimeras, 19th-c)`,
      phase: "gargoyle",
      category: "gargoyle",
      role: "A representative chimera on the 19th-c Galerie des Chimères — a Viollet-le-Duc/Lassus invention; a FEW are shown, never a sourced total.",
      geometry: { type: "capsule", r: 0.45, h: 1.0 },
      position: [r2(x), r2(galleryY + 0.7), r2(0.9)],
      rotation_deg: [18, 0, 0],
      provenance: "conjecture",
      source: "VLD-FACADE",
      material: "limestone",
      note: "Form reconstructed_design from the PD VLD drawings; rendered count is a representative FEW flagged CONJECTURE (no reliable published total — _GAP_gargoyle_count). Never presented as a sourced count.",
    });
  }
  // a couple of projecting gargoyle waterspouts at the tower bases (also conjecture)
  for (const [side] of [["north"], ["south"]]) {
    const cx = side === "north" ? bayCx[0] : bayCx[2];
    comp({
      id: `gargoyle-${side}`,
      name_fr: `gargouille (${side === "north" ? "tour nord" : "tour sud"}, 19e s.)`,
      name_en: `Gargoyle waterspout (${side} tower, 19th-c)`,
      phase: "gargoyle",
      category: "gargoyle",
      role: "A projecting gargoyle waterspout (functional) — the ones seen today are largely 19th-c replacements.",
      geometry: { type: "cone", r: 0.3, rTop: 0.06, h: 1.8, scale: [1, 1, 1] },
      position: [r2(cx + (side === "north" ? -1 : 1) * 3.0), r2(BODY_H + 4.0), r2(2.0)],
      rotation_deg: [70, 0, 0],
      provenance: "conjecture",
      source: "VLD-FACADE",
      material: "limestone",
      note: "Representative gargoyle (19th-c replacement). Form reconstructed_design from VLD; rendered as a flagged conjecture, never a sourced count.",
    });
  }
}
L(``);

// --- TOWER PINNACLES — Roriczer rule (rule_derived) -------------------------
L(`## 9. Tower pinnacles — set out by the Roriczer (1486) rule [rule_derived; proportions conjecture per _GAP_pinnacle_dims]`);
{
  // 4 corner pinnacles per tower top.
  for (const [side, w] of [["north", N_TOWER_W], ["south", S_TOWER_W]]) {
    const cx = side === "north" ? bayCx[0] : bayCx[2];
    const corners = [
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];
    let i = 0;
    for (const [sx, sz] of corners) {
      const baseSide = 0.7;
      const shaftH = baseSide * 6; // Roriczer ~6× vertical multiple
      const px = cx + sx * (w / 2 - 0.5);
      const pz = -DEPTH / 2 + sz * (DEPTH / 2 - 0.5);
      const yb = TOWER_H + 1.6; // on the parapet
      comp({
        id: `pinnacle-${side}-${i}`,
        name_fr: `pinacle (${side === "north" ? "tour nord" : "tour sud"})`,
        name_en: `Tower pinnacle (Roriczer rule) — ${side}`,
        phase: "pinnacle",
        category: "pinnacle",
        role: "Corner pinnacle on the tower parapet, set out by the 1486 Roriczer rule.",
        geometry: { type: "box", w: baseSide, h: shaftH, d: baseSide },
        position: [r2(px), r2(yb + shaftH / 2), r2(pz)],
        provenance: "rule_derived",
        source: "AD-QUADRATUM",
        material: "limestone",
        note: "Roriczer pinnacle: base square → 45°-rotated inscribed squares (ad quadratum, 1/√2). Dimensions are a GAP (_GAP_pinnacle_dims) → proportions rule_derived, not surveyed.",
      });
      // tapering cap (spirelet)
      comp({
        id: `pinnacle-${side}-${i}-cap`,
        name_fr: `amortissement du pinacle (${side === "north" ? "tour nord" : "tour sud"})`,
        name_en: `Pinnacle cap — ${side}`,
        phase: "pinnacle",
        category: "pinnacle",
        role: "Tapering cap of the tower pinnacle.",
        geometry: { type: "cone", r: 0.5, rTop: 0.02, h: 2.2 },
        position: [r2(px), r2(yb + shaftH + 1.1), r2(pz)],
        provenance: "rule_derived",
        source: "AD-QUADRATUM",
        material: "limestone",
        note: "Pinnacle cap — Roriczer/ad-quadratum geometry; proportions conjecture (_GAP_pinnacle_dims).",
      });
      i++;
    }
  }
}
L(``);

// --- assemble & audit --------------------------------------------------------
const counts = {};
for (const c of components) counts[c.provenance] = (counts[c.provenance] || 0) + 1;
const catCounts = {};
for (const c of components) catCounts[c.category] = (catCounts[c.category] || 0) + 1;

const spec = {
  meta: {
    building: C.meta.name_fr,
    building_en: C.meta.name_en,
    building_key: "notre-dame-towers",
    tier: C.meta.tier,
    build_state: C.meta.build_state,
    generated_by: "scripts/derive-notre-dame-towers.mjs (Yingzao Rule Engine — west towers & facade)",
    canonical_source: "data/notre-dame-towers-canonical.json",
  },
  units: { scene_scale: C.$schema_notes.units.scene_scale_m_per_unit || 1, unit: "metre", pied_du_roi_mm: C.$schema_notes.units.pied_du_roi_mm, note: "All positions/dimensions in metres. Facade in the X–Y plane facing +Z; ground at y=0." },
  provenance_colors: C.$schema_notes.provenance_colors,
  phases: ["facade", "tower", "buttress", "portal", "king", "rose", "gargoyle", "pinnacle"],
  key_dimensions: {
    facade_width_m: WIDTH,
    facade_body_height_m: BODY_H,
    tower_height_m: TOWER_H,
    north_tower_width_m: N_TOWER_W,
    south_tower_width_m: S_TOWER_W,
    rose_diameter_m: ROSE_D,
    rose_rays: ROSE_RAYS,
    buttress_count: BUTTRESS_N,
    king_count: components.filter((c) => c.category === "king" && !c.id.endsWith("-head")).length,
    portal_count: components.filter((c) => c.category === "portal" && /-arch$/.test(c.id) === false).length,
    centre_portal_widest: true,
  },
  category_counts: catCounts,
  components,
};

L(`## 10. Provenance audit`);
L(`- Components: ${components.length} total — ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Categories: ${Object.entries(catCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Audit gate: every component carries {category, provenance, source, url, rights}; source resolves to the rights-cleared registry (use/use-data); a restricted/unregistered source, or a single-source "measured", throws.`);
L(`- Kings = ${spec.key_dimensions.king_count} (T03 = exactly 28). Portals = ${spec.key_dimensions.portal_count} (centre widest). Buttresses = ${BUTTRESS_N}. Rose Ø ${ROSE_D} m.`);
L(``);
L(`## 11. Measured-reality deviations (kept, never corrected — T02)`);
for (const d of C.ideal_deviations_index.items) L(`- ${d}`);
L(``);
L(`*43.5 m / 69 m / 9.6 m / 28 kings are MEASURED and outrank any geometric ideal.*`);

mkdirSync(join(ROOT, "artifacts"), { recursive: true });
writeFileSync(join(ROOT, "artifacts/structural-spec.notre-dame-towers.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(ROOT, "artifacts/derivation-log.notre-dame-towers.md"), log.join("\n") + "\n");
writeFileSync(
  join(ROOT, "artifacts/derivation-stream.notre-dame-towers.jsonl"),
  stream.map((e) => JSON.stringify(e)).join("\n") + "\n"
);
console.log(`derive (notre-dame-towers): ${components.length} components → artifacts/structural-spec.notre-dame-towers.json`);
console.log(`provenance: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
console.log(`categories: ${Object.entries(catCounts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
console.log(`anchors: facade ${WIDTH} m (measured) · towers ${TOWER_H} m (measured) · rose ${ROSE_D} m (measured) · ${spec.key_dimensions.king_count} kings (measured) · ${BUTTRESS_N} buttresses`);
