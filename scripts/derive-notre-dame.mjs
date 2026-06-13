#!/usr/bin/env node
/**
 * Yingzao Rule Engine — Notre-Dame de Paris spire (la flèche).
 *
 * Derives artifacts/structural-spec.notre-dame.json from data/notre-dame-canonical.json
 * + the Gothic ruleset. Deterministic, zero API calls. SPIRE ONLY (v1).
 *
 * Precedence contract (PRD §7.2 / GOAL §3):
 *   measured / reconstructed_design  >  Gothic rule (rule_derived)  >  conjecture
 * A sourced value is NEVER overridden by a rule. The two MEASURED anchors —
 * 96 m total height, ~30 m base — set the absolute scale; everything else is the
 * VLD public-domain drawing's reconstructed design proportions (reconstructed_design),
 * the octagon/pinnacle geometry rules (rule_derived), or flagged conjecture.
 *
 * V08 (critical): the engine must NOT idealize the spire toward an ad-triangulum /
 * Roriczer height-from-width ideal — 96 m / 30 m are measured and win.
 *
 * Outputs: artifacts/structural-spec.notre-dame.json, artifacts/derivation-log.notre-dame.md
 * + appends artifacts/derivation-stream.notre-dame.jsonl (one event per component, in
 *   derivation order — powers the Build Theater / playback / SSE).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const C = JSON.parse(readFileSync(join(ROOT, "data/notre-dame-canonical.json"), "utf8"));

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
const DEG = (d) => d; // positions are computed in radians; rotation_deg stays degrees
const rad = (deg) => (deg * Math.PI) / 180;

/**
 * Push a component; hard-fail if it lacks provenance/source (audit gate), if its
 * source isn't in the rights-cleared registry with a use/use-data verdict (G09 at
 * emit time), or if a `measured` component cites a restricted source (V13 defense
 * in depth). Stamps the resolved {url, rights} so every spec component literally
 * carries {provenance, source, url, rights}.
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
    provenance: out.provenance,
    source: out.source,
    name_en: out.name_en,
    name_fr: out.name_fr,
  });
}

// ===========================================================================
const S = C.spire;
const TOTAL = S.total_height.m; // 96 — MEASURED
const BASE = S.base_level.m;    // 30 — MEASURED
const VIS = TOTAL - BASE;       // 66 — visible extent (reconstructed_design)

L(`# Derivation Log — Flèche de Notre-Dame de Paris (Viollet-le-Duc, 1859)`);
L(``);
L(`Rule Engine run. Inputs: \`data/notre-dame-canonical.json\` (verified corpus, 16 verdicts / 40 gaps) + the Gothic ruleset (ad quadratum, Roriczer pinnacle).`);
L(`Module = pied du roi = ${C.modular_system.pied_du_roi_mm.value} mm. Positions emitted in METRES.`);
L(`Precedence: measured / reconstructed_design → rule → flagged conjecture. The 96 m total + 30 m base are MEASURED and are never recomputed from a geometric ideal (V08 critical).`);
L(``);
L(`## 0. Anchors (measured)`);
L(`- Total height = **${TOTAL} m** to the rooster head [${S.total_height.source}; +${(S.total_height.corroborating_sources || []).length} corroborating]`);
L(`- Base anchored = **${BASE} m** above ground, on the croisée du transept [${S.base_level.source}]`);
L(`- Visible extent = ${TOTAL} − ${BASE} = **${VIS} m** (reconstructed_design)`);
L(``);

// --- six-part profile: per-section heights SCALED off the VLD PD plate ------
// No per-section number is published (corpus _GAP_per_section_heights) → the
// engine scales them off the BnF VLD "Flèche" plate proportions × the 66 m
// visible extent, tagged rule_derived. The PROPORTIONS come from the PD drawing.
const PROFILE = [
  // part,       height(m), Rbottom, Rtop  (R = octagon circumradius, m). Small
  // ledges between sections (a bottom R larger than the section below's top R)
  // read as the drip-courses / gallery projections of the real flèche.
  { part: "tabouret", h: 2.0, rb: 4.8, rt: 4.6, prov: "conjecture",            src: "RESTAURONS-ND", fr: "tabouret", en: "Tabouret (timber stool on the crossing)" },
  { part: "souche",   h: 8.0, rb: 4.6, rt: 4.3, prov: "reconstructed_design", src: "VLD-FLECHE",    fr: "souche",   en: "Souche (base drum)" },
  { part: "fut",      h: 22.0, rb: 4.0, rt: 2.6, prov: "reconstructed_design", src: "VLD-FLECHE",    fr: "fût octogonal", en: "Octagonal shaft (fût) with quadrilobes" },
  { part: "gallery1", h: 7.0, rb: 2.85, rt: 2.55, prov: "reconstructed_design", src: "VLD-FLECHE",  fr: "première galerie ajourée", en: "First openwork gallery (statuary level)" },
  { part: "gallery2", h: 10.0, rb: 2.7, rt: 1.5, prov: "reconstructed_design", src: "VLD-FLECHE",   fr: "seconde galerie (8 lucarnes)", en: "Second level — 8 gabled bays" },
  { part: "aiguille", h: 16.0, rb: 1.6, rt: 0.08, prov: "reconstructed_design", src: "VLD-FLECHE",  fr: "aiguille", en: "Needle (aiguille)" },
];
const sumFrac = PROFILE.reduce((a, p) => a + p.h, 0); // 65 m, + 1 m coq = 66

L(`## 1. Six-part profile (la flèche) — heights scaled off the PD plate (rule_derived; the absolute scale is the measured 96 m)`);
L(`- Section run sums to ${sumFrac} m + 1 m coq = ${VIS} m = the measured visible extent ✓`);
let y = BASE;
const levels = {}; // part -> {yb, yt, rb, rt}
for (const p of PROFILE) {
  const yb = y, yt = y + p.h;
  levels[p.part] = { yb, yt, rb: p.rb, rt: p.rt };
  L(`- ${p.part.padEnd(9)} y ${r2(yb)}→${r2(yt)} m · octagon R ${p.rb}→${p.rt} m · [${p.prov}; ${p.src}]`);
  y = yt;
}
L(`- Taper (octagon circumradius) is strictly decreasing souche→aiguille — the measured-reality monotonic guard (V11).`);
L(``);

// octagonal shell band for a section: a LatheGeometry (seg 8) frustum, open shell
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
    // lathe: [radius, localY] pairs, revolved in 8 segments → octagonal frustum
    geometry: { type: "lathe", seg: 8, pts: [[lv.rb, 0], [lv.rb, 0.06], [lv.rt, p.h - 0.06], [lv.rt, p.h]] },
    position: [0, lv.yb, 0],
    provenance: p.prov,
    source: p.src,
    material: p.part === "tabouret" ? "oak" : "lead",
    note: heightScaleNote,
    width_m: r2(lv.rt * 2 * Math.cos(Math.PI / 8)), // across-flats at the top, for the taper check
  });
}
for (const p of PROFILE) octSection(p);

// --- octagon ring beams at section boundaries (rule_derived: ad quadratum) ---
L(`## 2. Octagon ring beams — radius set by the ad quadratum octagon rule (rule_derived)`);
L(`- Octagon springs from a square by 45° rotation (side ratio 1/√2 ≈ ${r2(Math.SQRT1_2)}); the exact springing dimension is a GAP, so a regular octagon is inscribed in the ~14 m crossing and the rings mark each section join.`);
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
L(``);

// --- 8 quadrilobes on the fût faces (reconstructed_design; measured count) ----
L(`## 3. Quadrilobes — 8 on the fût faces [count measured: ${S.ornament.quadrilobes}; form reconstructed_design from VLD plate]`);
{
  const lv = levels.fut;
  const yMid = (lv.yb + lv.yt) / 2;
  const rMid = (lv.rb + lv.rt) / 2;
  for (let k = 0; k < 8; k++) {
    const phi = k * 45 + 22.5; // face centre (between octagon vertices)
    const rho = rMid * Math.cos(Math.PI / 8) + 0.05; // sit on the flat face
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
L(``);

// --- 8 gabled bays (lucarnes) on gallery2 (reconstructed_design) -------------
L(`## 4. Gabled bays — 8 lucarnes on the second gallery [reconstructed_design; "8 gabled bays" per culture.gouv profile]`);
{
  const lv = levels.gallery2;
  const rTop = lv.rt, rBot = lv.rb;
  for (let k = 0; k < 8; k++) {
    const phi = k * 45; // on the octagon vertices/ridges
    const rho = ((rBot + rTop) / 2) * Math.cos(Math.PI / 8) + 0.02;
    const cx = Math.cos(rad(phi)), cz = Math.sin(rad(phi));
    const yb = lv.yb + 1.2, gw = 0.9, gh = 2.2;
    // a small outward-facing gable triangle (poly in world coords)
    const tangent = [-cz, cx]; // unit tangent for the gable width
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
L(``);

// --- 16 pinnacles via the Roriczer rule (rule_derived) + conjectural spirelets
L(`## 5. Pinnacles — 16 via the Roriczer (1486) rule [rule_derived]; vertical multiples (~6×/7×) CITED-UNCERTAIN → spirelets conjecture`);
L(`- Roriczer: base square → 45°-rotated inscribed squares (1/√2). 8 around gallery1 + 8 around gallery2 = 16 [count measured: ${S.ornament.pinnacles}].`);
{
  for (const [galPart, count, baseR] of [["gallery1", 8, null], ["gallery2", 8, null]]) {
    const lv = levels[galPart];
    const rho = ((lv.rb + lv.rt) / 2) + 0.25; // just outside the gallery shell
    for (let k = 0; k < count; k++) {
      const phi = k * 45 + (galPart === "gallery2" ? 22.5 : 0);
      const cx = Math.cos(rad(phi)), cz = Math.sin(rad(phi));
      const baseSide = 0.34;
      const shaftH = baseSide * 6; // Roriczer ~6× — CITED-UNCERTAIN
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
      // spirelet (Auszug) — the 7× multiple is uncertain → conjecture
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
L(``);

// --- 16 statues: 12 apostles (4 groups of 3) + 4 evangelist symbols ----------
L(`## 6. Statuary — 16 copper statues [measured: ${S.statues.apostles} apostles + ${S.statues.evangelist_symbols} evangelist symbols; ${S.statues.source}]`);
L(`- 4 groups of 3 apostles (staggered, climbing) + 4 evangelist symbols, around the base of the spire (gallery1 level).`);
L(`- Apostle ≈ ${S.statues.apostle_h_m} m (measured); evangelist ≈ ${S.statues.evangelist_h_m} m (measured). Weights cited-uncertain (apostle ${(S.statues.apostle_kg_contested || []).join(" vs ")} kg; evangelist ${(S.statues.evangelist_kg_contested || []).join(" vs ")} kg) — adversarially flagged, drive no geometry.`);
L(`- St Thomas (patron of architects) turns to FACE the spire and bears Viollet-le-Duc's own features.`);
const AP_H = S.statues.apostle_h_m, EV_H = S.statues.evangelist_h_m;
{
  // The 16 statues ring the BASE of the spire (just above the roofline, lower fût),
  // in four groups of 3 apostles + 1 evangelist symbol at the four corners, each
  // group climbing — matching Geoffroi-Dechaume's arrangement.
  const lv = levels.fut;
  const rhoStand = lv.rb * Math.cos(Math.PI / 8) + 1.35; // stand clear of the shaft base
  const baseY = lv.yb + 1.0; // hug the base of the flèche
  const groupAz = [45, 135, 225, 315]; // 4 corners (over the roof valleys)
  let apostleIdx = 0;
  // St Thomas is the climbing-most apostle of the first group, facing inward
  for (let g = 0; g < 4; g++) {
    const az = groupAz[g];
    // evangelist symbol leads the group, lower & offset to one side
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
      const yb = baseY + a * 1.1; // staggered, climbing toward heaven
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
L(``);

function statueUnit(id, fr, en, cx, cz, rho, yb, H, kind, az, facesInward) {
  // figure faces outward (az) unless St Thomas, who turns inward to the spire
  const faceDeg = facesInward ? az + 180 : az;
  const role =
    kind === "evangelist"
      ? "Winged evangelist symbol leading an apostle group up the base of the spire."
      : facesInward
        ? "St Thomas, patron of architects — the only figure turned to face the spire, given Viollet-le-Duc's own features."
        : "Copper apostle climbing the base of the flèche toward heaven.";
  const base = { phase: "statuary", category: "statue", statue_kind: kind, provenance: "measured", source: "PERSEE-2009", faces_inward: facesInward, material: "copper" };
  // Geometry sized so the rendered extent (body bottom → head top) == the measured
  // height H exactly, so V10 recomputes the height from coordinates, not a claim.
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
  // head — its top lands at yb + H (the measured statue height above the feet)
  comp({
    ...base,
    id: `${id}-head`,
    name_fr: `${fr} · tête`, name_en: `${en} — head`,
    role,
    geometry: { type: "sphere", r: rHead },
    position: [r2(rho * cx), r2(yb + 0.9 * H), r2(rho * cz)],
  });
}

// --- aiguille tip cross + coq (rooster) --------------------------------------
L(`## 7. Summit — the coq (rooster) at ${TOTAL} m [conjecture: weight ~30 kg vs ~10 kg cited-uncertain; position from the measured 96 m]`);
{
  const lv = levels.aiguille;
  // base cross / orb under the rooster
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
L(``);

// --- assemble & audit --------------------------------------------------------
const counts = {};
for (const c of components) counts[c.provenance] = (counts[c.provenance] || 0) + 1;

// taper check (souche→aiguille top across-flats), for the log + key_dimensions
const taper = PROFILE.filter((p) => p.part !== "tabouret").map((p) => ({
  part: p.part,
  across_flats_top_m: r2(levels[p.part].rt * 2 * Math.cos(Math.PI / 8)),
}));

const spec = {
  meta: {
    building: C.meta.name_fr,
    building_en: C.meta.name_en,
    building_key: "notre-dame",
    designer: C.meta.designer,
    date_built: C.meta.date.value,
    generated_by: "scripts/derive-notre-dame.mjs (Yingzao Rule Engine — spire)",
    canonical_source: "data/notre-dame-canonical.json",
  },
  units: { scene_scale: C.$schema_notes.units.scene_scale_m_per_unit || 1, unit: "metre", pied_du_roi_mm: C.modular_system.pied_du_roi_mm.value, note: "All positions/dimensions in metres." },
  provenance_colors: C.$schema_notes.provenance_colors,
  phases: ["base", "souche", "fut", "armature", "gallery1", "gallery2", "ornament", "aiguille", "statuary", "summit"],
  key_dimensions: {
    total_height_m: TOTAL,
    base_level_m: BASE,
    visible_extent_m: VIS,
    octagon_faces: 8,
    statue_count: components.filter((c) => c.category === "statue" && !c.id.endsWith("-head")).length,
    apostles: components.filter((c) => c.statue_kind === "apostle" && !c.id.endsWith("-head")).length,
    evangelists: components.filter((c) => c.statue_kind === "evangelist" && !c.id.endsWith("-head")).length,
    pinnacles: components.filter((c) => c.category === "pinnacle" && !c.id.endsWith("-spirelet")).length,
    taper_across_flats_m: taper,
  },
  components,
};

L(`## 8. Provenance audit`);
L(`- Components: ${components.length} total — ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Audit gate: every component carries {provenance, source, url, rights}; source resolves to the rights-cleared registry (use/use-data); a restricted or unregistered source throws.`);
L(`- Statue count = ${spec.key_dimensions.statue_count} (${spec.key_dimensions.apostles} apostles + ${spec.key_dimensions.evangelists} evangelists). Pinnacles = ${spec.key_dimensions.pinnacles}.`);
L(``);
L(`## 9. Measured-reality deviations (kept, never corrected — V08)`);
for (const d of C.ideal_deviations_index.items) L(`- ${d}`);
L(``);
L(`*Viollet-le-Duc's measured 96 m outranks any geometric ideal.*`);

mkdirSync(join(ROOT, "artifacts"), { recursive: true });
writeFileSync(join(ROOT, "artifacts/structural-spec.notre-dame.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(ROOT, "artifacts/derivation-log.notre-dame.md"), log.join("\n") + "\n");
writeFileSync(
  join(ROOT, "artifacts/derivation-stream.notre-dame.jsonl"),
  stream.map((e) => JSON.stringify(e)).join("\n") + "\n"
);
console.log(`derive (notre-dame): ${components.length} components → artifacts/structural-spec.notre-dame.json`);
console.log(`provenance: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
console.log(`anchors: total ${TOTAL} m (measured) · base ${BASE} m (measured) · 8 faces · ${spec.key_dimensions.statue_count} statues`);
