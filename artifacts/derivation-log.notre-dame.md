# Derivation Log — Cathédrale Notre-Dame de Paris (WHOLE CATHEDRAL — PASS 1 massing + spire)

Rule Engine COMPOSER run. Inputs: `data/notre-dame-canonical.json` (verified corpus, 16 verdicts / 40 gaps) + the Gothic ruleset.
Module = pied du roi = 324.8 mm. Positions emitted in METRES. World frame: crossing at the origin, +X→chevet, −X→west front, ±Z→transept arms, +Y up.
Precedence: measured / reconstructed_design → rule → flagged conjecture. The MEASURED headline dims set the scale and are never recomputed from a geometric ideal (V08/V-VLT critical).

## 0. Measured headline anchors (cathedral_geometry — all CONFIRMED)
- total length **128 m** · width at transept **48 m** (arm width 14 m) · west façade **43.5 × 45 m** · towers **69 m**
- nave vessel **13 m** · side aisle **5.9 m** · **10** bays · vault crown **33 m** · under roof **43 m** · chevet Ø **47.88 m** · spire **96 m / 30 m**

## 0b. Rule-derived longitudinal split (the corpus does NOT publish these — flagged, never measured)
- West end at X=-60 m, chevet outer at X=68 m → span 128 m = the measured 128 m ✓ (crossing position = origin is rule_derived).
- Nave -56→-7 m (49 m, 10 bays × ~4.9 m interval — count measured, interval rule_derived).
- Crossing -7→7 m (14 m measured footprint). Choir 7→44.06 m + apse hemicycle (R 23.94 m measured) centred X=44.06 → 68 m.
- Transept arms reach ±24 m on Z (48 m arm-to-arm measured). Aisle height 23.76 m + roof ridge form = rule_derived (GAPs).

## 1. Composing fragments (construction order; massing shells first, spire last)
- `west-front` [massing] → 3 components
- `nave` [massing] → 3 components
- `crossing` [massing] → 1 component
- `transept` [massing] → 2 components
- `choir` [massing] → 3 components
- `apse` [massing] → 1 component
- `roof` [massing] → 2 components
## SPIRE (full fidelity) — six-part profile scaled off the PD plate; the absolute scale is the measured 96 m
- Section run sums to 65 m + 1 m coq = 66 m = the measured visible extent ✓; base 30 → summit 96 m.
- `spire` [full] → 93 components (composed in UNCHANGED at the crossing — ids/positions byte-identical, V08–V14 anchor)

## 2. Provenance audit
- Components: 108 total — measured: 44, rule_derived: 24, conjecture: 18, reconstructed_design: 22
- Fidelity: massing: 15, full: 93
- Fragments: west-front: 3, nave: 3, crossing: 1, transept: 2, choir: 3, apse: 1, roof: 2, spire: 93
- Audit gate: every component (massing + spire) carries {provenance, source, url, rights}; source resolves to the rights-cleared registry (use/use-data); a restricted or unregistered source throws (0 unsourced by construction).
- Spire group present at the crossing: 93 components, 16 statues, coq at 96 m (summit, measured 96 m).

## 3. Measured-reality deviations (kept, never corrected — V08 / V-VLT)
- Spire total 96 m and base 30 m are MEASURED — never recomputed from an ad-triangulum height-from-width ideal (V08 critical).
- Per-section heights are NOT published → scaled off the PD plate (rule_derived), never asserted as measured.
- Octagon springing dimension is a GAP → a regular octagon is inscribed in the mean ~14 m footprint (rule_derived), never claimed as surveyed.
- Rooster weight is cited-uncertain (~30 vs ~10 kg) → conjecture, never measured.
- Roriczer 6×/7× pinnacle multiples are cited-uncertain → pinnacle heights are conjecture, never exact.
- Vault crown is the MEASURED 33 m — never recomputed toward 35 m (refuted) or 43 m (under-roof) (V-VLT, generalised V08).
- Every internal split the corpus does not publish (crossing position, nave/choir division, bay interval) is rule_derived and flagged — uncertainty propagated to placement, never invented.

*The measured cathedral outranks the rulebook; partial fidelity (massing + the flawless spire) is honest, shown by the provenance toggle.*
