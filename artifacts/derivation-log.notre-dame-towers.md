# Derivation Log — Façade occidentale & tours de Notre-Dame de Paris (v2)

Rule Engine run. Inputs: `data/notre-dame-towers-canonical.json` (adversarial cite-or-gap corpus) + the Gothic ruleset (ad quadratum/triangulum, two-centred arch, rose radial, Roriczer pinnacle).
Module = pied du roi = 324.8 mm. Positions emitted in METRES. Facade in the X–Y plane facing +Z; ground at y=0.
Precedence: measured / reconstructed_design → rule → flagged conjecture. The MEASURED anchors are never recomputed from a geometric ideal (T02 critical).

## 0. Anchors (measured)
- Facade total width = **43.5 m** [FRIENDS-WEST-FACADE; +2 corroborating]
- Facade body height (below towers) = **45 m** [FRIENDS-WEST-FACADE]
- Tower culmination = **69 m** [FRIENDS-WEST-FACADE; +1 corroborating]
- West rose diameter = **9.6 m** [FRIENDS-ROSE-WINDOWS; +2 corroborating]
- Gallery of Kings = exactly **28** figures [PANORAMA-GALERIE-ROIS; +3 corroborating]

## 1. Tripartite bay layout — 4 buttresses divide the measured 43.5 m into 3 bays (rule_derived)
- Per-portal width is a GAP (canonical _GAP_portal_widths_m) → bay widths derived by dividing the 43.5 m: centre **13.56 m** (widest), sides **10.17 m** each, 4×2.4 m buttresses. Never asserted as surveyed.
- Buttress centrelines x = -20.55, -7.98, 7.98, 20.55 m; bay centres x = -14.265, 0, 14.265 m.

## 2. Facade body — box 43.5 m wide × 45 m high (limestone; width MEASURED, T01 anchor)

## 3. Two west towers — culminate at 69 m, flat-topped (spires never built); N (14.91 m) wider than S (13.69 m)
- Tower height 69 m is MEASURED (T02 critical anchor). Widths are single-source → reconstructed_design (asymmetry preserved, never normalized to identical twins). The towers carry NO spire — rendered flat-topped per the canonical (never "completed" to a Gothic ideal).

## 4. Four buttresses — vertical piers dividing the tripartite bays [count MEASURED: 4; T06]

## 5. Three west portals — base; centre widest; pointed arch via the two-centred-arch rule (rule_derived)
- L = Portal of the Virgin, centre = Last Judgment (widest), R = St-Anne [identities MEASURED; FRIENDS-PORTALS]. Per-portal widths are a GAP → opening widths rule_derived from the bay widths; the pointed arch head is struck by the two-centred-arch rule.

## 6. Gallery of Kings — EXACTLY 28 figures, ≈3.5 m tall, band ≈20 m up [count MEASURED, T03; figures reconstructed_design — 19th-c VLD restorations]
- 28 Kings of Judah (NOT kings of France). The figures TODAY are Viollet-le-Duc's 19th-c restorations (21 original heads at the Musée de Cluny) → reconstructed_design, never presented as medieval fabric. Cite CLUNY-HEADS / PANORAMA-GALERIE-ROIS.

## 7. West rose window — diameter 9.6 m (MEASURED, T05), 24-ray radial wheel tracery (rule_derived geometry), centred above the central portal

## 8. Chimeras / gargoyles — a representative few, flagged CONJECTURE (form reconstructed_design from VLD; NEVER a sourced count)
- The Galerie des Chimères is a wholesale 19th-c VLD/Lassus invention (NOT medieval). No reliable total count is published (_GAP_gargoyle_count) → we render a representative few flagged conjecture; the form derives from the PD VLD drawings.

## 9. Tower pinnacles — set out by the Roriczer (1486) rule [rule_derived; proportions conjecture per _GAP_pinnacle_dims]

## 10. Provenance audit
- Components: 122 total — measured: 8, reconstructed_design: 59, rule_derived: 47, conjecture: 8
- Categories: facade: 2, tower: 4, buttress: 4, portal: 6, king: 56, rose: 26, gargoyle: 8, pinnacle: 16
- Audit gate: every component carries {category, provenance, source, url, rights}; source resolves to the rights-cleared registry (use/use-data); a restricted/unregistered source, or a single-source "measured", throws.
- Kings = 28 (T03 = exactly 28). Portals = 3 (centre widest). Buttresses = 4. Rose Ø 9.6 m.

## 11. Measured-reality deviations (kept, never corrected — T02)
- Facade 43.5 m / towers 69 m / rose 9.6 m are MEASURED — never recomputed from an ad-quadratum/triangulum ideal (T02 critical).
- North and south towers DIFFER in width (asymmetric) — not normalized to identical twins.
- The towers were never given spires — rendered flat-topped, not 'completed' to a Gothic ideal.
- Gallery-of-Kings figures + the chimeras are 19th-c restoration/invention (reconstructed_design), never presented as medieval fabric.
- Exact stone colour (as-built vs cleaned vs sooted) is conjecture; exact RGB is a GAP — never invented.

*43.5 m / 69 m / 9.6 m / 28 kings are MEASURED and outrank any geometric ideal.*
