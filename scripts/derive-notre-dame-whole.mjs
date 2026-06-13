#!/usr/bin/env node
/**
 * Yingzao Rule Engine — Notre-Dame de Paris, WHOLE CATHEDRAL (PASS 1 massing + spire).
 *
 * Derives ONE artifacts/structural-spec.notre-dame-whole.json from
 * data/notre-dame-whole-canonical.json + the Gothic ruleset. Deterministic, zero API calls.
 *
 * RE-KEYED (notre-dame-whole): this is the SEPARATE whole-cathedral building. The
 * focused spire (scripts/derive-notre-dame.mjs → structural-spec.notre-dame.json)
 * is left untouched and stays spire-only. This composer reads its own canonical
 * (which carries `cathedral_massing` + the whole-cathedral source registry) and
 * emits its own -whole artifacts.
 *
 * COMPOSER MODEL (docs/WHOLE_CATHEDRAL_ARCHITECTURE.md):
 *   The building is composed from per-tier FRAGMENTS. Each fragment is a derive
 *   scope that emits components in LOCAL coordinates through the shared comp()
 *   audit gate; the composer OFFSETS every captured component to its WORLD
 *   position (crossing at the origin, metres), namespaces massing ids
 *   `<fragment>:<local>`, and assigns the global seq in construction order
 *   (massing shells first → the spire last, so the Build Theater plays base-up).
 *
 *   PASS 1 fragments = the whole-cathedral MASSING (fidelity:"massing", simple
 *   procedural box / extruded poly / lathe volumes) + the existing flawless SPIRE
 *   (fidelity:"full"), which composes in at the crossing [0,0,0] UNCHANGED — its
 *   ids/positions are byte-identical to the standalone spire, so V08–V14 stay green.
 *
 * Precedence contract (PRD §7.2 / GOAL §3):
 *   measured / reconstructed_design  >  Gothic rule (rule_derived)  >  conjecture
 * A sourced value is NEVER overridden by a rule. The MEASURED headline dims
 * (length 128, width 48, façade 43.5/45, towers 69, vault 33, vessel 13, aisle 5.9,
 * transept 48×14, spire 96/30) set the scale; every internal split the corpus does
 * NOT publish (crossing position along the 128 m, nave-vs-choir division, bay
 * interval, wall depths, tower footprints, aisle/roof heights) is rule_derived /
 * GAP and flagged — never invented, never asserted as measured.
 *
 * V08 (critical) generalises to V-VLT: a massing dim that is a corpus headline is
 * `measured` and must NOT be recomputed toward a geometric ideal (vault crown 33 m,
 * never 35 m / 43 m).
 *
 * Outputs: artifacts/structural-spec.notre-dame-whole.json, artifacts/derivation-log.notre-dame-whole.md
 * + artifacts/derivation-stream.notre-dame-whole.jsonl (one event per component, in order).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const C = JSON.parse(readFileSync(join(ROOT, "data/notre-dame-whole-canonical.json"), "utf8"));

const REG = C.source_registry;
const EXCL = C.rights_excluded || {};
const USABLE = new Set(
  Object.entries(REG)
    .filter(([, v]) => v && (v.verdict === "use" || v.verdict === "use-data"))
    .map(([k]) => k)
);

// Source keys that back at least one MEASURED canonical node carrying corroborating
// sources (i.e. >=2 independent sources). comp() enforces the >=2-source rule for any
// `measured` component at emit time too — defense in depth alongside research ingest.
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

// ===========================================================================
// THE AUDIT GATE (shared by every fragment via a capturing wrapper)
// ---------------------------------------------------------------------------
// rawComp() is the real gate: hard-fail if a component lacks provenance/source,
// if its source isn't in the rights-cleared registry with a use/use-data verdict
// (G09), if a `measured` component cites a restricted source (V13), or if a
// `measured` component is single-sourced (>=2-source rule). It stamps the
// resolved {url, rights} so every spec component literally carries
// {provenance, source, url, rights}, and assigns the global seq.
// ===========================================================================
let seq = 0;
function rawComp(c) {
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
    fragment: out.fragment,
    fidelity: out.fidelity,
    provenance: out.provenance,
    source: out.source,
    name_en: out.name_en,
    name_fr: out.name_fr,
  });
  return out;
}

// ---------------------------------------------------------------------------
// THE COMPOSER: run a fragment in LOCAL coords, buffer its components, then
// offset each to WORLD, namespace massing ids, stamp {fragment, fidelity}, and
// push through the shared gate in construction order.
// ---------------------------------------------------------------------------
function offsetPoint(p, off) {
  return [r2(p[0] + off[0]), r2(p[1] + off[1]), r2(p[2] + off[2])];
}
function offsetGeometry(g, off) {
  // Only `poly` carries absolute world points in pts[]; lathe pts are
  // [radius, localY] revolved about the component's own position, so offsetting
  // the position alone suffices. box/cylinder/cone/sphere/capsule/torus are all
  // positioned by `position`. Rotations are unchanged (fragments author in the
  // world axis convention; PASS 1 has no per-fragment rotation — the apse
  // lathe authors its own local rotation).
  if (g.type === "poly") return { ...g, pts: g.pts.map((p) => offsetPoint(p, off)) };
  return g;
}
function runFragment({ key, fidelity, offset, fn }) {
  const buffered = [];
  // a capturing comp() handed to the fragment — same shape as rawComp, but it
  // buffers LOCAL components so the composer can offset + namespace them.
  const capture = (c) => { buffered.push(c); return c; };
  fn({ C, comp: capture, anchors: ANCHORS });
  for (const c of buffered) {
    const isSpire = key === "spire";
    rawComp({
      ...c,
      // SPIRE stays byte-identical: keep its ids/positions UNCHANGED (no namespace,
      // no offset — its local frame already equals world at [0,0,0]). Massing
      // fragments are namespaced and offset to their world position.
      id: isSpire ? c.id : `${key}:${c.id}`,
      fragment: key,
      fidelity: c.fidelity || fidelity,
      position: isSpire ? c.position : offsetPoint(c.position, offset),
      geometry: isSpire ? c.geometry : offsetGeometry(c.geometry, offset),
    });
  }
}

// ===========================================================================
// SHARED ANCHORS — the measured headline dims + the rule_derived longitudinal
// split, computed ONCE so every fragment agrees on the seams.
// ===========================================================================
const M = C.cathedral_massing;
const TOTAL_LEN = M.total_length.m;          // 128 — measured
const WIDTH_TX = M.total_width_transept.m;   // 48 — measured (arm-to-arm)
const ARM_W = M.transept_arm_width.m;        // 14 — measured (crossing footprint along X & arm thickness)
const FACADE_W = M.west_facade_width.m;      // 43.5 — measured
const FACADE_H = M.facade_height_no_towers.m; // 45 — measured
const TOWER_H = M.west_tower_height.m;        // 69 — measured
const VESSEL_W = M.nave_vessel_width.m;       // 13 — measured
const AISLE_W = M.side_aisle_width.m;         // 5.9 — measured
const NAVE_BAYS = M.nave_bays.value;          // 10 — measured (count)
const VAULT_H = M.vault_crown_height.m;       // 33 — measured (MEASURED-REALITY GUARD)
const ROOF_H = M.height_under_roof.m;         // 43 — measured
const CHEVET_D = M.chevet_outer_diameter.m;   // 47.88 — measured

// --- rule_derived longitudinal split (the corpus does NOT publish these) -----
const FACADE_DEPTH = 4;                 // rule_derived wall depth (GAP _GAP_wall_depths)
const HALF_LEN = TOTAL_LEN / 2;         // 64
const FACADE_OUTER_X = -HALF_LEN + FACADE_DEPTH; // -60 (facade outer face at -64+4 = -60 → keep -60)
// Place the facade OUTER face at -60 and the chevet OUTER at +68 → span 128 (rule_derived placement).
const WEST_OUTER_X = -60;               // rule_derived (crossing at origin → west end -60, chevet +68)
const CHEVET_OUTER_X = WEST_OUTER_X + TOTAL_LEN; // +68
const CROSSING_HALF = ARM_W / 2;        // 7 — crossing spans -7..+7 along X (square-ish: arm width)
const NAVE_X0 = WEST_OUTER_X + FACADE_DEPTH; // -56 (facade inner)
const NAVE_X1 = -CROSSING_HALF;         // -7 (crossing west face)
const NAVE_LEN = NAVE_X1 - NAVE_X0;     // 49 — rule_derived
const BAY_INTERVAL = r2(NAVE_LEN / NAVE_BAYS); // ~4.9 — rule_derived (count measured)
const CHOIR_X0 = CROSSING_HALF;         // +7 (crossing east face)
const APSE_RADIUS = CHEVET_D / 2;       // ~23.94 — measured (outer Ø/2)
// choir straight bays run +7 → apse springing; apse hemicycle reaches +68.
const APSE_CENTER_X = CHEVET_OUTER_X - APSE_RADIUS; // +68 - 23.94 = +44.06 (apse semicircle centre)
const CHOIR_X1 = APSE_CENTER_X;         // choir straight bays end where the hemicycle springs
const CHOIR_LEN = CHOIR_X1 - CHOIR_X0;  // rule_derived
const AISLE_OFFSET_Z = VESSEL_W / 2 + AISLE_W / 2; // centreline of each aisle
const AISLE_H = r2(VAULT_H * 0.72);     // rule_derived aisle height (GAP _GAP_aisle_vault_heights)
const TOWER_FOOT = 11.5;                // rule_derived tower footprint (GAP _GAP_wall_depths)
const TOWER_GAP = FACADE_W - 2 * TOWER_FOOT; // central screen between towers
const TOWER_OFFSET_Z = FACADE_W / 2 - TOWER_FOOT / 2; // tower centreline ±Z

const ANCHORS = {
  TOTAL_LEN, WIDTH_TX, ARM_W, FACADE_W, FACADE_H, TOWER_H, VESSEL_W, AISLE_W,
  NAVE_BAYS, VAULT_H, ROOF_H, CHEVET_D, WEST_OUTER_X, CHEVET_OUTER_X, NAVE_X0,
  NAVE_X1, NAVE_LEN, BAY_INTERVAL, CHOIR_X0, CHOIR_X1, CHOIR_LEN, APSE_RADIUS,
  APSE_CENTER_X, AISLE_OFFSET_Z, AISLE_H, FACADE_DEPTH, TOWER_FOOT, TOWER_OFFSET_Z,
};

// ===========================================================================
// PASS-1 MASSING FRAGMENTS — simple procedural volumes; every block via comp()
// so it carries {provenance, source, url, rights}; category massing-<part>,
// fidelity "massing". Headline dims = measured; placements the corpus does not
// publish = rule_derived (with a note); aisle/roof heights = rule_derived (GAP).
// ===========================================================================

// helper: a measured massing source citation for a headline dim node
const SRC = {
  len: "FRIENDS-LAYOUT", wid: "FRIENDS-LAYOUT", arm: "FRIENDS-LAYOUT",
  facade: "FRIENDS-LAYOUT", facadeH: "FRIENDS-LAYOUT", tower: "WIKI-NDP",
  vessel: "FRIENDS-LAYOUT", aisle: "FRIENDS-LAYOUT", bays: "FRIENDS-LAYOUT",
  vault: "FRIENDS-LAYOUT", roof: "FRIENDS-LAYOUT", chevet: "FRIENDS-LAYOUT",
};
const RULE_SRC = "AD-QUADRATUM";   // pure-geometry rule backing rule_derived placements
const PLAN_SRC = "DEHIO-BEZOLD";   // PD plan backing rule_derived longitudinal layout

// --- crossing block (carries the spire) -------------------------------------
function deriveCrossing({ comp }) {
  const cx = 0, len = ARM_W, h = ROOF_H, w = ARM_W;
  comp({
    id: "mass",
    name_fr: "croisée du transept (volume)", name_en: "Crossing block (carries the spire)",
    phase: "massing-crossing",
    category: "massing-crossing",
    role: "The square-ish transept crossing on which the flèche is anchored — the world origin. Width 14 m is measured (transept arm width); its X centre = the origin is rule_derived (crossing position along the 128 m is not published).",
    geometry: { type: "box", w: len, h, d: w },
    position: [cx, r2(h / 2), 0],
    provenance: "measured",
    source: SRC.arm,
    material: "lead",
    note: "Width 14 m MEASURED (transept arm width, FRIENDS+de.Wikipedia). The crossing CENTRE at the origin is rule_derived — the corpus does not publish the crossing position along the 128 m total length.",
  });
}

// --- nave vessel + two side aisles (running -X) ------------------------------
function deriveNave({ comp }) {
  const cx = r2((NAVE_X0 + NAVE_X1) / 2);
  // central vessel: 13 m wide, 33 m vault crown (measured dims; length/offset rule_derived)
  comp({
    id: "vessel",
    name_fr: "vaisseau central de la nef", name_en: "Nave central vessel",
    phase: "massing-nave",
    category: "massing-nave",
    role: "The central nave vessel — 13 m clear width, 33 m high-vault crown (both measured). Its 49 m length and crossing offset are rule_derived (10 bays × ~4.9 m; the nave-vs-choir split is not published).",
    geometry: { type: "box", w: r2(NAVE_LEN), h: VAULT_H, d: VESSEL_W },
    position: [cx, r2(VAULT_H / 2), 0],
    provenance: "measured",
    source: SRC.vessel,
    material: "lead",
    note: `Vessel width 13 m + vault crown 33 m MEASURED (FRIENDS layout / techno-science / de.Wikipedia). Length ${r2(NAVE_LEN)} m over ${NAVE_BAYS} measured bays (interval ~${BAY_INTERVAL} m) is rule_derived. MEASURED-REALITY GUARD: 33 m is the crown, never 35 m / 43 m.`,
  });
  // two side aisles, 5.9 m each, mirrored on +-Z, rule_derived height (GAP)
  for (const s of [1, -1]) {
    comp({
      id: s > 0 ? "aisle-N" : "aisle-S",
      name_fr: s > 0 ? "bas-côté nord" : "bas-côté sud", name_en: s > 0 ? "North side aisle" : "South side aisle",
      phase: "massing-aisle",
      category: "massing-aisle",
      role: "Inner side aisle — 5.9 m clear width (measured). Its vault crown height is not published (corpus gap) → rendered at a rule_derived height below the 33 m vessel crown.",
      geometry: { type: "box", w: r2(NAVE_LEN), h: AISLE_H, d: AISLE_W },
      position: [cx, r2(AISLE_H / 2), r2(s * AISLE_OFFSET_Z)],
      provenance: "measured",
      source: SRC.aisle,
      material: "lead",
      note: "Aisle width 5.9 m MEASURED (FRIENDS layout). Aisle vault crown height is a GAP (_GAP_aisle_vault_heights) → height is rule_derived, never asserted as measured.",
    });
  }
}

// --- transept arms (±Z through the crossing) ---------------------------------
function deriveTransept({ comp }) {
  const armTip = r2(WIDTH_TX / 2); // 24 — each arm reaches ±24 m (48 m arm-to-arm)
  const armLen = armTip;           // arm box spans the crossing centre (0) out to ±24 m
  for (const s of [1, -1]) {
    comp({
      id: s > 0 ? "arm-N" : "arm-S",
      name_fr: s > 0 ? "bras nord du transept" : "bras sud du transept", name_en: s > 0 ? "North transept arm" : "South transept arm",
      phase: "massing-transept",
      category: "massing-transept",
      role: "Transept arm reaching ±24 m from the crossing (48 m arm-to-arm, measured); 14 m wide along X (measured). Length to ±24 m is measured-derived from the 48 m width.",
      geometry: { type: "box", w: ARM_W, h: ROOF_H, d: armLen },
      position: [0, r2(ROOF_H / 2), r2(s * armLen / 2)],
      provenance: "measured",
      source: SRC.wid,
      material: "lead",
      note: "Arm-to-arm 48 m + arm width 14 m MEASURED (FRIENDS layout). The arm spans the crossing centre out to ±24 m (measured-derived from the 48 m width).",
    });
  }
}

// --- choir vessel + apse / chevet (running +X) -------------------------------
function deriveChoir({ comp }) {
  const cx = r2((CHOIR_X0 + CHOIR_X1) / 2);
  comp({
    id: "vessel",
    name_fr: "vaisseau du chœur", name_en: "Choir vessel",
    phase: "massing-choir",
    category: "massing-choir",
    role: "The choir vessel east of the crossing — same 13 m vessel width and 33 m vault crown as the nave (measured). Its length and the nave-vs-choir split are rule_derived (not published).",
    geometry: { type: "box", w: r2(CHOIR_LEN), h: VAULT_H, d: VESSEL_W },
    position: [cx, r2(VAULT_H / 2), 0],
    provenance: "measured",
    source: SRC.vessel,
    material: "lead",
    note: `Vessel width 13 m + vault crown 33 m MEASURED. Choir straight-bay length ${r2(CHOIR_LEN)} m and the nave/choir split are rule_derived (the corpus publishes no clean modern split).`,
  });
  // choir side aisles (continuing the nave aisles east, to the apse springing)
  for (const s of [1, -1]) {
    comp({
      id: s > 0 ? "aisle-N" : "aisle-S",
      name_fr: s > 0 ? "déambulatoire nord" : "déambulatoire sud", name_en: s > 0 ? "North choir aisle" : "South choir aisle",
      phase: "massing-aisle",
      category: "massing-aisle",
      role: "Choir side aisle continuing the 5.9 m aisle east toward the double ambulatory (measured width; height a rule_derived gap).",
      geometry: { type: "box", w: r2(CHOIR_LEN), h: AISLE_H, d: AISLE_W },
      position: [cx, r2(AISLE_H / 2), r2(s * AISLE_OFFSET_Z)],
      provenance: "measured",
      source: SRC.aisle,
      material: "lead",
      note: "Aisle width 5.9 m MEASURED. Height a rule_derived GAP. Radiating chapels / double ambulatory detail is a later fidelity tier.",
    });
  }
}

// --- apse / chevet (semicircular hemicycle, lathe) ---------------------------
function deriveApse({ comp }) {
  // half-lathe hemicycle: outer radius = chevet outer Ø/2 (measured); the curved
  // FORM (radii distribution) is rule_derived (the concentric chevet radii are a
  // blog-DQ GAP, never rendered as measured). seg!=8 so it never reads as the
  // octagonal spire shell in V09.
  const R = APSE_RADIUS;
  const h = VAULT_H;
  // lathe profile: [radius, localY] — a drum to the vault crown, then a conical cap.
  comp({
    id: "hemicycle",
    name_fr: "chevet (hémicycle)", name_en: "Apse / chevet hemicycle",
    phase: "massing-apse",
    category: "massing-apse",
    role: "The semicircular chevet closing the east end — outer radius from the measured ~47.88 m chevet diameter. The hemicycle FORM is rule_derived massing (the published Bork/Tallon concentric radii trace to a rights-excluded blog → GAP, never rendered as measured).",
    // HEMICYCLE: a half revolution (arc = π) facing EAST (+X) so it reads as a
    // chevet closing the choir, not a full dome. arcStart = -π/2 sweeps -Z→+X→+Z,
    // leaving the flat side toward the choir (west). The conical cap tops out near
    // the under-roof level (rule_derived form), not in a tall spike.
    geometry: {
      type: "lathe", seg: 24, arcStart: -Math.PI / 2, arc: Math.PI,
      pts: [[R, 0], [R, h * 0.74], [r2(R * 0.66), h], [r2(R * 0.18), r2(h + 6)]],
    },
    position: [APSE_CENTER_X, 0, 0],
    provenance: "rule_derived",
    source: RULE_SRC,
    url: M.chevet_outer_diameter.url,
    material: "lead",
    note: "Outer radius from the chevet outer diameter ~47.88 m (MEASURED, = the 48 m width); the hemicycle FORM is rule_derived (ad-quadratum half-revolve). The Bork/Tallon concentric chevet radii (CHARTRES-BLOG, rights_excluded) are a GAP and are NOT rendered. The radiating chapels / double ambulatory are a later fidelity tier.",
  });
}

// --- west front block (façade slab) + two towers (to 69 m) -------------------
function deriveWestFront({ comp }) {
  const cx = r2(WEST_OUTER_X + FACADE_DEPTH / 2); // facade slab centre (depth along X)
  // façade screen: 43.5 m wide (Z), 45 m tall (Y) — both measured; depth rule_derived
  comp({
    id: "facade",
    name_fr: "façade occidentale (écran)", name_en: "West façade screen",
    phase: "massing-westfront",
    category: "massing-westfront",
    role: "The west façade screen — 43.5 m wide and 45 m tall (both measured, excluding the towers). Its wall depth is rule_derived (not published). The Gallery of Kings / rose / 3 portals are a later fidelity tier.",
    geometry: { type: "box", w: FACADE_DEPTH, h: FACADE_H, d: FACADE_W },
    position: [cx, r2(FACADE_H / 2), 0],
    provenance: "measured",
    source: SRC.facade,
    material: "lead",
    note: "Façade width 43.5 m + height 45 m MEASURED (FRIENDS layout; techno-science.net). Wall depth is rule_derived (GAP). X position is rule_derived (façade at the -X end of the 128 m).",
  });
  // two towers to 69 m, mirrored on ±Z; footprint/spacing rule_derived
  for (const s of [1, -1]) {
    comp({
      id: s > 0 ? "tower-N" : "tower-S",
      name_fr: s > 0 ? "tour nord" : "tour sud", name_en: s > 0 ? "North tower" : "South tower",
      phase: "massing-tower",
      category: "massing-tower",
      role: "West tower rising to 69 m (measured height). Its footprint and spacing along Z are rule_derived (not published). Tower pinnacles / belfry openings are a later fidelity tier.",
      geometry: { type: "box", w: FACADE_DEPTH + 2, h: TOWER_H, d: TOWER_FOOT },
      position: [r2(WEST_OUTER_X + (FACADE_DEPTH + 2) / 2), r2(TOWER_H / 2), r2(s * TOWER_OFFSET_Z)],
      provenance: "measured",
      source: SRC.tower,
      material: "lead",
      note: "Tower height 69 m MEASURED (de.Wikipedia + FRIENDS). Tower footprint ~11.5 m and ±Z spacing are rule_derived (GAP _GAP_wall_depths). '297 steps' was REFUTED → not used.",
    });
  }
}

// --- roofline (steep nave+choir ridge prism, ~43 m) --------------------------
function deriveRoof({ comp }) {
  // a single steep prism ridge over the nave+choir, between the west front and the
  // apse springing. Ridge near the 43 m under-roof level (measured); the ridge FORM
  // (steep two-slope prism) is rule_derived (the lost 13th-c. forêt frame is a later
  // conjecture tier). Rendered as an extruded triangular section (two roof poly slopes).
  const xW = r2(NAVE_X0), xE = r2(CHOIR_X1); // ridge run (facade inner → apse springing)
  const eave = ROOF_H - 5;       // eave level just above the 33 m crown / under the 43 m ridge
  const ridge = ROOF_H + 4;      // ridge crest a touch above the 43 m under-roof level
  const halfW = VESSEL_W / 2 + 0.5;
  for (const s of [1, -1]) {
    // each roof slope: a quad from the ridge line down to the eave on one side
    comp({
      id: s > 0 ? "ridge-N" : "ridge-S",
      name_fr: s > 0 ? "versant nord de la toiture" : "versant sud de la toiture", name_en: s > 0 ? "North roof slope" : "South roof slope",
      phase: "massing-roof",
      category: "massing-roof",
      role: "Steep roof slope over the nave + choir, ridge near the 43 m under-roof level (measured). The steep two-slope ridge form is rule_derived massing; the lost oak 'forêt' frame is a later conjecture tier.",
      geometry: { type: "poly", pts: [
        [xW, r2(eave), r2(s * halfW)],
        [xE, r2(eave), r2(s * halfW)],
        [xE, r2(ridge), 0],
        [xW, r2(ridge), 0],
      ] },
      position: [0, 0, 0],
      provenance: "rule_derived",
      source: RULE_SRC,
      url: M.height_under_roof.url,
      material: "lead",
      note: "Ridge crest near the 43 m under-roof level (MEASURED, FRIENDS layout); the steep two-slope ridge FORM is rule_derived (the lost 13th-c. oak 'forêt' frame is a later conjecture tier). Rendered as two roof slopes.",
    });
  }
}

// ===========================================================================
// THE SPIRE FRAGMENT — composes in UNCHANGED at the crossing [0,0,0].
// ids/positions are BYTE-IDENTICAL to the standalone spire (no namespace,
// no offset) so V08–V14 stay green and V-COMPOSE sees an unchanged spire.
// fidelity:"full". This is the existing spire emission, verbatim, wrapped.
// ===========================================================================
function deriveSpire({ C, comp }) {
  const S = C.spire;
  const TOTAL = S.total_height.m; // 96 — MEASURED
  const BASE = S.base_level.m;    // 30 — MEASURED
  const VIS = TOTAL - BASE;       // 66 — visible extent (reconstructed_design)

  L(`## SPIRE (full fidelity) — six-part profile scaled off the PD plate; the absolute scale is the measured 96 m`);

  // --- six-part profile: per-section heights SCALED off the VLD PD plate ------
  const PROFILE = [
    { part: "tabouret", h: 2.0, rb: 4.8, rt: 4.6, prov: "conjecture",            src: "RESTAURONS-ND", fr: "tabouret", en: "Tabouret (timber stool on the crossing)" },
    { part: "souche",   h: 8.0, rb: 4.6, rt: 4.3, prov: "reconstructed_design", src: "VLD-FLECHE",    fr: "souche",   en: "Souche (base drum)" },
    { part: "fut",      h: 22.0, rb: 4.0, rt: 2.6, prov: "reconstructed_design", src: "VLD-FLECHE",    fr: "fût octogonal", en: "Octagonal shaft (fût) with quadrilobes" },
    { part: "gallery1", h: 7.0, rb: 2.85, rt: 2.55, prov: "reconstructed_design", src: "VLD-FLECHE",  fr: "première galerie ajourée", en: "First openwork gallery (statuary level)" },
    { part: "gallery2", h: 10.0, rb: 2.7, rt: 1.5, prov: "reconstructed_design", src: "VLD-FLECHE",   fr: "seconde galerie (8 lucarnes)", en: "Second level — 8 gabled bays" },
    { part: "aiguille", h: 16.0, rb: 1.6, rt: 0.08, prov: "reconstructed_design", src: "VLD-FLECHE",  fr: "aiguille", en: "Needle (aiguille)" },
  ];
  const sumFrac = PROFILE.reduce((a, p) => a + p.h, 0); // 65 m, + 1 m coq = 66

  let y = BASE;
  const levels = {}; // part -> {yb, yt, rb, rt}
  for (const p of PROFILE) {
    const yb = y, yt = y + p.h;
    levels[p.part] = { yb, yt, rb: p.rb, rt: p.rt };
    y = yt;
  }
  L(`- Section run sums to ${sumFrac} m + 1 m coq = ${VIS} m = the measured visible extent ✓; base ${BASE} → summit ${TOTAL} m.`);

  function octSection(p) {
    const lv = levels[p.part];
    const heightScaleNote =
      p.part === "tabouret"
        ? "single medium-confidence footprint source → conjecture (cross-check only)"
        : "octagonal form + proportion from the VLD PD 'Flèche' plate; absolute height scaled off the plate × the measured 66 m extent";
    comp({
      id: `spire-${p.part}`,
      name_fr: p.fr, name_en: p.en,
      phase: p.part === "tabouret" ? "base" : p.part === "souche" ? "souche" : p.part === "aiguille" ? "aiguille" : p.part,
      category: "shell",
      part: p.part,
      role:
        p.part === "tabouret"
          ? "The timber stool transferring the spire's load onto the four crossing piers."
          : p.part === "aiguille"
            ? "The tapering needle rising to the rooster — the silhouette's final stroke."
            : `Octagonal ${p.part} of the flèche, lead over an oak armature.`,
      geometry: { type: "lathe", seg: 8, pts: [[lv.rb, 0], [lv.rb, 0.06], [lv.rt, p.h - 0.06], [lv.rt, p.h]] },
      position: [0, lv.yb, 0],
      provenance: p.prov,
      source: p.src,
      material: p.part === "tabouret" ? "oak" : "lead",
      note: heightScaleNote,
      width_m: r2(lv.rt * 2 * Math.cos(Math.PI / 8)),
    });
  }
  for (const p of PROFILE) octSection(p);

  // --- octagon ring beams at section boundaries (rule_derived: ad quadratum) ---
  const boundaries = [
    ["souche", "yb"], ["fut", "yb"], ["gallery1", "yb"], ["gallery2", "yb"], ["aiguille", "yb"],
  ];
  for (const [part] of boundaries) {
    const lv = levels[part];
    comp({
      id: `ring-${part}`,
      name_fr: `couronne octogonale (${part})`, name_en: `Octagonal ring beam (${part} base)`,
      phase: "armature",
      category: "ring",
      role: "Horizontal ring beam tying the eight oak arêtes into the octagon at this level.",
      geometry: { type: "lathe", seg: 8, pts: [[lv.rb + 0.05, 0], [lv.rb + 0.12, 0.18], [lv.rb + 0.05, 0.36]] },
      position: [0, lv.yb - 0.18, 0],
      provenance: "rule_derived",
      source: "AD-QUADRATUM",
      material: "oak",
      note: "Octagon radius from the ad quadratum rule; exact springing dimension is a GAP (rule_derived, not surveyed).",
    });
  }

  // --- 8 quadrilobes on the fût faces (reconstructed_design; measured count) ----
  {
    const lv = levels.fut;
    const yMid = (lv.yb + lv.yt) / 2;
    const rMid = (lv.rb + lv.rt) / 2;
    for (let k = 0; k < 8; k++) {
      const phi = k * 45 + 22.5;
      const rho = rMid * Math.cos(Math.PI / 8) + 0.05;
      comp({
        id: `quadrilobe-${k}`,
        name_fr: "quadrilobe", name_en: "Quatrefoil (quadrilobe)",
        phase: "ornament",
        category: "ornament",
        role: "Pierced four-lobed motif on a fût face — one of the eight.",
        geometry: { type: "torus", r: 0.42, rt: 0.07 },
        position: [r2(rho * Math.cos(rad(phi))), r2(yMid), r2(rho * Math.sin(rad(phi)))],
        rotation_deg: [90, -phi, 0],
        provenance: "reconstructed_design",
        source: "VLD-FLECHE",
        material: "lead",
      });
    }
  }

  // --- 8 gabled bays (lucarnes) on gallery2 (reconstructed_design) -------------
  {
    const lv = levels.gallery2;
    const rTop = lv.rt, rBot = lv.rb;
    for (let k = 0; k < 8; k++) {
      const phi = k * 45;
      const rho = ((rBot + rTop) / 2) * Math.cos(Math.PI / 8) + 0.02;
      const cx = Math.cos(rad(phi)), cz = Math.sin(rad(phi));
      const yb = lv.yb + 1.2, gw = 0.9, gh = 2.2;
      const tangent = [-cz, cx];
      const p1 = [r2((rho) * cx + tangent[0] * gw), r2(yb), r2((rho) * cz + tangent[1] * gw)];
      const p2 = [r2((rho) * cx - tangent[0] * gw), r2(yb), r2((rho) * cz - tangent[1] * gw)];
      const apex = [r2((rho + 0.1) * cx), r2(yb + gh), r2((rho + 0.1) * cz)];
      comp({
        id: `lucarne-${k}`,
        name_fr: "lucarne à gâble", name_en: "Gabled bay (lucarne)",
        phase: "gallery2",
        category: "ornament",
        role: "Gabled dormer-bay on the second gallery, one per octagon face.",
        geometry: { type: "poly", pts: [p1, p2, apex] },
        position: [0, 0, 0],
        provenance: "reconstructed_design",
        source: "VLD-FLECHE",
        material: "lead",
      });
    }
  }

  // --- 16 pinnacles via the Roriczer rule (rule_derived) + conjectural spirelets
  {
    for (const [galPart, count] of [["gallery1", 8], ["gallery2", 8]]) {
      const lv = levels[galPart];
      const rho = ((lv.rb + lv.rt) / 2) + 0.25;
      for (let k = 0; k < count; k++) {
        const phi = k * 45 + (galPart === "gallery2" ? 22.5 : 0);
        const cx = Math.cos(rad(phi)), cz = Math.sin(rad(phi));
        const baseSide = 0.34;
        const shaftH = baseSide * 6;
        const yb = lv.yb + 0.3;
        comp({
          id: `pinnacle-${galPart}-${k}`,
          name_fr: "pinacle", name_en: "Pinnacle (Roriczer rule)",
          phase: "ornament",
          category: "pinnacle",
          role: "Pinnacle set out by the 1486 Roriczer rule — base square, inscribed squares at 45°.",
          geometry: { type: "box", w: baseSide, h: shaftH, d: baseSide },
          position: [r2(rho * cx), r2(yb + shaftH / 2), r2(rho * cz)],
          rotation_deg: [0, -phi, 0],
          provenance: "rule_derived",
          source: "RORICZER1486",
          material: "lead",
          note: "Shaft height = base × 6 (Roriczer vertical multiple) — CITED-UNCERTAIN, re-verify against the verbatim 1847 text.",
        });
        comp({
          id: `pinnacle-${galPart}-${k}-spirelet`,
          name_fr: "amortissement du pinacle", name_en: "Pinnacle spirelet (Auszug)",
          phase: "ornament",
          category: "pinnacle",
          role: "Tapering cap of the pinnacle — its vertical multiple (~7×) is cited-uncertain.",
          geometry: { type: "cone", r: baseSide * 0.62, rTop: 0.01, h: baseSide * 2.4 },
          position: [r2(rho * cx), r2(yb + shaftH + baseSide * 1.2), r2(rho * cz)],
          provenance: "conjecture",
          source: "RORICZER1486",
          material: "lead",
          note: "Auszug height from the ~7× Roriczer multiple — cited-uncertain, so flagged conjecture (uncertainty propagates).",
        });
      }
    }
  }

  // --- 16 statues: 12 apostles (4 groups of 3) + 4 evangelist symbols ----------
  const AP_H = S.statues.apostle_h_m, EV_H = S.statues.evangelist_h_m;

  function statueUnit(id, fr, en, cx, cz, rho, yb, H, kind, az, facesInward) {
    const faceDeg = facesInward ? az + 180 : az;
    const role =
      kind === "evangelist"
        ? "Winged evangelist symbol leading an apostle group up the base of the spire."
        : facesInward
          ? "St Thomas, patron of architects — the only figure turned to face the spire, given Viollet-le-Duc's own features."
          : "Copper apostle climbing the base of the flèche toward heaven.";
    const base = { phase: "statuary", category: "statue", statue_kind: kind, provenance: "measured", source: "PERSEE-2009", faces_inward: facesInward, material: "copper" };
    const rBody = r2(0.12 * H), hBody = r2(0.62 * H), rHead = r2(0.1 * H);
    comp({
      ...base,
      id,
      name_fr: fr, name_en: en,
      role,
      geometry: { type: "capsule", r: rBody, h: hBody },
      position: [r2(rho * cx), r2(yb + 0.43 * H), r2(rho * cz)],
      rotation_deg: [0, -faceDeg, 0],
      statue_height_m: H,
      note: "Count, heights and arrangement are measured (PERSEE-2009 + corroboration); the figurative massing is stylized, not a sculpture reconstruction. Weights cited-uncertain (see canonical).",
    });
    comp({
      ...base,
      id: `${id}-head`,
      name_fr: `${fr} · tête`, name_en: `${en} — head`,
      role,
      geometry: { type: "sphere", r: rHead },
      position: [r2(rho * cx), r2(yb + 0.9 * H), r2(rho * cz)],
    });
  }

  {
    const lv = levels.fut;
    const rhoStand = lv.rb * Math.cos(Math.PI / 8) + 1.35;
    const baseY = lv.yb + 1.0;
    const groupAz = [45, 135, 225, 315];
    let apostleIdx = 0;
    for (let g = 0; g < 4; g++) {
      const az = groupAz[g];
      {
        const phi = az - 13;
        const cx = Math.cos(rad(phi)), cz = Math.sin(rad(phi));
        const sym = ["ange (Matthieu)", "lion (Marc)", "bœuf (Luc)", "aigle (Jean)"][g];
        statueUnit(`evangelist-${g}`, `symbole de l'évangéliste — ${sym}`, `Evangelist symbol — ${["angel/Matthew", "lion/Mark", "ox/Luke", "eagle/John"][g]}`,
          cx, cz, rhoStand + 0.5, baseY - 0.3, EV_H, "evangelist", az, false);
      }
      for (let a = 0; a < 3; a++) {
        apostleIdx++;
        const phi = az + (a - 1) * 12;
        const cx = Math.cos(rad(phi)), cz = Math.sin(rad(phi));
        const yb = baseY + a * 1.1;
        const isThomas = g === 0 && a === 2;
        statueUnit(
          isThomas ? "apostle-thomas" : `apostle-${apostleIdx}`,
          isThomas ? "saint Thomas (traits de Viollet-le-Duc)" : `apôtre ${apostleIdx}`,
          isThomas ? "St Thomas (bears Viollet-le-Duc's features)" : `Apostle ${apostleIdx}`,
          cx, cz, rhoStand + a * 0.18, yb, AP_H, "apostle", az, isThomas
        );
      }
    }
  }

  // --- aiguille tip cross + coq (rooster) --------------------------------------
  {
    const lv = levels.aiguille;
    comp({
      id: "summit-orb",
      name_fr: "boule sommitale", name_en: "Summit orb",
      phase: "summit",
      category: "summit",
      role: "Gilt orb at the foot of the rooster, capping the needle.",
      geometry: { type: "sphere", r: 0.28 },
      position: [0, r2(lv.yt + 0.3), 0],
      provenance: "reconstructed_design",
      source: "VLD-FLECHE",
      material: "gilt",
    });
    comp({
      id: "coq",
      name_fr: "coq (au sommet, 96 m)", name_en: "Rooster (coq) — the summit at 96 m",
      phase: "summit",
      category: "coq",
      role: "The gilded copper rooster at the very summit — a reliquary holding three relics. Position from the measured 96 m total height; its published weight (~30 vs ~10 kg) is cited-uncertain.",
      geometry: { type: "cone", r: 0.34, rTop: 0.02, h: 1.0, scale: [1, 1, 0.55] },
      position: [0, r2(TOTAL - 0.5), 0],
      rotation_deg: [0, 0, -18],
      provenance: "conjecture",
      source: "WIKIPEDIA-SPIRE",
      material: "gilt",
      note: "Single topmost component, at the measured 96 m. Weight cited-uncertain (V13 → conjecture).",
    });
  }
}

// ===========================================================================
// THE FRAGMENT REGISTRY — composed in CONSTRUCTION ORDER (massing shells first,
// spire last → the Build Theater plays base-up). Offsets are [0,0,0] because
// each fragment already authors in the world frame (crossing at origin); the
// composer's namespace + fidelity stamping is what generalises the spire seam.
// ===========================================================================
const FRAGMENTS = [
  { key: "west-front", fidelity: "massing", offset: [0, 0, 0], fn: deriveWestFront },
  { key: "nave",       fidelity: "massing", offset: [0, 0, 0], fn: deriveNave },
  { key: "crossing",   fidelity: "massing", offset: [0, 0, 0], fn: deriveCrossing },
  { key: "transept",   fidelity: "massing", offset: [0, 0, 0], fn: deriveTransept },
  { key: "choir",      fidelity: "massing", offset: [0, 0, 0], fn: deriveChoir },
  { key: "apse",       fidelity: "massing", offset: [0, 0, 0], fn: deriveApse },
  { key: "roof",       fidelity: "massing", offset: [0, 0, 0], fn: deriveRoof },
  { key: "spire",      fidelity: "full",    offset: [0, 0, 0], fn: deriveSpire },
];

// ===========================================================================
// RUN THE COMPOSER
// ===========================================================================
L(`# Derivation Log — Cathédrale Notre-Dame de Paris (WHOLE CATHEDRAL — PASS 1 massing + spire)`);
L(``);
L(`Rule Engine COMPOSER run. Inputs: \`data/notre-dame-whole-canonical.json\` (verified corpus, 16 verdicts / 40 gaps) + the Gothic ruleset.`);
L(`Module = pied du roi = ${C.modular_system.pied_du_roi_mm.value} mm. Positions emitted in METRES. World frame: crossing at the origin, +X→chevet, −X→west front, ±Z→transept arms, +Y up.`);
L(`Precedence: measured / reconstructed_design → rule → flagged conjecture. The MEASURED headline dims set the scale and are never recomputed from a geometric ideal (V08/V-VLT critical).`);
L(``);
L(`## 0. Measured headline anchors (cathedral_geometry — all CONFIRMED)`);
L(`- total length **${TOTAL_LEN} m** · width at transept **${WIDTH_TX} m** (arm width ${ARM_W} m) · west façade **${FACADE_W} × ${FACADE_H} m** · towers **${TOWER_H} m**`);
L(`- nave vessel **${VESSEL_W} m** · side aisle **${AISLE_W} m** · **${NAVE_BAYS}** bays · vault crown **${VAULT_H} m** · under roof **${ROOF_H} m** · chevet Ø **${CHEVET_D} m** · spire **96 m / 30 m**`);
L(``);
L(`## 0b. Rule-derived longitudinal split (the corpus does NOT publish these — flagged, never measured)`);
L(`- West end at X=${WEST_OUTER_X} m, chevet outer at X=${r2(CHEVET_OUTER_X)} m → span ${r2(CHEVET_OUTER_X - WEST_OUTER_X)} m = the measured ${TOTAL_LEN} m ✓ (crossing position = origin is rule_derived).`);
L(`- Nave ${r2(NAVE_X0)}→${r2(NAVE_X1)} m (${r2(NAVE_LEN)} m, ${NAVE_BAYS} bays × ~${BAY_INTERVAL} m interval — count measured, interval rule_derived).`);
L(`- Crossing ${-CROSSING_HALF}→${CROSSING_HALF} m (14 m measured footprint). Choir ${CHOIR_X0}→${r2(CHOIR_X1)} m + apse hemicycle (R ${r2(APSE_RADIUS)} m measured) centred X=${r2(APSE_CENTER_X)} → ${r2(CHEVET_OUTER_X)} m.`);
L(`- Transept arms reach ±${r2(WIDTH_TX / 2)} m on Z (48 m arm-to-arm measured). Aisle height ${AISLE_H} m + roof ridge form = rule_derived (GAPs).`);
L(``);
L(`## 1. Composing fragments (construction order; massing shells first, spire last)`);
for (const frag of FRAGMENTS) {
  const before = components.length;
  runFragment(frag);
  const n = components.length - before;
  L(`- \`${frag.key}\` [${frag.fidelity}] → ${n} component${n === 1 ? "" : "s"}${frag.key === "spire" ? " (composed in UNCHANGED at the crossing — ids/positions byte-identical, V08–V14 anchor)" : ""}`);
}
L(``);

// ---------------------------------------------------------------------------
const counts = {};
const fidCounts = {};
const fragCounts = {};
for (const c of components) {
  counts[c.provenance] = (counts[c.provenance] || 0) + 1;
  fidCounts[c.fidelity] = (fidCounts[c.fidelity] || 0) + 1;
  fragCounts[c.fragment] = (fragCounts[c.fragment] || 0) + 1;
}

// spire group integrity (regression anchor for V-COMPOSE / V08–V14)
const spireComps = components.filter((c) => c.fragment === "spire");
const statueCount = spireComps.filter((c) => c.category === "statue" && !c.id.endsWith("-head")).length;
const coq = spireComps.find((c) => c.category === "coq");

const spec = {
  meta: {
    building: C.meta.name_fr,
    building_en: C.meta.name_en,
    building_key: "notre-dame-whole",
    designer: C.meta.designer,
    date_built: C.meta.date.value,
    generated_by: "scripts/derive-notre-dame-whole.mjs (Yingzao Rule Engine — whole-cathedral composer; PASS 1 massing + spire)",
    canonical_source: "data/notre-dame-whole-canonical.json",
    composition: "ONE spec composed from per-fragment scopes; massing fragments offset/namespaced to world, the spire composed in UNCHANGED at the crossing [0,0,0].",
  },
  units: { scene_scale: C.$schema_notes.units.scene_scale_m_per_unit || 1, unit: "metre", pied_du_roi_mm: C.modular_system.pied_du_roi_mm.value, note: "All positions/dimensions in metres. World frame: crossing at origin, +X→chevet, −X→west front, ±Z→transept arms." },
  provenance_colors: C.$schema_notes.provenance_colors,
  phases: [
    "massing-westfront", "massing-tower", "massing-nave", "massing-aisle", "massing-crossing",
    "massing-transept", "massing-choir", "massing-apse", "massing-roof",
    "base", "souche", "fut", "armature", "gallery1", "gallery2", "ornament", "aiguille", "statuary", "summit",
  ],
  fragments: FRAGMENTS.map((f) => ({ key: f.key, fidelity: f.fidelity, components: fragCounts[f.key] || 0 })),
  key_dimensions: {
    // measured headline dims (the verifier recomputes these from coords, never trusts them here)
    total_length_m: TOTAL_LEN,
    total_width_transept_m: WIDTH_TX,
    transept_arm_width_m: ARM_W,
    west_facade_m: [FACADE_W, FACADE_H],
    west_tower_height_m: TOWER_H,
    nave_vessel_width_m: VESSEL_W,
    side_aisle_width_m: AISLE_W,
    nave_bays: NAVE_BAYS,
    vault_crown_height_m: VAULT_H,
    height_under_roof_m: ROOF_H,
    chevet_outer_diameter_m: CHEVET_D,
    // rule_derived placement (flagged)
    rule_derived_split: {
      west_outer_x_m: WEST_OUTER_X, chevet_outer_x_m: r2(CHEVET_OUTER_X),
      nave_x_m: [r2(NAVE_X0), r2(NAVE_X1)], nave_length_m: r2(NAVE_LEN), bay_interval_m: BAY_INTERVAL,
      choir_x_m: [CHOIR_X0, r2(CHOIR_X1)], apse_center_x_m: r2(APSE_CENTER_X), apse_radius_m: r2(APSE_RADIUS),
      crossing_half_x_m: CROSSING_HALF, transept_arm_tip_z_m: r2(WIDTH_TX / 2),
      note: "Crossing position along the 128 m, nave-vs-choir split, bay interval, wall depths, tower footprints and aisle/roof heights are rule_derived (corpus does not publish them) — never measured.",
    },
    // spire anchors (full fidelity, unchanged)
    spire_total_height_m: C.spire.total_height.m,
    spire_base_level_m: C.spire.base_level.m,
    octagon_faces: 8,
    statue_count: statueCount,
  },
  components,
};

L(`## 2. Provenance audit`);
L(`- Components: ${components.length} total — ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Fidelity: ${Object.entries(fidCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Fragments: ${Object.entries(fragCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Audit gate: every component (massing + spire) carries {provenance, source, url, rights}; source resolves to the rights-cleared registry (use/use-data); a restricted or unregistered source throws (0 unsourced by construction).`);
L(`- Spire group present at the crossing: ${spireComps.length} components, ${statueCount} statues, coq at ${coq ? r2(spec.components.find((c) => c.id === "coq").position[1] + 0.5) : "—"} m (summit, measured 96 m).`);
L(``);
L(`## 3. Measured-reality deviations (kept, never corrected — V08 / V-VLT)`);
for (const d of C.ideal_deviations_index.items) L(`- ${d}`);
L(`- Vault crown is the MEASURED 33 m — never recomputed toward 35 m (refuted) or 43 m (under-roof) (V-VLT, generalised V08).`);
L(`- Every internal split the corpus does not publish (crossing position, nave/choir division, bay interval) is rule_derived and flagged — uncertainty propagated to placement, never invented.`);
L(``);
L(`*The measured cathedral outranks the rulebook; partial fidelity (massing + the flawless spire) is honest, shown by the provenance toggle.*`);

mkdirSync(join(ROOT, "artifacts"), { recursive: true });
writeFileSync(join(ROOT, "artifacts/structural-spec.notre-dame-whole.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(ROOT, "artifacts/derivation-log.notre-dame-whole.md"), log.join("\n") + "\n");
writeFileSync(
  join(ROOT, "artifacts/derivation-stream.notre-dame-whole.jsonl"),
  stream.map((e) => JSON.stringify(e)).join("\n") + "\n"
);
console.log(`derive (notre-dame-whole, whole cathedral): ${components.length} components → artifacts/structural-spec.notre-dame-whole.json`);
console.log(`provenance: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
console.log(`fidelity: ${Object.entries(fidCounts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
console.log(`fragments: ${Object.entries(fragCounts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
console.log(`spire group: ${spireComps.length} comps · ${statueCount} statues · coq at the crossing summit (measured 96 m)`);
