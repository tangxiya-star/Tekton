# Whole-Cathedral Integration Architecture — Notre-Dame de Paris

> How the flawless **spire** scales to the **whole cathedral** per `docs/GOAL_NOTRE_DAME_WHOLE.md`, working by level-of-detail and fidelity tier, time-boxed. **PASS 1 = MASSING first** — fast, recognizable, every block sourced. The existing spire stays **full fidelity** and **green (V08–V14)**; nothing here touches it.
>
> Source of truth for all dimensions: `docs/NOTRE_DAME_VERIFIED_CORPUS.md` → `cathedral_geometry` (16 adversarially-verified verdicts). Rights: `data/notre-dame-canonical.json` `source_registry` + `rights_excluded`. Rules unchanged: cite-or-gap · provenance per component · measured-reality guard · rights gate · **procedural geometry, no imported meshes** · uncertainty propagates · never invent.

---

## 0. The one-sentence design

`notre-dame` becomes the **whole cathedral**: ONE `artifacts/structural-spec.notre-dame.json` is composed from **per-tier component-group FRAGMENTS**, each fragment a derive *scope* that emits components in **LOCAL coords**, which a **COMPOSER** offsets to its **WORLD position** (crossing at the origin), so the existing spire composes in **unchanged** and the silhouette reads as Notre-Dame with the flèche on the crossing. Partial fidelity is honest: the massing renders `measured`/`rule_derived`; the spire is full fidelity; the provenance toggle is the honesty layer.

---

## 1. Composition model — fragments → one spec via a composer

### 1.1 What exists today (the constraint that drives the design)

- `scripts/derive.mjs` is a `--building` dispatcher; `--building notre-dame` delegates to `scripts/derive-notre-dame.mjs`, which emits `artifacts/structural-spec.notre-dame.json` (one flat `components[]` array, each carrying `{id, provenance, source, url, rights, seq, geometry, position, …}`).
- `comp()` is the **audit gate**: it throws on missing `{provenance,source}`, rejects sources in `rights_excluded`, rejects sources absent from `source_registry`/not `use|use-data`, and enforces the **≥2-source rule** for any `measured` component (the source must back a canonical node with `corroborating_sources.length >= 1` → `MULTI_SOURCED`). It stamps `url`+`rights` from the registry and assigns `seq`.
- `scripts/verify-notre-dame.mjs` recomputes V08–V14 + P01–P03 **from component coords**, never from `key_dimensions`.
- `components/SpireViewer.tsx` renders the flat `components[]` directly (`box` centered on position; `lathe`/octagon; `poly`; `cone`; `capsule`; `torus`; `sphere`; `cylinder`) — all **procedural**, no imported meshes.

The spire today is effectively **a single fragment whose LOCAL frame already equals WORLD** (it is authored at the crossing, base y=30→96 at x=0,z=0). That is the seam we generalize.

### 1.2 The fragment contract

A **fragment** = one self-contained derive scope for a tier / component-group. Each fragment is a module:

```
scripts/fragments/<tier>.mjs
  export default function deriveFragment({ C, comp, anchors }) → void
```

- It receives a **scoped `comp()`** (the same audit gate, so the cite-or-gap / rights / ≥2-source guarantees hold identically inside every fragment) and emits components **in LOCAL coordinates** — its own origin, +X toward the chevet, +Y up, +Z toward the north transept arm (see §2). A fragment never needs to know its world placement.
- It receives shared `anchors` (the measured headline dims: `total_length`, `width_transept`, `west_facade_width`, etc.) so two fragments agree on the seams (e.g. the nave fragment and the west-front fragment share the bay-zero plane).
- Each emitted component carries `{provenance, source, url, rights}` exactly as today; massing blocks are `measured` where the dimension is a corpus headline, `rule_derived` where placement/split is not published (see §6), never invented.

### 1.3 The composer

`scripts/derive-notre-dame.mjs` becomes a thin **composer** over a **fragment registry**:

