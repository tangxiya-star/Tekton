# Derivation Log — Flèche de Notre-Dame de Paris (Viollet-le-Duc, 1859)

Rule Engine run. Inputs: `data/notre-dame-canonical.json` (verified corpus, 16 verdicts / 40 gaps) + the Gothic ruleset (ad quadratum, Roriczer pinnacle).
Module = pied du roi = 324.8 mm. Positions emitted in METRES.
Precedence: measured / reconstructed_design → rule → flagged conjecture. The 96 m total + 30 m base are MEASURED and are never recomputed from a geometric ideal (V08 critical).

## 0. Anchors (measured)
- Total height = **96 m** to the rooster head [CULTURE-FLECHE; +3 corroborating]
- Base anchored = **30 m** above ground, on the croisée du transept [CONSTRUCTIONBTP]
- Visible extent = 96 − 30 = **66 m** (reconstructed_design)

## 1. Six-part profile (la flèche) — heights scaled off the PD plate (rule_derived; the absolute scale is the measured 96 m)
- Section run sums to 65 m + 1 m coq = 66 m = the measured visible extent ✓
- tabouret  y 30→32 m · octagon R 4.8→4.6 m · [conjecture; RESTAURONS-ND]
- souche    y 32→40 m · octagon R 4.6→4.3 m · [reconstructed_design; VLD-FLECHE]
- fut       y 40→62 m · octagon R 4→2.6 m · [reconstructed_design; VLD-FLECHE]
- gallery1  y 62→69 m · octagon R 2.85→2.55 m · [reconstructed_design; VLD-FLECHE]
- gallery2  y 69→79 m · octagon R 2.7→1.5 m · [reconstructed_design; VLD-FLECHE]
- aiguille  y 79→95 m · octagon R 1.6→0.08 m · [reconstructed_design; VLD-FLECHE]
- Taper (octagon circumradius) is strictly decreasing souche→aiguille — the measured-reality monotonic guard (V11).

## 2. Octagon ring beams — radius set by the ad quadratum octagon rule (rule_derived)
- Octagon springs from a square by 45° rotation (side ratio 1/√2 ≈ 0.707); the exact springing dimension is a GAP, so a regular octagon is inscribed in the ~14 m crossing and the rings mark each section join.

## 3. Quadrilobes — 8 on the fût faces [count measured: 8; form reconstructed_design from VLD plate]

## 4. Gabled bays — 8 lucarnes on the second gallery [reconstructed_design; "8 gabled bays" per culture.gouv profile]

## 5. Pinnacles — 16 via the Roriczer (1486) rule [rule_derived]; vertical multiples (~6×/7×) CITED-UNCERTAIN → spirelets conjecture
- Roriczer: base square → 45°-rotated inscribed squares (1/√2). 8 around gallery1 + 8 around gallery2 = 16 [count measured: 16].

## 6. Statuary — 16 copper statues [measured: 12 apostles + 4 evangelist symbols; PERSEE-2009]
- 4 groups of 3 apostles (staggered, climbing) + 4 evangelist symbols, around the base of the spire (gallery1 level).
- Apostle ≈ 3.4 m (measured); evangelist ≈ 2 m (measured). Weights cited-uncertain (apostle 140 vs 150 kg; evangelist 65 vs 75 kg) — adversarially flagged, drive no geometry.
- St Thomas (patron of architects) turns to FACE the spire and bears Viollet-le-Duc's own features.

## 7. Summit — the coq (rooster) at 96 m [conjecture: weight ~30 kg vs ~10 kg cited-uncertain; position from the measured 96 m]

## 8. Provenance audit
- Components: 93 total — conjecture: 18, reconstructed_design: 22, rule_derived: 21, measured: 32
- Audit gate: every component carries {provenance, source, url, rights}; source resolves to the rights-cleared registry (use/use-data); a restricted or unregistered source throws.
- Statue count = 16 (12 apostles + 4 evangelists). Pinnacles = 16.

## 9. Measured-reality deviations (kept, never corrected — V08)
- Spire total 96 m and base 30 m are MEASURED — never recomputed from an ad-triangulum height-from-width ideal (V08 critical).
- Per-section heights are NOT published → scaled off the PD plate (rule_derived), never asserted as measured.
- Octagon springing dimension is a GAP → a regular octagon is inscribed in the mean ~14 m footprint (rule_derived), never claimed as surveyed.
- Rooster weight is cited-uncertain (~30 vs ~10 kg) → conjecture, never measured.
- Roriczer 6×/7× pinnacle multiples are cited-uncertain → pinnacle heights are conjecture, never exact.

*Viollet-le-Duc's measured 96 m outranks any geometric ideal.*
