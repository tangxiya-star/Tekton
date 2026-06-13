> ⚠️ **STRUCTURE-ONLY DOCUMENT — DO NOT TRUST ANY DATA HERE (ticket ND-12).** This document's data layer was originally **FABRICATED**: it conflated Notre-Dame de **Reims** with the build target and cited a **non-existent "Nohesive 2019" survey**. Even where prose now reads "Paris," **none of the dimensions, sources, citations, or example values in this file may be used** — treat every number here as untrustworthy. This file is retained **ONLY** for pipeline / code structure (the one-page method summary and pipeline layout). The **single source of truth for ALL Notre-Dame dimensions and sources is `docs/NOTRE_DAME_VERIFIED_CORPUS.md`** (the adversarially-verified, cited ND-1 corpus). When in doubt, use the corpus; never copy a value from here.

# Notre-Dame Rebuild — Methodology & Self-Verification

## One-Sentence Version

**Same method as Nanchan:** (cited public-domain data + historical geometric rules) → derive geometry → render → verify independently → fail→revise→pass cycle → provenance-labeled 3D model. Only the data and parameters change.

> **Building:** Notre-Dame de **Paris** (begun ~1163; the spire — *la flèche* — is Viollet-le-Duc's 1859 design; spire + roof lost 15 Apr 2019; cathedral reopened Dec 2024). **Scope for v1:** the spire (*la flèche*) only.

---

## Five-Layer Pipeline (Identical Structure)

### Layer 1: Data Canonicalization
- **Input:** the verified corpus (`docs/NOTRE_DAME_VERIFIED_CORPUS.md`) — public-domain Viollet-le-Duc *Dictionnaire* "Flèche" drawing (BnF) + factual published dimensions (Friends of Notre-Dame, culture.gouv) + Bell's Handbook PD cross-check set
- **Output:** `data/notre-dame-canonical.json` — key dimensions, each tagged `{provenance, source, url, rights}`
- **Precedence:** measured / reconstructed_design > rule_derived > conjecture (never override a sourced value)
- **Module unit:** the **pied du roi (royal foot) = 324.8 mm** — the French-Gothic analog of Nanchan's *fen*
- **Example:**
  ```json
  "spire_total_height": { "m": 96, "pied_du_roi": 295.6, "provenance": "measured",
    "source": "culture.gouv 'Petite histoire de la flèche' (CONFIRMED, multi-source)",
    "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/petite-histoire-de-la-fleche" }
  ```

### Layer 2: Rule Engine (Derivation)
- **Input:** `data/notre-dame-canonical.json` + Gothic geometric ruleset (two-centred arch, ad quadratum/triangulum, Roriczer pinnacle)
- **Output:** `artifacts/structural-spec.json` (every component's position/dimension) + `derivation-log.md`
- **Key Rule:** Never "correct" measured reality toward rule ideals
  - Nanchan: kept its 1:2.67 roof (gentler than Yingzao Fashi's 1:3)
  - Notre-Dame spire: keeps Viollet-le-Duc's actual **96 m total / ~30 m base** proportions; never idealized toward any ad-triangulum/Roriczer ideal
- **Workflow:** `node scripts/derive.mjs` → generates artifacts

### Layer 3: Geometry Builder
- **Input:** `artifacts/structural-spec.json`
- **Output:** React Three Fiber scene (procedurally generated, no GLB imports)
- **Key Principle:** Every component tagged `{componentId, provenance, citation}`
- **Provenance colors** (from `components/Viewer.tsx`):
  - Measured → gold (#d9a843)
  - Rule-derived → blue (#5e6ca8)
  - Reconstructed design → brown (#a3812f)
  - Conjecture → red (#b34a38) ← warning

### Layer 4: Vision Verifier (Independent Grading)
- **Runs in fresh context** (has never seen the builder's logic)
- **Geometry checks:** spire total height, base anchor level, octagonal footprint, six-part taper profile, statue count, etc.
- **Pixel checks:** renders exist, non-blank, color distribution, contour matches the PD Viollet-le-Duc "Flèche" elevation
- **Exit code:** `0` if all pass, `1` if any fail
- **Key Rule (V08, critical):** The verifier must NOT normalize toward ideals
  - If it "corrects" the spire away from 96 m total or 30 m base, it fails the contract (CRITICAL)
- **Workflow:** `npm run verify` → produces `verifier-report.json`

### Layer 5: Revision Loop
```
derive → build → render → verify → ❌ FAIL
         ↓
      Fix spec or geometry
         ↓
derive → build → render → verify → ✅ PASS
         ↓
    Freeze artifacts
```

---

## The Verifier Checks (Notre-Dame Spire Edition)

**All recomputed from `structural-spec.json` component geometry, never trusting the rule engine's own `key_dimensions`.** Full assertions + tolerances live in `docs/NOTRE_DAME_VERIFIED_CORPUS.md` §5 (V01–V14, P01–P03); the spire-relevant subset:

| Check | Assert | Why |
|-------|--------|-----|
| **V08** ⚠ critical | Spire total height = 96 m ±1%; base anchored ~30 m (accept 30–33); visible extent ≈ 66 m. **No idealization** of these sourced values | Measured-reality guard |
| **V09** | Spire is octagonal on the ~15×13 m crossing footprint; six-part profile present (tabouret · souche · fût · 2 openwork galleries · aiguille+coq); 8 faces | Taper schema from PD plate |
| **V10** | 16 copper statues = 12 apostles (4 groups of 3, staggered) + 4 evangelist symbols; apostle ≈ 3.40 m, evangelist ≈ 2.0 m; St Thomas faces inward | Statuary program |
| **V12** | Provenance audit: every component carries a valid class + non-empty source; **0 unsourced** | Provenance audit |
| **V13** | No-invention guard: per-section spire heights (unpublished) must be `rule_derived` (scaled off the PD plate) or `conjecture` — never `measured` | Honesty audit |
| **P01–P03** | Canonical views non-blank (>3% non-bg); all four provenance colors present; spire visible; contour matches Viollet-le-Duc elevation | Pixel layer |

**Each check failure routes back:** Is it a rule engine error? Or geometry builder error? → Fix and re-verify.

---

## Key Data Sources (One-Liner Each)

**The single source of truth is `docs/NOTRE_DAME_VERIFIED_CORPUS.md` — every value below traces to a cited URL there. Do not duplicate or invent.**

| Data | Source | Field |
|------|--------|-------|
| **Spire measured drawing** | Viollet-le-Duc *Dictionnaire raisonné* t.5 "Flèche" elevation+plans plate (BnF, ark `mm320202712p`; author d.1879 → PD) | taper profile, per-section heights (scaled off plate) |
| **Spire headline dims** | culture.gouv "Petite histoire de la flèche" + Friends of Notre-Dame (96 m total / ~30 m base) | total height, base anchor, weights |
| **Architectural rules** | Gothic geometric ruleset: two-centred arch (Brick Development Assoc.), ad quadratum/triangulum, Roriczer 1486 pinnacle (Archaeological Jrnl v.4, 1847, PD) | proportions, pinnacle/taper geometry |
| **PD cross-check** | Bell's Handbook NDP (Charles Hiatt, Gutenberg #60213, fully PD) | independent dimensional baseline |
| **Reference drawing (contour match)** | Viollet-le-Duc "Flèche" elevation (BnF Passerelles) | verify contour matching (P-check) |

---

## File Structure to Copy from Nanchan

```
yingzao/
├── data/nanchan-canonical.json        → adapt to notre-dame-canonical.json
├── scripts/derive.mjs                 → adapt to Notre-Dame (spire) rules
├── scripts/verify.mjs                 → adapt to Notre-Dame (spire) checks
├── components/Viewer.tsx              → reuse pattern, new component types
└── artifacts/                         → same structure
    ├── structural-spec.json
    ├── derivation-log.md
    ├── verifier-report.json
    └── preview-*.png (canonical views)
```

---

## First Run (What to Expect)

```bash
node scripts/derive.mjs        # generates structural-spec.json + log
npm run build                  # builds scene (slow, lots of geometry)
npm run dev                    # preview localhost:3000
node scripts/screenshot.mjs    # captures canonical views to PNG
npm run verify                 # grades against the V/P checks
```

**Expected outcome:** several checks FAIL on the first pass. **This is normal.** The report tells you exactly what's wrong:

```json
{
  "id": "V08",
  "assert": "spire total height = 96 m ±1%, base ~30 m",
  "pass": false,
  "measured": { "total_m": 91.4 },
  "note": "taper too short; rescale per-section heights off the PD Flèche plate"
}
```

→ Fix structural-spec.json or derive.mjs
→ Re-run `npm run verify`
→ (Repeat until all pass)

---

## Success Criteria (Same as Nanchan)

- ✅ All geometry checks pass
- ✅ All pixel checks pass (renders non-blank, colors present)
- ✅ Verifier report passes (zero critical failures)
- ✅ Zero unsourced components (V12 check)
- ✅ derivation-log.md has complete reasoning (no shortcuts)
- ✅ Can trace every dimension back to `docs/NOTRE_DAME_VERIFIED_CORPUS.md` (Viollet-le-Duc plate / Friends of Notre-Dame / culture.gouv / Bell's Handbook)

---

## Key Constraint: The Precedence Contract

**Never violate this:**

```
measured data / reconstructed_design  >>>>  historical rule  >>>>  conjecture
```

This means:
- ❌ Never override measured values with rule-derived values
- ❌ Never "correct" the building toward ideals (any generic Gothic ideal, Fashi proportions, etc.)
- ✅ Keep real deviations; annotate them as historical/design data (e.g., Viollet-le-Duc's actual spire proportions)
- ✅ Measured reality always wins

If the verifier catches you breaking this (e.g., "normalized the spire away from 96 m / 30 m"), it returns exit(1) and blocks the build. This is intentional.

---

## Why This Method Works for Notre-Dame

| Advantage | Why |
|-----------|-----|
| **Clean PD asset** | A single best public-domain measured drawing exists — the Viollet-le-Duc "Flèche" elevation+plans plate (BnF), a clean octagonal parametric taper |
| **Clear rules** | Gothic geometric rules documented (two-centred arch, ad quadratum/triangulum, Roriczer pinnacle) — the *yingzao*-style "module → elevation" story in one object |
| **Hard verification** | The PD elevation exists; the taper is geometrically checkable (contour match) |
| **Honest gaps** | Per-section spire heights are unpublished — scaled off the plate (`rule_derived`) or left `conjecture`, never invented |
| **Global impact** | The building the world watched burn (2019) and reopen (2024); provenance you can audit |

---

## How to Use These Documents

1. **`docs/NOTRE_DAME_VERIFIED_CORPUS.md`**
   - The **only** source of dimensions. Read this first. Canonical data skeleton, rule-engine strategy, V01–V14 verifier targets, rights table, gaps.
   - Every number in `data/notre-dame-canonical.json` comes from here.

2. **`docs/GOAL_NOTRE_DAME_SPIRE.md`**
   - The build brief — Definition of Done, scope (spire only), hard rules, ticket backlog ND-1…ND-32.

3. **`NOTRE_DAME_QUICKSTART.md`** (this file)
   - One-page summary. Skim before starting.
   - Keep open while running the pipeline.

> **Note on the Nanchan template:** mirror Nanchan's *pipeline/code structure* (`scripts/derive.mjs`, `scripts/verify.mjs`, `components/Viewer.tsx`). All **data** comes from the verified corpus — never from any prose dimension in the older ND methodology docs.

---

## Estimated Timeline

| Phase | Time | Effort |
|-------|------|--------|
| **Data prep** (canonical.json) | 2-3 days | Scaffold from the verified corpus; cite every source URL |
| **Rule engine** (derive.mjs) | 2-3 days | Adapt from Nanchan; implement Gothic geometry + spire taper from the PD plate |
| **Geometry builder** (scene) | 2-3 days | Reuse Nanchan pattern; new components (oak armature, lead cladding, statuary, rooster) |
| **Verification loop** (verify.mjs + iterate) | 3-4 days | Iterations of fail→debug→fix→verify |
| **Total** | **~10 days** | All-in for one person working full-time |

(With parallel team work: could compress to 5-6 days.)

---

## One More Thing: Honesty

The provenance layer is the signature feature. Every component answers:
- **Measured** (gold): "We have a cited, multiply-confirmed dimension"
- **Reconstructed design** (brown): "Viollet-le-Duc's PD drawings confirm this design intent"
- **Rule-derived** (blue): "Gothic geometric rules predict this"
- **Conjecture** (red): "We inferred it; you should be skeptical"

If you render the provenance view and it's 80% red, that's a problem — it means you didn't do your homework. If it's mostly measured + reconstructed_design + rule-derived with no unsourced conjecture, you nailed it.

This isn't about prettiness. It's about honesty. That's the whole point.

---

**Questions?** Refer back to `docs/NOTRE_DAME_VERIFIED_CORPUS.md` (data) and `docs/GOAL_NOTRE_DAME_SPIRE.md` (brief), or check how Nanchan solved similar problems in `/scripts/derive.mjs` (Yingzao rules) and `/scripts/verify.mjs` (the verifier gate).

Good luck! 🏛️
