# GOAL — Notre-Dame de Paris · Spire (la flèche) · Yingzao

> Brief for an autonomous **Fable 5 / dynamic-workflow** run. Execute every ticket to completion and **self-verify**. Provenance is the product: **nothing renders without a real, cited source.**
>
> Companion to the Notion board (epic **Notre-Dame de Paris — Spire (v1)**, tickets `ND-1`…`ND-28`) and the **Verifier & Acceptance Gate** reference.

---

## 0. The one-line goal

Ship an interactive 3D reconstruction of **Viollet-le-Duc's 1859 Notre-Dame spire**, derived from **public-domain drawings + Gothic geometric rules**, where **every component proves its source**, an **independent verifier gates the build**, and a **live URL responds**.

## 1. Definition of Done (machine-verifiable)

- [ ] `npm run build` (= `derive && verify && next build`) exits `0`.
- [ ] `data/notre-dame-canonical.json` exists; **every** dimension carries `{provenance, source, url, rights}`.
- [ ] **Zero unsourced components** — the G09 *source-registry* check passes (a `source` must resolve to the rights-cleared registry, not merely be non-empty).
- [ ] Deterministic verifier (geometry V-checks recomputed **from component coordinates**, + pixel checks) passes; **≥ 1 logged fail→revise→pass cycle**; failed reports kept as `verifier-report.*.failed.json`.
- [ ] **Vision-verifier sub-agent** passes in a **fresh context** (soft visual grading), merged into `verifier-report.json`.
- [ ] **V09 guard:** measured reality is never corrected toward the Gothic ideal. `npm run demo:corrupt` → verify **refuses** (exit 1) → `npm run demo:restore` → green.
- [ ] Provenance toggle works · drawing→3D reveal works · construction sequence plays · click-to-inspect shows name (FR/EN) + role + citation.
- [ ] **Build Theater** renders the reconstruction in real time — components stream in derivation order, the reasoning trace streams alongside, and the live verifier HUD ticks checks green (incl. a fail→revise→pass beat).
- [ ] **No restricted assets** used (Tallon raw scan + CNRS/De Luca data = *cite-only*; only public-domain drawings + factual numbers as assets).
- [ ] **Live URL** responds · public repo · README with source/rights table + rerun instructions.

## 2. Scope

**The spire (la flèche) ONLY.** Nave, vaults, and the lost medieval roof ("la forêt") are out of scope for v1. Flawless first, then expand.

## 3. Hard rules (inherited from the verifier — do not violate)

