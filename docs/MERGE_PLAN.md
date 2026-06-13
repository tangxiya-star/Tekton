# Merge Plan — integrate Notre-Dame into Holly's `main` (safe + uniform)

> Combine **Austin's spire** (`feat/notre-dame-methodology`) + **Holly's Nanchan** (`origin/main`) into ONE app with a building selector, **without breaking or deleting anything Holly built.** Refined by the integration audit (5 agents).

## ⚠️ #1 risk the audit caught — `feat` DELETED 4 of Holly's files
`feat` dropped **`components/AnnotationPanel.tsx`**, **`components/ClickHandler.tsx`**, **`styles/annotation.css`**, **`scripts/add-annotations.mjs`** (and the `annotation.css` import in `app/layout.tsx`). **The merge MUST restore all of these from `origin/main`.** This is the exact "don't delete Holly's work" hazard — now explicit and handled (INT-02).

## Recommended direction
Merge **`origin/main` → `feat`** on a fresh branch **`feat/integrate-dual-building`** (cut from `feat`); resolve there; **PR back to `main`** (Holly's history stays the trunk). Why: the branches diverged **both ways** (`feat` ≈19 ahead, ≈23 behind); only **two files truly conflict**; merging main→feat resolves them **once** with the ND scaffold already assembled, vs replaying 19 ND commits onto main (which re-conflicts repeatedly).

## Good news — the selector already exists
`feat` already has **`BuildingRouter`** (`app/page.tsx` reads `?building` → `SpireViewer` default / `Viewer` for `nanchan`), and `derive.mjs`/`verify.mjs` are already **`--building` dispatchers** that keep Nanchan's engine **byte-for-byte**. So this is *reconcile*, not rebuild. INT-03 just adds a visible toggle (AppShell) on top.

## The only 2 true conflicts
| File | Resolution |
|---|---|
| **`components/Viewer.tsx`** | **Take `origin/main`'s FULL version** as the Nanchan base (FirstPerson controller, PlaybackControls/AnnotationPanel/ClickHandler wiring, the 现状/复原/出处 3-mode tint, recon white walls). Cherry-pick **only** `feat`'s provenance-material delta (`meshBasicMaterial {toneMapped:false}` in provenance mode, for the P03 histogram). **Never** take `feat`'s stripped Viewer. Also remove `main`'s pre-existing **duplicate `<ClickHandler>`**. |
| **`package.json`** | Hand-merge into **namespaced** scripts: `derive:nanchan` / `derive:nd`, `verify:nanchan` / `verify:nd`, `screenshot:nanchan` / `screenshot:nd`; keep `feat`'s `goal`/`orchestrate`/`research`; **restore `add-annotations`** into the Nanchan derive chain; `build` runs **both** buildings. Union dependencies. |

## Everything else (no real conflict)
- `app/page.tsx` → take `feat` (the `BuildingRouter` routing swap).
- `scripts/derive.mjs`, `verify.mjs`, `demo.mjs` → take `feat` (`--building` dispatchers; Nanchan preserved byte-for-byte; `verify.mjs` also carries a genuine Nanchan pixel-check bugfix — nearest-palette-colour, fixes conjecture↔reconstructed aliasing).
- `scripts/screenshot.mjs` → **identical on both branches**, no action.
- All ND files (`SpireViewer`, `StageRail`, `DrawingReveal`, `BuildingRouter`, `orchestrate`/`research`/`*-notre-dame.mjs`, `data/notre-dame-canonical.json`, the `*.notre-dame.*` artifacts, ND docs) → **additive, come in clean.**

## Safe merge sequence
1. `git checkout -b feat/integrate-dual-building feat/notre-dame-methodology`
2. `git merge origin/main` → conflicts should be **only** `components/Viewer.tsx` + `package.json`.
3. Resolve `Viewer.tsx` (main's full + feat's prov delta; drop duplicate ClickHandler) and `package.json` (namespaced; restore add-annotations; both-buildings `build`).
4. **Restore Holly's 4 deleted files** + the `layout.tsx` annotation.css import.
5. Namespace verifier reports (`verifier-report.nanchan.json` alongside `verifier-report.notre-dame.json`); point each viewer's HUD at its own.
6. Add `components/AppShell.tsx` — a top-center segmented toggle (南禅寺 Nanchan | Notre-Dame).
7. `npm install`; `npm run build` (both buildings); **verify BOTH green end-to-end** (Nanchan: materials/playback/annotations/click-inspect; Notre-Dame: theater/provenance/verifier).
8. **PR to `main`** with a changelog; confirm **zero Holly files deleted/overwritten**; Nanchan behaviour unchanged.

## Guardrails (non-negotiable)
Restore Holly's 4 deleted files · take Holly's full `Viewer.tsx` as the Nanchan base · Nanchan stays green (regression anchor) · branch + PR only, no force-push, no rebase over Holly's history · if a conflict can't be cleanly resolved, STOP and ask.

## Integration tickets
| # | Ticket | Owner |
|---|---|---|
| INT-01 | Cut `feat/integrate-dual-building`; merge `origin/main`; resolve `Viewer.tsx` + `package.json` | Austin |
| INT-02 | **Restore Holly's 4 deleted Nanchan files** (+ layout import) | Holly |
| INT-03 | `AppShell` selector toggle + reactive `BuildingRouter` | Austin |
| INT-04 | Unify playback on Holly's fetch model, `--building`-aware | Holly |
| INT-05 | Extract shared viewer primitives → `components/viewer-shared/` | Austin |
| INT-06 | Parameterize `orchestrate`/`research` by `--building`; fix stale rubric checkers | Austin |
| INT-07 | Namespace verifier reports per building; point each HUD at its own | Holly |
| INT-08 | Both-buildings build gate + green verification + manual full-experience pass | Austin |
| INT-09 | Reclassify `enhance-puzuo` provenance (`reference_enhanced` is outside the 4-class taxonomy) | Holly |
| INT-10 | Generalize `DrawingReveal`/`StageRail` to be building-aware (optional) | Austin |

## The `/goal` to hand the agent
```
/goal Integrate Austin's Notre-Dame spire (branch feat/notre-dame-methodology) with Holly's Nanchan app (origin/main) into ONE app with a building selector, WITHOUT breaking or deleting anything Holly built. Follow docs/MERGE_PLAN.md. HARD SAFETY RULES: (a) feat DELETED four of Holly's files - you MUST restore components/AnnotationPanel.tsx, components/ClickHandler.tsx, styles/annotation.css, scripts/add-annotations.mjs from origin/main and re-add the annotation.css import in app/layout.tsx; (b) for components/Viewer.tsx take origin/main's FULL version as the Nanchan base (FirstPerson controller, PlaybackControls/AnnotationPanel/ClickHandler wiring, the 现状/复原/出处 3-mode tint, recon white walls) and cherry-pick ONLY feat's provenance-material delta (meshBasicMaterial toneMapped:false in provenance mode); NEVER take feat's stripped Viewer; also remove main's duplicate <ClickHandler>; (c) Nanchan is the regression anchor and must stay green; (d) branch + PR only, never commit to main directly, no force-push, no rebase over Holly's history; if a conflict can't be cleanly resolved, STOP and ask. STEPS: (1) git checkout -b feat/integrate-dual-building feat/notre-dame-methodology; (2) git merge origin/main - conflicts should be ONLY components/Viewer.tsx and package.json; (3) resolve Viewer.tsx per rule (b); (4) hand-merge package.json into namespaced scripts (derive:nanchan = derive.mjs; derive:nd = derive.mjs --building notre-dame; verify:nanchan/verify:nd analogous; screenshot:nanchan = screenshot.mjs; screenshot:nd = screenshot-notre-dame.mjs; keep feat's goal/orchestrate/research; RESTORE add-annotations into the Nanchan derive chain; build = 'derive:nanchan && node scripts/add-annotations.mjs && playback:nanchan && verify:nanchan && derive:nd && verify:nd && next build'); union dependencies; (5) restore Holly's 4 deleted files per rule (a); (6) namespace verifier reports (Nanchan also writes artifacts/verifier-report.nanchan.json; ND keeps verifier-report.notre-dame.json) and point each viewer's HUD at its own; (7) add components/AppShell.tsx - a fixed top-center segmented toggle (Nanchan | Notre-Dame) that sets ?building= and remounts the chosen viewer; (8) npm install; (9) npm run build and verify BOTH buildings green end-to-end: Nanchan (reconstruction-mode materials, playback, annotations, click-inspect) AND Notre-Dame (build theater, provenance toggle, verifier); a visitor lands, toggles between the two recreations, and gets the full experience for each; (10) open a PR to main with a changelog listing every changed file and explicitly confirming zero Holly files were deleted or overwritten. DONE: both buildings build + verify green from one app behind the selector toggle; Holly's 4 files restored; Holly's Viewer.tsx preserved (only the prov-material delta added); Nanchan behaviour unchanged; PR open; nothing of Holly's deleted.
```
