# Merge Plan — integrate Notre-Dame into Holly's `main` (safe + uniform)

> Combine **Austin's Notre-Dame spire app** (`feat/notre-dame-methodology`) with **Holly's Nanchan app** (`origin/main`) into ONE app with a **building selector** — **without breaking or deleting anything Holly built.** (An audit is refining the per-file specifics; this is the safe strategy + the handoff `/goal`.)

## Guardrails (non-negotiable — protect Holly's work)
- Work on a **new branch off `origin/main`** (`integrate/notre-dame`); **never commit to `main` directly** — open a PR for Holly to review.
- **Never delete or overwrite a file Holly authored.** Resolve every shared-file conflict by **UNION** (keep her Nanchan behaviour **and** add Notre-Dame), preferring Holly's version for shared Nanchan logic.
- **Nanchan is the regression anchor** — verify it still builds + renders green at every step.
- **No force-push, no rebase** over Holly's history. Merge, don't squash her work away.
- If a conflict can't be cleanly unioned → **STOP and ask a human.**

## Why this is low-risk
Austin's Notre-Dame is **mostly additive** — `SpireViewer.tsx` and the `*-notre-dame.mjs` / `orchestrate.mjs` / `research.mjs` scripts are **separate files** that don't collide. Conflicts are confined to **~7 shared files**, all resolvable by addition.

## File plan
### Additive — bring in clean from `feat` (no collision)
- `components/SpireViewer.tsx`
- `scripts/orchestrate.mjs`, `research.mjs`, `derive-notre-dame.mjs`, `verify-notre-dame.mjs`, `screenshot-notre-dame.mjs`
- `data/notre-dame-canonical.json`
- `artifacts/`: `structural-spec.notre-dame.json`, `derivation-log.notre-dame.md`, `derivation-stream.notre-dame.jsonl`, `research-findings.json`, `research-log.jsonl`, `orchestrate-log.jsonl`, `run-summary.json`, `run-*.webm`, `preview-nd-*.png`, `playback/`, the failed verifier reports
- `docs/*` (goals, corpus, rubric, handoff, names) + `done.rubric.json`

### Shared — resolve by UNION (prefer Holly's base + add the selector)
| File | Resolution |
|---|---|
| `app/page.tsx` | Building **SELECTOR**: mount `Viewer.tsx` for `nanchan`, `SpireViewer.tsx` for `notre-dame`. Holly's page = base; **add** the selector + spire route. |
| `components/Viewer.tsx` | **KEEP Holly's** (her newer materials / reconstruction-mode). Austin's Viewer edits were Notre-Dame-specific → they belong in `SpireViewer.tsx`, not here. |
| `scripts/derive.mjs`, `verify.mjs`, `demo.mjs`, `screenshot.mjs` | **KEEP Holly's** (Nanchan). The spire uses the separate `*-notre-dame.mjs`. *(Optional later: unify into one `--building` script — not required for the merge.)* |
| `package.json` | **UNION** the scripts (Holly's nanchan + the `notre-dame`/`orchestrate`/`research` scripts, namespaced e.g. `derive:nd`, `verify:nd`) + **UNION** dependencies. |

## The selector (toggle between the two recreations)
Landing → pick a recreation (🟢 **Nanchan** timber temple / 🔴 **Notre-Dame** spire) → mounts the right viewer with its own spec/artifacts. Both get the full experience (build theater / playback, provenance toggle, click-to-inspect, verifier).

## Safe merge sequence
1. `git checkout -b integrate/notre-dame origin/main`
2. Bring in the **additive** Notre-Dame files (clean copy from `feat`).
3. Reconcile the **~7 shared files by addition** (table above) — never replacing Holly's logic.
4. `npm install`.
5. **Verify BOTH** end-to-end: Nanchan (Holly's full experience — reconstruction-mode materials, playback, annotations, click-inspect) **and** Notre-Dame (the spire pipeline + `SpireViewer` — build theater, provenance toggle, verifier). Both green.
6. Commit on `integrate/notre-dame`; **open a PR to `main`** with a changelog; confirm **zero Holly files deleted**.

## The `/goal` to hand the agent
```
/goal Merge the Notre-Dame spire app (branch feat/notre-dame-methodology) into Holly's Nanchan app (origin/main) as ONE app with a building SELECTOR, WITHOUT breaking or deleting anything Holly built. HARD SAFETY RULES: work on a NEW branch off origin/main named integrate/notre-dame; NEVER commit to main directly (open a PR for Holly to review); NEVER delete or overwrite a file Holly authored; resolve every shared-file conflict by UNION (keep Holly's Nanchan behaviour AND add Notre-Dame), preferring Holly's version for shared Nanchan logic; Nanchan is the regression anchor and must stay green at every step; no force-push and no rebase over Holly's history; if a conflict can't be cleanly unioned, STOP and ask a human. STEPS: (1) git checkout -b integrate/notre-dame origin/main. (2) Bring in the ADDITIVE Notre-Dame files from feat/notre-dame-methodology (they don't collide): components/SpireViewer.tsx; scripts/orchestrate.mjs, research.mjs, derive-notre-dame.mjs, verify-notre-dame.mjs, screenshot-notre-dame.mjs; data/notre-dame-canonical.json; the notre-dame artifacts (structural-spec.notre-dame.json, derivation logs + stream, research-findings, run-summary, run-*.webm, preview-nd-*, playback/, failed verifier reports); docs/* and done.rubric.json. (3) Reconcile the ~7 SHARED files by ADDITION, not replacement: app/page.tsx -> a building selector mounting components/Viewer.tsx for 'nanchan' and components/SpireViewer.tsx for 'notre-dame' (Holly's page is the base; add the selector + spire route); KEEP Holly's components/Viewer.tsx and scripts/{derive,verify,demo,screenshot}.mjs unchanged for Nanchan (the spire uses the separate *-notre-dame.mjs + SpireViewer); package.json -> UNION the scripts (Holly's nanchan + notre-dame/orchestrate/research, namespaced e.g. derive:nd / verify:nd) and UNION dependencies. (4) npm install. (5) Verify BOTH recreations end-to-end: Nanchan (Holly's full experience: reconstruction-mode materials, playback, annotations, click-inspect) AND Notre-Dame (the spire pipeline + SpireViewer: build theater, provenance toggle, click-inspect, verifier). A visitor lands, picks a recreation, and gets the full experience for whichever they pick. (6) Commit on integrate/notre-dame and open a PR to main with a clear changelog; confirm zero Holly files were deleted or overwritten. DONE: both buildings build + verify green from one app behind the selector; Nanchan behaviour unchanged; the PR is open with a changelog; nothing of Holly's deleted or overwritten.
```

*This plan + `/goal` are intentionally conservative. The running integration audit will add file-by-file diff resolutions; fold those in before executing if available.*
