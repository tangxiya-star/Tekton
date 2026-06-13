> ⚠️ **STRUCTURE-ONLY DOCUMENT — DO NOT TRUST ANY DATA HERE (ticket ND-12).** This document's data layer was originally **FABRICATED**: it conflated Notre-Dame de **Reims** with the build target and cited a **non-existent "Nohesive 2019" survey**. Even where prose now reads "Paris," **none of the dimensions, sources, citations, or example values in this file may be used** — treat every number here as untrustworthy. This file is retained **ONLY** for pipeline / code structure (how to adapt `derive.mjs` / `verify.mjs` / `Viewer.tsx`). The **single source of truth for ALL Notre-Dame dimensions and sources is `docs/NOTRE_DAME_VERIFIED_CORPUS.md`** (the adversarially-verified, cited ND-1 corpus). When in doubt, use the corpus; never copy a value from here.

# Notre-Dame Implementation Guide — Code Pattern Reuse from Nanchan

**Building:** Notre-Dame de **Paris** (begun c.1163; the spire — *la flèche* — is Viollet-le-Duc's 1859 design; the spire and the medieval roof were lost in the fire of 15 April 2019; the cathedral reopened 7–8 December 2024).
**Scope:** the **spire (la flèche)** is the PRIMARY target; one nave bay/cross-section is the STRETCH; the lost 13th-c. oak roof (*la forêt*) is the VISION shot.

This file is a **code-pattern / implementation guide** — how to adapt the Nanchan pipeline (`derive.mjs` / `verify.mjs` / `Viewer.tsx`) to Notre-Dame. **It is not a data source.** Every dimension, source, and verifier target lives in **`docs/NOTRE_DAME_VERIFIED_CORPUS.md`** — that file is the single source of truth. Where this guide shows a number, it is illustrative and traceable to the corpus; for the full cited tables, read the corpus.

## 1. Data Source Mapping

### Nanchan → Notre-Dame

| Dimension | Nanchan | Notre-Dame (Paris) |
|-----------|---------|-----------|
| **Primary measured-drawing asset** | ZHANG2022 (Tsinghua laser + field measurement) | Viollet-le-Duc *Dictionnaire raisonné*, art. "Flèche" — "Élévation et plans de la flèche" plate, **public domain** (author d.1879), via BnF (ark `mm320202712p`) |
| **Rule text** | Yingzao Fashi (1103) | Reconstructed Gothic ruleset — *ad quadratum* / *ad triangulum*, two-centred (pointed) arch, Roriczer 1486 pinnacle rule. No single Gothic "building code" exists; the ruleset is assembled from treatises + geometry (see corpus §3 `design_ruleset`) |
| **PD dimensional cross-check** | Liang Sicheng measured drawings | Bell's Handbook (Charles Hiatt, *Notre Dame de Paris*), Project Gutenberg #60213 — fully PD verbatim set |
| **Factual dimension sources** | Site photos, architectural surveys | Friends of Notre-Dame de Paris; Ministère de la Culture (culture.gouv); official notredamedeparis.fr (numbers are uncopyrightable facts — ingest numbers, cite text) |
| **Lost-fabric relevé (*la forêt*)** | QI1980 (1975 restoration report) | Fromont & Trentesaux relevé 2014–15 (via culture.gouv) + Vannucci et al. arXiv:2005.12584 (sections photo-deduced) |

> **Restricted — cite only, never ingest:** Andrew Tallon's ~1-billion-point laser scan, AGP's ~50-billion-point surveys, and the CNRS/De Luca digital twin all lack an open license. Their facts (point counts, etc.) are citable; the data is **not** an asset. See the corpus Rights Table.

---

## 2. Code Adaptation Checklist

### 2.1 `data/notre-dame-canonical.json` — author from the corpus, not from this file

**Maps to:** `data/nanchan-canonical.json`

**Do not template a data file here.** Author `data/notre-dame-canonical.json` by transcribing the **canonical data skeleton in `docs/NOTRE_DAME_VERIFIED_CORPUS.md` §3** — every node already carries `{provenance, source, url}` and only verified / cited-uncertain values appear there. Refuted values are dropped; unsourced fields are marked `GAP` and **must not be filled**.

The schema mirrors Nanchan exactly — same four provenance classes and the same colors (from `components/Viewer.tsx`):

```jsonc
{
  "provenance_classes": {
    "measured":             "Published survey or multiply-confirmed published dimension (factual).",
    "reconstructed_design": "19th-c. design intent off Viollet-le-Duc / Lassus PD drawings (the flèche is NOT medieval fabric).",
    "rule_derived":         "Derived by OUR engine from the Gothic ruleset (must cite the rule).",
    "conjecture":           "Contested / photo-deduced / lost fabric. Renders in conjecture color; never presented as measured."
  },
  "provenance_colors": {
    "measured": "#d9a843", "reconstructed_design": "#a3812f",
    "rule_derived": "#5e6ca8", "conjecture": "#b34a38"
  }
}
```

**Units.** The base module is the **pied du roi (royal foot) = 324.8 mm** — the French-Gothic analog of Nanchan's *fen*. The cai-fen analog is the **bay module**. `mm = pied × 324.8`.

**The verified anchors you will key the build off** (full citations + URLs in corpus §3; do not duplicate the corpus, transcribe it):

| Anchor | Value | Provenance | Where in corpus |
|---|---|---|---|
| Spire total height (to rooster) | **96 m** (≈295.6 pied du roi) | measured (multi-source) | `spire.total_height` |
| Spire base level (above crossing) | **~30 m** (one source gives 33 m) | measured | `spire.base_level` |
| Spire base footprint (irregular trapezoid) | **~15 × 13 m** | measured | `spire.base_footprint` |
| Cathedral total length | **128 m** | measured | `cathedral_geometry.total_length` |
| Max width across transept | **48 m**; transept arm width **14 m** | measured | `cathedral_geometry.transept` |
| West facade width / height (no towers) | **43.5 m** / **45 m** | measured | `cathedral_geometry.west_facade_width`, `facade_height_no_towers` |
| West tower height | **69 m** | measured | `cathedral_geometry.west_tower_height` |
| Nave vessel clear width | **~13 m**; side aisle **5.9 m** | measured | `cathedral_geometry.nave_vessel_width`, `side_aisle_width` |
| High-vault crown height | **33 m** (accept 32.5–33) | measured | `cathedral_geometry.vault_crown_height` |
| Height under nave roof | **43 m** | measured | `cathedral_geometry.height_under_roof` |
| Spire oak framework / lead | **500 t / 250 t** | measured | `spire.oak_framework`, `lead_cladding` |
| Spire statuary | **16 copper statues** (12 apostles ≈3.40 m + 4 evangelist symbols ≈2.0 m) | measured | `spire.statues` |

> **Do NOT regress two corrected facts:** (1) vault crown is **33 m** and height-under-roof is **43 m** — the old "~35 m" label is **REFUTED** (it was only a loose "general interior height"). (2) The north-tower "297 steps" figure is **REFUTED** and dropped.

**Fields that stay `GAP` (do not invent a number, do not cite to a laser survey):**

```jsonc
{
  "_GAP_nave_pier_diameter":  "No published nave pier Ø. The 1.948/1.377/0.974 m set is mis-attributed (a blog's ad-quadratum derivation, NOT Bork/Tallon measured).",
  "_GAP_chevet_radii":        "6.65/12.42/18.18/23.94 m + the '148 pied-du-roi' conversion trace to one self-published blog — cited-uncertain; verify Bork 2014/2022 before any use.",
  "_GAP_vault_rib_widths":    "Sexpartite topology is confirmed; metric rib widths (~0.48 / ~0.36–0.38 m) are paywalled/unverified.",
  "_GAP_per_section_spire_heights": "Souche / fût / each gallery / aiguille heights are NOT published — scale them off the PD VLD 'Flèche' plate (rule_derived) or leave conjecture.",
  "_GAP_aisle_vault_heights": "Inner/outer aisle + tribune vault crown heights not published numerically."
}
```

---

### 2.2 `scripts/derive.mjs` Adaptation

**Maps to:** Yingzao Rule Engine

**Key changes from Nanchan:**

```javascript
// BEFORE (Nanchan)
const FEN_PER_CHI = 300 / spec.units.fen_mm;  // fen-to-chi conversion
const pingzhuHeight = C.columns.pingzhu_height.mm;

// AFTER (Notre-Dame de Paris)
const PIED_DU_ROI_MM = C.modular_system.pied_du_roi_mm.value; // 324.8 — the metrological anchor (fen analog)
const spireTotalHeight = C.spire.total_height.m;              // 96 m   (measured, multi-source)
const spireBaseLevel   = C.spire.base_level.m;                // ~30 m  (measured)
const naveVesselWidth  = C.cathedral_geometry.nave_vessel_width.m; // 13 m (measured)
const vaultCrownHeight = C.cathedral_geometry.vault_crown_height.m_range[1]; // 33 m (NOT 35)
```

**Rule engine derivation logic (Gothic geometry — derive from the ruleset, anchor on measured facts):**

```javascript
L(`# Derivation Log — Notre-Dame de Paris (la flèche)`);
L(``);
L(`Rule Engine run. Inputs: notre-dame-canonical.json (verified corpus) + the Gothic ruleset.`);
L(`Precedence: measured / reconstructed_design → rule_derived → conjecture. A sourced value is NEVER overridden by a rule.`);
L(``);

L(`## 1. Spire taper — anchored on measured facts, profile scaled off the PD drawing`);
L(``);

const spireVisibleExtent = spireTotalHeight - spireBaseLevel; // 96 - 30 = 66 m (reconstructed_design)
L(`- Measured anchors (HARD): total height = ${spireTotalHeight} m; base level = ${spireBaseLevel} m`);
L(`- Visible extent (derived): ${spireTotalHeight} - ${spireBaseLevel} = ${spireVisibleExtent} m`);
L(`- Octagon built on the ~15×13 m crossing footprint; angles on roof ridges + 4 valleys`);
L(`- Per-section heights (souche / fût / galleries / aiguille) are a GAP → scaled off the PD VLD 'Flèche' plate`);
L(`  (BnF ark mm320202712p) and tagged rule_derived ("scaled from PD plate, ratio×96 m"). NEVER an invented number.`);
L(``);

L(`## 2. Pointed arches struck from springing points (two-centred arch rule)`);
L(``);

// Two-centred arch (Brick Development Association, verbatim): equilateral = radius=span,
// centres at the two springing points, rise = span × 0.866.
const arcadeSpan = C.modular_system.bay_module.single_span_m; // ~6 m arcade interval (rule_derived module)
const equilateralRise = arcadeSpan * 0.866;
L(`- Arch class = equilateral (default High-Gothic): radius = span, rise = span × 0.866`);
L(`- Arcade interval ≈ ${arcadeSpan} m → rise ≈ ${equilateralRise.toFixed(2)} m`);
L(`- Every arch curve is COMPUTED from springing points, never hand-drawn. [rule_derived: BDA 'Gothic Arch']`);
L(``);
```

**Key constraint (same precedence contract as Nanchan, retargeted to Gothic geometry):**

```javascript
/**
 * Precedence contract (adapted from Yingzao):
 *   measured / reconstructed_design  >  rule_derived  >  conjecture
 *
 * CRITICAL — measured reality wins (V08-analog, critical):
 * Do NOT normalize the spire toward any ad-triangulum / Roriczer ideal.
 * Nanchan kept its 1:2.67 roof (gentler than Fashi 1:3).
 * The flèche keeps Viollet-le-Duc's ACTUAL 96 m total / ~30 m base.
 * A rule that overrides the sourced 96 m / 30 m is a CRITICAL failure.
 * Deviations are DATA, not errors — annotate, never "correct."
 *
 * Uncertainty propagates: a conjectural input (e.g. la forêt tree count)
 * makes every dependent component conjectural.
 */
```

---

### 2.3 `scripts/verify.mjs` Adaptation

**Maps to:** Nanchan's 12+6 checks

The Notre-Dame verifier targets are **V01–V14** plus pixel checks **P01–P03**. **The authoritative list (assertions + tolerances) is the table in `docs/NOTRE_DAME_VERIFIED_CORPUS.md` §5 — read it there; do not duplicate it.** Summary of what each gate covers:

- **V01–V06** — cathedral envelope from component coords: total length 128 m, transept 48 m / arm 14 m, nave vessel 13 m / aisle 5.9 m, bay rhythm (10 arcade intervals ≈6 m, paired into 5 sexpartite double-bays), **vault crown 33 m** (hard-reject 35 m and 43 m), **height under roof 43 m**.
- **V07** — pointed arches are two-centred (centres on the springing line, `rise ≈ span × 0.866` for the equilateral class); rib vault is **sexpartite** (6 cells, 2 diagonal + 3 transverse ribs) over each double-bay.
- **V08 (critical)** — spire total height **96 m**, base **~30 m**, visible extent ≈66 m, with the **measured-reality guard**: a spire "corrected" away from 96 m / 30 m toward any Gothic ideal is a CRITICAL failure.
- **V09** — spire is **octagonal** on the ~15×13 m crossing footprint with the **six-part profile** (tabouret → souche → fût → 2 openwork galleries → aiguille + coq), 8 faces, angles on ridges + 4 valleys.
- **V10** — spire statuary: **16 copper statues** (12 apostles in 4 staggered groups of 3 + 4 evangelist symbols), apostle ≈3.40 m, evangelist ≈2.0 m, St Thomas faces inward.
- **V11** — *la forêt*: 57 nave frames at 0.71 m entraxe; medieval (nave+choir) frames kept distinct from the 19th-c. crossing/spire frames.
- **V12** — **provenance audit:** every component has a class + non-empty source; **0 unsourced**; the conjecture-required set is conjecture-colored.
- **V13** — **no-invention guard:** nave pier Ø, chevet radii, and rib widths must be `conjecture`/`GAP`, **never** `measured` and never attributed to "Bork/Tallon laser survey."
- **V14** — *la forêt* uncertainty propagation: tree count renders **both** ~1,000 (Épaud) and 2,000–3,400 (Corvol) as conjecture.
- **P01–P03** — canonical views non-blank (>3% non-bg); provenance view shows all four evidence-class colors; spire + nave bay + *la forêt* each visible.

**The reusable code pattern** — every `Vnn` recomputes its assertion **from `components[]` geometry, never from the engine's own `key_dimensions`.** Two examples:

```javascript
// =========== GEOMETRY CHECKS (recompute from component coords) ===========

// V08 (CRITICAL): spire total height = 96 m; base anchored ~30 m; measured-reality guard
check("V08", "spire total height = 96m ±1%, base ~30m, no idealization", () => {
  const spireComps = comps.filter(c => /^spire-/.test(c.id));
  const ys = spireComps.flatMap(c => [c.position[1], c.position[1] + (c.geometry?.h ?? 0)]);
  const summit = Math.max(...ys);
  const base   = Math.min(...comps.filter(c => /^spire-base|tabouret/.test(c.id)).map(c => c.position[1]));
  const heightPass = within(summit, 96, 1);
  const basePass   = base >= 30 && base <= 33;        // corpus: 30 m, one source 33 m
  const pass = heightPass && basePass;
  return {
    pass,
    measured: { summit: r2(summit), base: r2(base), visible_extent: r2(summit - base) },
    expected: { total_m: 96, base_m: "30–33", visible_extent_m: "~66" },
    critical: !pass,
    note: !pass ? "CRITICAL: spire must NOT be idealized away from sourced 96m/30m" : ""
  };
});

// V12: provenance audit — zero unsourced components
check("V12", "provenance: zero unsourced components", () => {
  const unsourced = comps.filter(c => !c.provenance || !c.source);
  return {
    pass: unsourced.length === 0,
    measured: { unsourced_count: unsourced.length, examples: unsourced.slice(0, 3).map(c => c.id) },
    expected: 0,
    critical: unsourced.length > 0
  };
});

// V13: no-invention guard — refuted/uncertain values may NEVER be tagged "measured"
check("V13", "no measured component cites refuted/uncertain values", () => {
  const FORBIDDEN_MEASURED = [1.948, 1.377, 0.974, 6.65, 12.42, 18.18, 23.94, 0.48, 0.38, 0.36];
  const violators = comps.filter(c =>
    c.provenance === "measured" &&
    FORBIDDEN_MEASURED.some(v => Math.abs((c.geometry?.w ?? c.radius ?? -1) - v) < 0.005)
  );
  return {
    pass: violators.length === 0,
    measured: { violators: violators.map(c => c.id) },
    expected: "pier Ø / chevet radii / rib widths must be conjecture or GAP, never measured",
    critical: violators.length > 0
  };
});

// =========== PIXEL CHECKS (P01-P03) ===========
// Same pattern as Nanchan:
// P01: all canonical views exist
// P02: each view non-blank (>3% non-background); spire + nave bay + la forêt each visible
// P03: provenance view shows all four evidence-class colors (>0.5% each class)
// P08 (optional): contour matches the PD Viollet-le-Duc 'Flèche' elevation (template matching)
```

---

### 2.4 Main Code File Correspondence

| File | Nanchan | Notre-Dame |
|------|---------|-----------|
| canonical data | `nanchan-canonical.json` | `notre-dame-canonical.json` (authored from corpus §3) |
| rule engine | `derive.mjs` (Yingzao Fashi) | `derive.mjs` (Gothic ruleset: two-centred arch, ad quadratum/triangulum, Roriczer) |
| geometry builder | `components/Viewer.tsx` | Same pattern; new component types: `Spire`, `SpireOctagon`, `Statue`, `VaultRib`, `Pier` |
| verifier | `verify.mjs` (12 dimension checks) | Same structure; checks **V01–V14** + P01–P03, recomputed from component coords |
| outputs | `structural-spec.json`, derivation log | Identical artifact structure, different data |

---

## 3. Data Preparation Checklist

### 3.1 Transcribe the corpus, do not "process a point cloud"

There is **no ingestible point cloud** for this build. Tallon's ~1B-point scan, AGP's ~50B-point surveys, and the CNRS digital twin are all **restricted (cite-only)** — see the corpus Rights Table. The data pipeline is therefore:

```text
1. Read docs/NOTRE_DAME_VERIFIED_CORPUS.md §3 (canonical skeleton).
2. Transcribe each {provenance, source, url} node into data/notre-dame-canonical.json verbatim.
3. Leave every _GAP_* node unfilled. Never invent a number to close a gap.
4. The ONLY measured-drawing asset you may ingest is the public-domain
   Viollet-le-Duc "Flèche" plate (BnF ark mm320202712p) + other PD plates
   in the corpus Rights Table (Bell's Handbook, Dehio–Bezold, Wikisource VLD).
```

### 3.2 Scaling the spire profile off the PD drawing

The per-section spire heights are a **GAP**. Derive them — do not invent them:

```text
- Asset: VLD "Élévation et plans de la flèche" plate (PD, BnF ark mm320202712p).
- Anchor the plate to the two measured facts: 96 m total, ~30 m base.
- Measure each section's pixel height on the plate; convert by (section_px / total_px) × 96 m.
- Tag every resulting section height rule_derived, source = "scaled from PD VLD 'Flèche' plate".
- Roriczer 6×/7× pinnacle multiples are CITED-UNCERTAIN → emit with a re-verify note; never as exact.
```

### 3.3 Gothic ruleset reference (the Yingzao-Fashi analog)

No single Gothic "building code" exists. The generative rules (full citations in corpus §3 `design_ruleset`):

| Rule | What it derives | Source (PD / factual) |
|------|-----------------|-----------------------|
| Two-centred (pointed) arch | Arcade/clerestory arch curves struck from springing points (equilateral: radius=span, rise=span×0.866) | Brick Development Association, "Gothic Arch" (verbatim) |
| *Ad quadratum* | Successive square side ratio 1/√2; diagonal/side = √2 | Salama et al. 2016; pure Euclid |
| *Ad triangulum* | Elevation height = base × √3/2 ≈ 0.866 | Hiscock, *The Symbol at Your Door* |
| Roriczer pinnacle (1486) | The 16 spire pinnacles: base square → 45°-rotated inscribed squares (1/√2) | Roriczer 1486 / Archaeological Journal v.4 (1847), PD |

---

## 4. First Run Checklist

### Execution order:

```bash
# 1. Derive
node scripts/derive.mjs
# Check: artifacts/structural-spec.json generated?
# Check: artifacts/derivation-log.md has complete reasoning + arithmetic?
# Check: derive.mjs THREW on any component missing {provenance, source}?

# 2. Build scene
npm run build

# 3. Start preview
npm run dev

# 4. Capture screenshots
node scripts/screenshot.mjs
# Check: artifacts/preview-*.png all generated?

# 5. Verify
npm run verify
# Expected: some checks FAIL on first run → normal!
# Review artifacts/verifier-report.json; keep failed reports as *.failed.json
```

### Expected first-run failures:

```json
{
  "summary": {
    "total": 17,
    "pass": 11,
    "fail": 6,
    "critical_failures": ["V08"]
  },
  "checks": [
    {
      "id": "V08",
      "assert": "spire total height = 96m, base ~30m, no idealization",
      "pass": false,
      "measured": { "summit": 92.3, "base": 30.0, "visible_extent": 62.3 },
      "note": "spire summit short of 96m; check per-section heights scaled off the PD plate"
    }
  ]
}
```

**Debug steps:**
1. Open `structural-spec.json`, find all `spire-*` components.
2. Check their `position` (y) and `geometry.h` against the plate-scaled section heights.
3. Is the rule engine wrong (bad plate scaling)? Or the geometry builder?
4. **Never** "fix" V08 by hard-setting 96 m on a key_dimension — the check recomputes from coords; fix the section geometry.
5. Re-run `npm run verify`.

---

## 5. Key Differences Quick Reference

| Aspect | Nanchan | Notre-Dame (Paris) |
|--------|---------|-----------|
| **Units** | fen (16.5 mm) | pied du roi (324.8 mm) |
| **Primary target** | Full timber frame | The spire (*la flèche*); nave bay = stretch; *la forêt* = vision |
| **Complexity** | Simple rectangular frame + bracket sets | Octagonal tapering spire + statuary; ribbed sexpartite vault |
| **Rule source** | Yingzao Fashi 1103 | Reconstructed Gothic ruleset (two-centred arch, ad quadratum/triangulum, Roriczer) |
| **Primary measured asset** | Tsinghua laser scan | PD Viollet-le-Duc "Flèche" plate (no ingestible point cloud) |
| **Critical guard** | Keep 1:2.67 roof vs Fashi 1:3 | Keep spire 96 m / 30 m — never idealize (V08) |
| **First failure usually** | Roof geometry | Spire taper / per-section heights scaled off the plate |

---

## 6. Quick Parameter Reference

**Do not copy a parameter block from here into the canonical file.** Author `data/notre-dame-canonical.json` from `docs/NOTRE_DAME_VERIFIED_CORPUS.md §3`, which carries `{provenance, source, url}` on every node. The headline anchors, for orientation only:

```jsonc
{
  "unit": { "pied_du_roi_mm": 324.8 },
  "key_anchors_m": {
    "spire_total_height": 96,            // measured (multi-source)
    "spire_base_level": 30,              // measured (one source 33)
    "spire_base_footprint": [15, 13],    // measured (irregular trapezoid)
    "cathedral_total_length": 128,       // measured
    "transept_width": 48,                // measured; transept arm 14
    "west_facade_width": 43.5,           // measured; facade height (no towers) 45
    "west_tower_height": 69,             // measured
    "nave_vessel_width": 13,             // measured; side aisle 5.9
    "vault_crown_height": 33,            // measured (accept 32.5–33) — NOT 35
    "height_under_roof": 43              // measured — distinct from vault crown
  },
  "counts": {
    "nave_bays": 10,                     // paired into 5 sexpartite double-bays
    "spire_statues": 16,                 // 12 apostles + 4 evangelist symbols
    "oak_framework_t": 500, "lead_cladding_t": 250
  },
  "_GAPS": [
    "nave_pier_diameter", "chevet_radii", "vault_rib_widths",
    "per_section_spire_heights", "aisle_vault_heights"   // never fill — see corpus
  ]
}
```

---

## 7. Troubleshooting Quick Reference

| Issue | Symptom | Fix |
|-------|---------|-----|
| derive.mjs throws | "component lacks {provenance, source}" | Correct — that's the audit gate. Add a real source from the corpus or render it conjecture; never silence it |
| Scene empty | `localhost:3000` shows black screen | Verify `structural-spec.json` generated; check Geometry Builder errors |
| verify.mjs crash | `npm run verify` throws | Check component ID patterns in `structural-spec.json` match the regex in verify.mjs |
| V08 fail (spire short/idealized) | "summit: 92.3m" or summit ≠ 96m | Re-scale per-section heights off the PD plate; never hard-set 96m on a key_dimension |
| V12 fail (unsourced) | "unsourced_count > 0" | Every component needs a corpus-traceable `{provenance, source}`; unsourced ⇒ conjecture color, never invented |
| V13 fail (false "measured") | pier Ø / chevet radius tagged measured | Re-tag as `conjecture`/`GAP`; never cite to "Bork/Tallon laser survey" |
| P02 fail (blank view) | "non_background: 0.5%" | Scene not rendering or too small; check component positions are reasonable scale |

---

## 8. Deliverable Checklist (Maps to Yingzao)

```
├── data/
│   └── notre-dame-canonical.json        ✓ every dimension has provenance + source, transcribed from corpus §3
├── scripts/
│   ├── derive.mjs                       ✓ clear derivation process; throws on unsourced components
│   ├── verify.mjs                       ✓ V01–V14 + P01–P03, recomputed from component coords
│   └── screenshot.mjs                   ✓ (optional, from render)
├── artifacts/
│   ├── structural-spec.json             ✓ final passing spec
│   ├── derivation-log.md                ✓ reasoning trace (fail→revise→pass logged)
│   ├── verifier-report.json             ✓ final passing report (failures kept as *.failed.json)
│   └── preview-*.png                    ✓ canonical views (final passing version)
└── README.md                            ✓ methodology summary + source/rights table + reproduction
```

Every item mirrors Nanchan's structure; only data and parameters change — and the data comes from the verified corpus, never from this guide.

---

## Handoff Summary

Your teammate gets:

1. **`docs/NOTRE_DAME_VERIFIED_CORPUS.md`** — the **single source of truth** for all dimensions, sources, the canonical skeleton (§3), the rule-engine strategy (§4), the V01–V14 verifier targets (§5), the rights table (§6), and the known gaps (§7).
2. **`docs/GOAL_NOTRE_DAME_SPIRE.md`** — scope (the spire), the ND-1…ND-32 backlog, and the Definition of Done.
3. **`NOTRE_DAME_TECH_TEMPLATE.md`** — this file: the exact **code patterns** for adapting `derive.mjs` / `verify.mjs` / `Viewer.tsx`. **Not a data source.**
4. **Reference to `/scripts/` from Nanchan** — copy and adapt `derive.mjs`, `verify.mjs`, `screenshot.mjs`.
5. **Reference to `/components/Viewer.tsx`** — study the procedural geometry + provenance-toggle pattern; reuse for Notre-Dame components.
6. **Clear success criteria:** passing verifier report (V01–V14 + pixel checks), zero unsourced components, and the measured-reality guard (V08) intact — the spire's 96 m / 30 m never idealized.

The whole pipeline is deterministic and reproducible — swap the data corpus and the same pipeline reconstructs another building. No invented numbers, no surprises, just systematic iteration against cited evidence.