```js
const FRAGMENTS = [
  { key: "spire",        local: deriveSpire,    offset: [0, 0, 0],   enabled: true,  fidelity: "full"    },
  { key: "crossing",     local: deriveCrossing, offset: [0, 0, 0],   enabled: true,  fidelity: "massing" },
  { key: "nave",         local: deriveNave,     offset: [NAVE_X, 0, 0],   enabled: true,  fidelity: "massing" },
  { key: "transept",     local: deriveTransept, offset: [0, 0, 0],   enabled: true,  fidelity: "massing" },
  { key: "choir",        local: deriveChoir,    offset: [CHOIR_X, 0, 0],  enabled: true,  fidelity: "massing" },
  { key: "west-front",   local: deriveWestFront,offset: [WEST_X, 0, 0],   enabled: true,  fidelity: "massing" },
  // tiers swap their massing block when ready (see §3):
  // { key: "west-towers", local: deriveWestTowers, offset: [WEST_X,0,0], enabled: false, replaces: "west-front", fidelity: "full" },
];
```

For each enabled fragment the composer:
1. Calls the fragment with a **capturing `comp()`** that buffers its LOCAL components.
2. **Offsets** every captured component to WORLD: `position = local.position + offset`; for `poly` it offsets each `pts[]` triple; rotations are unchanged (fragments author in the world's axis convention, only translated — no per-fragment rotation in PASS 1; the apse hemicycle, if curved, authors its own local rotations).
3. **Namespaces ids** as `<fragment.key>:<localId>` so ids stay globally unique and the inspector/verifier can group by fragment.
4. Pushes through the shared audit gate (so a fragment cannot smuggle an unsourced or rights-excluded component into the spec) and assigns the global `seq` in **construction order** (massing shells first, spire last → the Build Theater plays base-up).

Output is the **same single** `artifacts/structural-spec.notre-dame.json` + `derivation-log` + `derivation-stream.jsonl`. **`SpireViewer.tsx` needs no structural change** — it already renders a flat `components[]`; it gains only optional fragment-aware grouping for the inspector. This keeps the spire byte-stable when only massing fragments are added behind it.

### 1.4 Why a composer and not one monolith

- **Parallelism** (GOAL §"Parallelize"): tiers are independent — multiple agents own one fragment file each, no merge contention on a 600-line monolith.
- **Independent shippability**: a tier can be `enabled:false` until green; the build still ships massing.
- **Determinism preserved**: composition is a pure fold over a fixed fragment list; byte-stable across replay runs (rubric `research_pipe`).

---

## 2. World coordinate frame (metres)

**Origin = the transept crossing**, on the cathedral floor centreline, so the existing spire (authored base y=30 → summit y=96 at x=0,z=0) **composes in UNCHANGED**. This is the load-bearing choice: it preserves V08 and every spire coord verbatim.

```
            +Z  (north transept arm)
             |
             |        [ apse / chevet ]
  west       |       /
  front  ----+------●------------------>  +X  (toward the chevet / east)
 (-X end)    |   crossing (0,0,0)
             |   (spire base y=30 here)
             |
            -Z  (south transept arm)
```

- **+X** runs east, toward the choir / apse / chevet. **−X** runs west, toward the west front + two towers.
- **±Z** are the transept arms; arm-to-arm = **48 m** (corpus `total_width_transept`/`transept.length_arm_to_arm`), so north arm tip ≈ **+24 m**, south arm tip ≈ **−24 m**. Transept arm width (along X) = **14 m**.
- **+Y** up; floor at y=0; the **vault crown** at **33 m**; **height under roof** at **43 m**; the spire base anchored at **30 m** (its existing authored value). The nave-aisle massing roofline sits just under 43 m so the ground plane / spire base read coherently (the SpireViewer ground plane at y≈29.4 is the spire's own crossing reference and is unaffected).

### 2.1 Per-part X extents along the 128 m total (the longitudinal split)

The corpus gives **total exterior length 128 m** (`measured`) and **transept arm width 14 m**, but **does NOT publish the crossing position along the 128 m**, nor a clean modern nave-vs-choir interior split (the only longitudinal figures are Bell's 1902 PD cross-check: nave length 225 ft ≈ **68.6 m**, total 390 ft — a different/interior reference, kept as cross-check only). Therefore the longitudinal placement of the crossing is **`rule_derived`**, flagged, never asserted as measured:

| Part | World X span (approx, metres) | Length | Provenance of the *extent* | Basis |
|---|---|---|---|---|
| West front (façade plane → towers) | −60 → −56 | ~4 m wall depth | width/height **measured**; X position **rule_derived** | façade at the −X end of the 128 m |
| Nave + aisles (10 bays) | −56 → −7 | ~49 m | bay count **measured**; bay interval & crossing offset **rule_derived** | 10 arcade intervals ≈ 6 m; consistent with Bell ~68.6 m nave incl. crossing zone |
| Crossing (carries spire) | −7 → +7 | ~14 m | width **measured** (14 m arm); X centre **rule_derived (= origin)** | square-ish crossing ≈ nave vessel + transept arm |
| Choir + apse/chevet | +7 → +68 | ~61 m | chevet outer Ø **measured (~47.88 m)**; nave/choir split **rule_derived** | choir straight bays + hemicycle to the +X end of 128 m |

`(-60) → (+68) = 128 m` total ✓ (the headline `measured` length is recomputed by V-LEN from the extreme component span — see §4). The **only** measured facts here are the headline dims (length 128, width 48, façade 43.5/45, towers 69, vault 33); **every internal split that the corpus does not publish is tagged `rule_derived` with a note** ("crossing position along the 128 m not published; placed by rule from bay count + chevet Ø"). This is the uncertainty-propagation rule applied to *placement*, not just to dimensions.

> Anchor sharing: the composer computes `WEST_X`, `NAVE_X`, `CHOIR_X` once from `{total_length, west_facade_width, transept arm width, chevet Ø}` + the rule_derived bay interval, and passes them to fragments via `anchors`, so the seams (façade↔nave, nave↔crossing, crossing↔choir) are coincident by construction.

---

## 3. How a fidelity tier swaps its massing block

Each fragment declares an optional **`replaces`** key. When a higher-fidelity tier is ready and `enabled:true`, the composer **drops** the fragment it `replaces` and composes the detailed one at the **same world offset**:

- **PASS 1**: `west-front` fragment emits ONE massing box (43.5 m wide × 45 m tall façade slab + 2 tower prisms to 69 m), `measured` dims.
- **Tier ready**: the separately-built `notre-dame-towers` tier becomes the `west-towers` fragment (`replaces:"west-front"`, same `WEST_X` offset). The composer disables the massing box and composes the Gallery-of-Kings / rose / 3 portals / tracery / pinnacle component-group at the west front. Same swap pattern for `nave→nave-vaults`, `transept→transept-roses`, `choir→choir-chapels`, `roof→foret`.

Properties of the swap:
- **Local-frame guarantee** makes it a one-line change (flip `enabled`); the detailed fragment authors in the same LOCAL frame the massing box used, so it lands registered with its neighbours.
- **Verifier continuity**: the massing checks (§4) recompute from *whatever* components occupy that world region, so the same length/width/façade/tower checks pass before AND after the swap — the swap raises fidelity without moving the silhouette.
- **Provenance gradient stays honest**: a region renders massing-colored until its tier ships, then full-fidelity; the toggle shows exactly which parts are detailed.
- **Spire is the worked example**: it is already the `fidelity:"full"` fragment at offset `[0,0,0]`, proving the swap target shape.

---

## 4. Verifier extension plan + done.rubric tier criteria

### 4.1 New massing checks (recomputed from component coords, never `key_dimensions`)

`verify-notre-dame.mjs` keeps V08–V14 + P01–P03 (spire, **unchanged, stay green**) and adds a **massing block**, each value recomputed from the composed `components[]` extreme spans / positions:

| ID | Assertion (recomputed from coords) | Target | Tol | Critical |
|---|---|---|---|---|
| **V-LEN (V01)** | Extreme component span on X (west front → chevet) = total length | **128 m** | ±2% | — |
| **V-WID (V02)** | Max component span on Z across the transept = total width; transept arm width on X | **48 m** / **14 m** | ±2% | — |
| **V-FAC** | West-front fragment bounding box: width on Z, height on Y (no towers) | **43.5 m** / **45 m** | ±2% | — |
| **V-TWR** | Max Y of west-front/tower components | **69 m** | ±2% | — |
| **V-NAVE** | Nave vessel clear width (inner arcade/aisle faces on Z); each side aisle | **13 m** / **5.9 m** | ±3% | — |
| **V-BAYS** | Nave bay rhythm: 10 arcade intervals on X, mean ≈ 6 m | **10** / **~6 m** | ±5% | — |
| **V-VLT** | High-vault crown massing top = 33 m; **guard: must NOT equal 35 m** (refuted) or 43 m (under-roof) | **33 m** | ±3% | hard-reject 35 & 43 |
| **V-XPT** | Transept arms reach ±24 m on Z; crossing region carries the spire base (spire base x≈0,z≈0 inside the crossing footprint) | **±24 m** | ±5% | — |
| **V-COMPOSE** | Composer integrity: every component id is `<fragment>:<local>`; spire fragment components are byte-identical to the standalone spire (regression guard) | exact | — | **yes** |
| **V12/V14 (extended)** | Provenance + rights audit runs over **all** fragments: every massing block carries a valid class + registry-resolved source + `{url,rights}`; rule_derived splits are never `measured` | 0 unsourced / 0 rights-excluded | — | **yes** |

V08 (spire 96/30, measured-reality guard) remains **critical** and untouched. The measured-reality guard generalizes: a massing dim that is a corpus headline (128, 48, 43.5, 69, 33) is `measured` and must **never** be recomputed toward an ad-quadratum/ad-triangulum ideal — V-VLT's hard-reject of 35 m is the canonical example.

### 4.2 done.rubric tier criteria

`done.rubric.json` gains a **per-tier criteria block** (`required:true` only for shipped tiers; a tier that is `enabled:false` is `required:false` so the build still ships massing):

```jsonc
{ "id": "massing_recognizable", "category": "impact", "required": true, "critical": true,
  "requirement": "Whole-cathedral massing renders recognizably with the spire on the crossing",
  "check": "verifier V-LEN+V-WID+V-FAC+V-TWR+V-VLT pass; P02 non-blank from the front view" },
{ "id": "massing_sourced", "category": "impact", "required": true, "critical": true,
  "requirement": "Every massing block carries {provenance,source,url,rights}; unpublished splits are rule_derived, never measured",
  "check": "V12+V14 extended over all fragments pass; 0 unsourced; 0 rule_derived-as-measured" },
{ "id": "spire_regression", "category": "autonomy", "required": true, "critical": true,
  "requirement": "Composing massing behind the spire leaves the spire full-fidelity and green",
  "check": "V08–V14 pass; V-COMPOSE confirms spire components byte-identical" },
{ "id": "tier_<x>_shipped", "category": "demo", "required": false, "critical": false,
  "requirement": "Tier <x> swapped its massing block; its tier checks pass",
  "check": "fragment enabled + replaces resolved + tier verifier_targets green" }
```

The rule is unchanged: **the build cannot ship a tier unsourced or rule-overridden; Nanchan + the spire stay green** (the spire's V08–V14 and `--building nanchan` remain the regression anchors).

---

## 5. LOD / tier sequence + time-box

Build by level-of-detail, finish PASS 1 first; each tier is independently shippable.

| Order | Tier / fragment | Fidelity | Time-box | Gate to ship |
|---|---|---|---|---|
| 0 | **PASS 1 massing** (this stage's output — all 6 massing fragments + composer) | massing | **do first** | V-LEN/WID/FAC/TWR/VLT/XPT + V12/14 + spire regression green |
| 1 | **Spire** | full (exists) | done | V08–V14 stay green |
| 2 | **West towers + façade** (Gallery of Kings 28, rose, 3 portals/tympana, tracery, tower pinnacles) | full | next | tier checks + façade 43.5/45, towers 69 recomputed |
| 3 | **Nave + vaults** (sexpartite vaults, compound piers, arcade/tribune/clerestory, flying buttresses) | full | then | nave 13/5.9, 10 bays, vault 33 recomputed; rib widths stay GAP/conjecture |
| 4 | **Transept + roses** (2 transept rose windows, gables) | full | then | ±24 m arms, rose diameters from corpus |
| 5 | **Choir / apse / chevet** (radiating chapels, double ambulatory) | full | then | chevet Ø ~47.88 m recomputed; concentric radii stay GAP (blog-DQ) |
| 6 | **Roof / *la forêt*** (lost 13th-c. oak frame) | conjecture-dominant | last / until time runs out | 57 nave frames @0.71 m; tree count renders BOTH Épaud/Corvol as conjecture (V14-analog) |

**Time-box rule**: finish PASS 1 (massing) — that alone gives the recognizable whole cathedral with the flawless spire — then add tiers 2→6 in order until time runs out. Never present massing or conjecture as measured detail.

---

## 6. PASS-1 MASSING BLOCKS — cited dims + world positions

All dims below are `measured` from `docs/NOTRE_DAME_VERIFIED_CORPUS.md` `cathedral_geometry` (source `FRIENDS` / corroborated). **Placement** values flagged `rule_derived` are positions the corpus does not publish (crossing offset along 128 m, nave-vs-choir split, individual bay interval). Geometry is procedural `box` (centered on position) or `lathe`/octagon; ids are `<fragment>:<local>`.

| Block (id) | Geometry (m) | World position (centre, m) | Dim provenance | Source | Placement provenance |
|---|---|---|---|---|---|
| `crossing:mass` | box 14 × 43 × 14 (X×Y×Z) | [0, 21.5, 0] | width 14 m **measured** | FRIENDS (transept arm width) | centre = origin **rule_derived** |
| `nave:vessel` | box 49 × 33 × 13 | [−31.5, 16.5, 0] | vessel 13 m, vault 33 m, bays 10 **measured** | FRIENDS / techno-science | length & offset **rule_derived** (10×~6 m) |
| `nave:aisle-N` | box 49 × 24 × 5.9 | [−31.5, 12, +9.45] | aisle 5.9 m **measured** | FRIENDS | aisle vault height **rule_derived** (GAP) |
| `nave:aisle-S` | box 49 × 24 × 5.9 | [−31.5, 12, −9.45] | aisle 5.9 m **measured** | FRIENDS | mirror of N **rule_derived** |
| `transept:arm-N` | box 14 × 43 × 24 | [0, 21.5, +12] | arm width 14 m, arm-to-arm 48 m **measured** | FRIENDS | length to ±24 m **measured-derived** |
| `transept:arm-S` | box 14 × 43 × 24 | [0, 21.5, −12] | arm width 14 m **measured** | FRIENDS | mirror **measured-derived** |
| `choir:vessel` | box 30 × 33 × 13 | [+22, 16.5, 0] | vessel 13 m, vault 33 m **measured** | FRIENDS | nave/choir split **rule_derived** |
| `choir:apse` | lathe (half-octagon/hemicycle) outer Ø ~47.88 → narrowing | [+60, ~16, 0] | chevet outer Ø ~47.88 m **measured** | FRIENDS (= 48 m / chevet) | apse radii **GAP** → massing only, **rule_derived** form |
| `west-front:facade` | box 4 × 45 × 43.5 (depth×Y×Z) | [−58, 22.5, 0] | width 43.5 m, height 45 m **measured** | FRIENDS / techno-science | wall depth **rule_derived** |
| `west-front:tower-N` | box 12 × 69 × 12 | [−58, 34.5, +14.5] | tower height 69 m **measured** | de.Wikipedia + FRIENDS | tower footprint/spacing **rule_derived** |
| `west-front:tower-S` | box 12 × 69 × 12 | [−58, 34.5, −14.5] | tower height 69 m **measured** | de.Wikipedia + FRIENDS | mirror **rule_derived** |
| `roof:ridge` (massing) | box 79 × ~10 × 13 (nave+choir ridge, simple prism) | [−5, 38, 0] | under-roof 43 m, vault 33 m **measured** | FRIENDS | ridge form **rule_derived** (la forêt = later tier) |

Notes binding the rules:
- **Measured anchors honored** (never recomputed toward a rule): length 128, width 48, façade 43.5/45, towers 69, vault 33, aisle 5.9, vessel 13, transept 48×14.
- **Spire** is NOT re-emitted here — it composes in from its existing fragment at `[0,0,0]`, base 30 → 96, on `crossing:mass`. The crossing massing top (43 m) sits **below** the spire base (30 m anchored above ground, i.e. above the crossing vaults), consistent with the spire's existing authored frame.
- **GAPs stay GAP** (never invented): aisle/tribune vault crown heights, chevet concentric radii (blog-DQ → `rights_excluded`), nave pier diameter, rib widths. Massing renders these as plain volumes tagged `rule_derived` with a note, or omits them — never as `measured`.
- **≥2-source rule**: any block tagged `measured` cites a corpus headline backed by `corroborating_sources` (e.g. width 48 m: FRIENDS + Le Marais Mood; façade: FRIENDS + techno-science) so `comp()`'s MULTI_SOURCED gate passes; single-source or unpublished placements are `rule_derived`/`conjecture`.

---

## 7. Summary

- **Composition**: `notre-dame` = the whole cathedral as ONE `structural-spec.notre-dame.json` composed by a thin **composer** in `derive-notre-dame.mjs` over a **fragment registry**; each fragment is a derive scope emitting LOCAL-coord components through the shared `comp()` audit gate; the composer offsets them to WORLD, namespaces ids `<fragment>:<local>`, and assigns construction-order `seq`. `SpireViewer.tsx` renders the flat array unchanged.
- **World frame**: crossing at the origin (so the spire composes in UNCHANGED, V08 preserved); +X→chevet, −X→west front, ±Z→transept arms (±24 m), +Y up (floor 0, vault 33, under-roof 43, spire base 30, towers 69, summit 96). The 128 m splits along X are `rule_derived` where the corpus does not publish them (crossing offset, nave-vs-choir split, bay interval) — uncertainty propagated to placement, never invented.
- **Tier swap**: a fragment's `replaces` key lets a higher-fidelity tier drop its massing box at the same offset (one-line `enabled` flip); the spire is the worked example of a `fidelity:"full"` fragment.
- **Verify**: V08–V14 + spire stay green (regression-guarded by V-COMPOSE byte-identity); new massing checks V-LEN/WID/FAC/TWR/NAVE/BAYS/VLT/XPT recompute headline dims from coords; V12/V14 audit all fragments; `done.rubric.json` gains `massing_recognizable` / `massing_sourced` / `spire_regression` (critical) + per-tier criteria.
- **Sequence/time-box**: PASS 1 massing first (recognizable whole cathedral + flawless spire), then tiers 2→6 (towers/façade → nave/vaults → transept/roses → choir/chapels → roof/forêt) until time runs out; each independently shippable.