1. **Precedence:** `measured / reconstructed_design  >  rule_derived  >  conjecture`. A sourced value is **never** overridden by a rule.
2. **V09 (critical):** deviations are *data, not errors*. Keep the measured value, annotate it, **never normalize toward the ideal**. (Nanchan kept its 1:2.67 roof vs the Fashi 1:3; the spire keeps Viollet-le-Duc's actual proportions vs any generic Gothic ideal.)
3. **Uncertainty propagates:** a conjectural input makes every dependent component conjectural.
4. **DQ-avoidance:** unauthorized assets = disqualification. Use only public-domain drawings + factual numeric data as assets. Cite restricted sources; never ingest them.

## 4. The build loop ("check the work")

For every change:

```
node scripts/derive.mjs        # canonical + rules → structural-spec.json + derivation-log.md
node scripts/verify.mjs        # deterministic gate: geometry V-checks + pixel checks
node scripts/screenshot.mjs    # headless canonical views → artifacts/preview-*.png
# → vision-verifier sub-agent (fresh context) grades soft visual quality, merges into verifier-report.json
```

On failure: decide **rule engine vs geometry builder**, fix, re-run. **Keep every failed report.** The build is **not done** until `verify` exits 0 **and** the vision sub-agent passes. This loop is the autonomy evidence judges score.

## 5. Tickets — execute in dependency order

| Ref | Ticket | Layer | Owner | Deps | Acceptance |
|---|---|---|---|---|---|
| ND-1 | Pull & verify spire corpus ✅ | Data | Claude | — | **Done** — 94 verified findings (Tallon, CNRS/De Luca, PD Viollet drawings) + rights table |
| ND-2 | Scaffold `notre-dame-canonical.json` (spire) | Data | Claude | ND-1 | Parses; unit module = pied du roi (324.8 mm); every value `{provenance, source, url, rights}`; covers height, base square, taper, statue groups, rooster |
| ND-3 | Rights table (use / cite-only / neither) | Data | Claude | ND-1 | Each source classified; Tallon raw = cite-only, Viollet drawings = use; feeds the G09 registry |
| ND-4 | Spire rule engine in `derive.mjs` | Rules | Claude | ND-2,3 | Emits `structural-spec.json` + `derivation-log.md`; every component `{provenance, source}`; shows arithmetic; logs deviations |
| ND-14 | App structure — multi-building scene | Build | Claude | — | Spire scene reads its own spec via route/selector **without breaking Nanchan**; both load |
| ND-5 | Geometry builder — procedural R3F spire | Build | Claude | ND-4,14 | Oak armature + lead cladding + statuary + rooster from spec; **no imported meshes**; each mesh `userData {componentId, provenance, citation}`; build order = phases |
| ND-6 | Spire `verifier_targets` in `verify.mjs` (deterministic) | Verify | **Austin** | ND-4 | Recompute height, taper ratio, base square, statue count, provenance audit **from component coords** (not `key_dimensions`); V09-analog guard; report shape matches |
| ND-7 | Harden G09 → source-registry check | Verify | **Austin** | ND-3 | A component whose `source` isn't in the rights-cleared registry **fails the build** |
| ND-8 | Pixel checks P01–P03 + P08 contour | Verify | Claude | ND-5 | Views non-blank (>3% non-bg); 4 provenance colors present; P08 contour-match spire vs Viollet-le-Duc elevation |
| ND-15 | **Vision-verifier sub-agent (your Layer 3)** | Verify | **Austin** | ND-8 | Fresh-context soft grading (silhouette vs drawing, taper smoothness, statuary placement, seam readability); merges into `verifier-report.json`; honors V09; gate respects it |
| ND-19 | Measured-reality mutation guard (`demo:corrupt`/`restore`) | Verify | **Austin** | ND-6 | Idealize taper/height → verify fires CRITICAL + exit 1 → restore; idempotent-safe backups |
| ND-9 | Spire narrative (cited only) | Narrative | Team | ND-2 | 2019 fire · Viollet-le-Duc 1859 · 2024 reopening; every claim sourced |
| ND-10 | Provenance toggle + visible fail→revise→pass | UI/Demo | Claude | ND-5 | Toggle colors by evidence class; verifier report (incl. a failed→passed cycle) surfaced in UI |
| ND-11 | **Drawing → 3D interactive reveal** | UI/Demo | Claude | ND-5 | Open on Viollet's PD elevation; scroll/drag lifts strokes into the 3D flèche; hands to orbit + provenance |
| ND-16 | Construction-sequence animation | UI/Demo | Claude | ND-5 | Scrubber assembles base → mast → frame → cladding → statuary → rooster over the scene graph |
| ND-17 | Component inspection (click → FR/EN, role, citation) | UI/Demo | Claude | ND-5 | ≥ the mast, a statue group, and the rooster inspectable with source |
| ND-18 | Exploded view *(should-have)* | UI/Demo | Claude | ND-5 | Explode/reassemble toggle reveals the armature/joinery |
| ND-12 | Replace fabricated data in the 3 ND docs | Docs | Claude | ND-2 | Paris not Reims; real sources; banner removed once corrected |
| ND-20 | README + source/rights table + rerun | Docs | Team | ND-13 | Pitch, problem, method, rights table, why Fable 5, how to rerun, day-of work, demo link |
| ND-13 | Ship — build gate + live URL | Ship | Team | all | `derive && verify && next build` green; deployed URL responds; public repo |
| ND-21 | 1-min demo video storyboard | Narrative | Team | ND-13 | Shot list: reveal → provenance → `demo:corrupt` refusal → live spire |
| ND-22 | **Build Theater** — real-time reconstruction | UI/Demo | Claude | ND-5,16,28 | Press play → spire assembles component-by-component in derivation order, live; scrub/replay; no blank-then-pop |
| ND-23 | Streaming reasoning trace (the "thinking") | UI/Demo | Claude | ND-22,28 | `derivation-log` lines stream in lockstep with their components; each cites a source |
| ND-24 | Live verifier HUD — checks tick + fail→revise→pass | UI/Demo | Austin | ND-6 | Checks animate green live; staged corruption shows red CRITICAL → revise → green |
| ND-25 | Provenance bloom — colors classify live | UI/Demo | Claude | ND-22 | Per-component provenance color on placement; live measured/rule/conjecture tally |
| ND-26 | Pipeline stage rail | UI/Demo | Claude | ND-22 | Ingest→Derive→Build→Verify→Ship rail advances in sync |
| ND-27 | Live agent mode — stream a real run (SSE) | Build | Claude | ND-28 | Live pipeline streams components+log+checks to the UI in real time; graceful fallback to replay |
| ND-28 | Incremental / streaming artifact emission (enabler) | Build | Claude | ND-4 | `derive.mjs` appends components as JSONL + tailable log; SSE bridge `fs.watch`es artifacts → events. Powers the live theater |

## 6. Rubric → hackathon scoring (Impact 35 / Demo 35 / Autonomy 15 / Orchestration 15)

- **Impact (35%):** a real heritage tool that makes fidelity affordable; the building the world watched burn (2019) and reopen (2024); provenance you can audit.
- **Demo (35%):** drawing→3D reveal → provenance toggle → **fail→revise→pass** (`demo:corrupt` live refusal) → the live spire. Must hold up live.
- **Autonomy (15%):** the verifier gate + vision sub-agent catch failures **without a human**; long autonomous stretches; interventions = new information only; failed reports kept as proof.
- **Orchestration (15%):** "done" is machine-verifiable (`npm run build` + responding URL); **rerunnable** — swap the data corpus and the same pipeline reconstructs another building (already proven on Nanchan).

## 7. The `/goal` command

```
/goal Build and ship the Notre-Dame de Paris spire (la flèche) reconstruction per docs/GOAL_NOTRE_DAME_SPIRE.md. Work the backlog ND-1..ND-28 in dependency order. Derive the spire from data/notre-dame-canonical.json + public-domain Viollet-le-Duc drawings and Gothic geometric rules into artifacts/structural-spec.json (every component tagged {provenance, source, url, rights}); render it procedurally in React Three Fiber with no imported meshes; and gate on scripts/verify.mjs — the deterministic geometry + pixel checks AND a vision-verifier sub-agent run in a fresh context. Loop derive -> verify -> screenshot -> vision-verify until green; on failure route the fix to the rule engine or the geometry builder and re-run; keep every failed verifier report. DONE when: npm run build (derive && verify && next build) exits 0 with zero unsourced components (G09 source-registry passes), the provenance toggle + drawing-to-3D reveal + construction sequence + click-to-inspect + the real-time Build Theater all work, no restricted assets are used, and a deployed URL responds. Never correct measured reality toward the Gothic ideal (V09); deviations are labeled, not fixed.
```

## 8. Orchestration notes

- Hold the loop in a **dynamic workflow** (derive → build → render → verify → route revisions). `/goal` carries the completion target.
- The **vision-verifier sub-agent gates completion** and runs in an independent context — the builder may not stop until it passes.
- Give the run **persistent memory**: distill each fixed failure into a general rule (e.g. "the builders widened load-bearing arms to 11 fen" → encode the real rule, don't re-derive it).
- Keep **failed verifier reports** — a logged fail→revise→pass cycle is the autonomy evidence.
