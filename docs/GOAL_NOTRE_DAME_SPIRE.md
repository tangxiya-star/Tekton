# GOAL — Notre-Dame de Paris · Spire (la flèche) · Yingzao

> Brief for an autonomous **Fable 5 / dynamic-workflow** run. Execute every ticket to completion and **self-verify**. Provenance is the product: **nothing renders without a real, cited source.**
>
> Companion to the Notion board (epic **Notre-Dame de Paris — Spire (v1)**, tickets `ND-1`…`ND-37`) and the **Verifier & Acceptance Gate** reference.

---

## Required reading (read before writing any code)

Read these first, in order — **do not start `ND-2` until you've read the corpus and studied the Nanchan implementation:**

1. **`docs/NOTRE_DAME_VERIFIED_CORPUS.md`** — the **only** source of Notre-Dame dimensions (adversarially verified + cited). Contains the canonical data skeleton, the rule-engine strategy, the V01–V14 verifier targets, the rights table, the 16 verdicts, and 40 known gaps. **Every number in `data/notre-dame-canonical.json` comes from here.**
2. **The Nanchan implementation = your working template.** Mirror its structure, don't reinvent: `data/nanchan-canonical.json`, `scripts/derive.mjs` (rule engine, precedence, deviation logging), `scripts/verify.mjs` (the gate — V-checks recomputed from components, P-checks, V09), `scripts/demo.mjs` (corrupt/restore), `components/Viewer.tsx` (procedural R3F + provenance toggle).
3. **The Verifier & Acceptance Gate** (Notion) / PRD §7 — the gate philosophy to preserve.
4. **The PRD** — the why, the UX, the rights discipline.

> ⚠️ **CRITICAL — the fabricated-data trap.** `docs/NOTRE_DAME_TECH_TEMPLATE.md`, `METHODOLOGY_FOR_NOTRE_DAME.md`, and `NOTRE_DAME_QUICKSTART.md` contain **fabricated data** — they describe Notre-Dame de *Reims* and cite a non-existent "Nohesive 2019" survey. Use them **only** for pipeline/code structure. **Never copy a dimension or a source from them.** All data comes from the verified corpus (#1); fixing those docs is ticket ND-12.

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

## Research guardrails (anti-hallucination) — for the research agents (Phase 0 / `--mode=live`)

The anti-hallucination thesis IS the product (PRD §3: *"nothing renders without a source; what can't cite, shows red"*). The build side enforces it via the verifier (G09 source-registry, V12/V13 no-invention guard, ingest validation). These rules extend the **same discipline to the research side** so data can't be fabricated at the source:

1. **Cite-or-gap.** Every dimensional claim must carry a **real, resolvable source URL**. No source → it is a **GAP**, never a value. The verified corpus ships **40 explicit gaps** as the model — emulate it; never fill a gap with a guess.
2. **Adversarial verification (fresh context).** Every candidate `measured` / `reconstructed_design` value is checked by a **second agent in a fresh context whose job is to REFUTE it**. Only independently corroborated claims survive as measured; the rest become `conjecture` or are dropped. (This produced the corpus's 16 verdicts, including the 35 m→43 m correction.)
3. **≥ 2 independent sources for "measured."** A single-source number is `cited-uncertain` at best. The *most dangerous values are the most precise-looking ones* — e.g. the blog's 1.948 m pier Ø / "148 pied-du-roi," falsely attributed to a Tallon/Bork laser scan. Require corroboration; default to gap.
4. **Rights gate.** Every source is classified **use / cite-only / neither**. Restricted data (Tallon raw scan, CNRS/AGP, self-published blogs) is **cite-only — never ingested as a value.** Feeds the G09 registry.
5. **No source-laundering.** A value may never be re-attributed to a more authoritative source than where it actually came from. Provenance traces to the real origin.
6. **Defense in depth — even if a research agent slips, the build refuses to ship it:** ingest validation (every node needs provenance + source + url + rights), G09 source-registry (source must resolve to the rights-cleared list), and the verifier's V12/V13 no-invention guard each re-check independently. A fabricated value cannot reach the render.

## 4. The build loop ("check the work")

For every change:

```
node scripts/derive.mjs        # canonical + rules → structural-spec.json + derivation-log.md
node scripts/verify.mjs        # deterministic gate: geometry V-checks + pixel checks
node scripts/screenshot.mjs    # headless canonical views → artifacts/preview-*.png
# → vision-verifier sub-agent (fresh context) grades soft visual quality, merges into verifier-report.json
```

On failure: decide **rule engine vs geometry builder**, fix, re-run. **Keep every failed report.** The build is **not done** until `verify` exits 0 **and** the vision sub-agent passes. This loop is the autonomy evidence judges score.

## End-to-end flow (research → ship)

The demo runs as **eight stages grouped into six watchable phases**, driven by a single command (`npm run goal`). Every phase prints a banner, appends JSONL events the UI tails, and **gates** the next phase — reaching a later phase is impossible unless the prior gate is green. A deterministic `--replay` path mirrors the same sequence against frozen artifacts so a timed live demo never blocks on the network or API latency.

| Phase | Stage(s) | What runs | Gate to advance | How it's watchable |
|---|---|---|---|---|
| **0 · Research / Ingest** | `research` → `ingest` | `scripts/research.mjs` (re)produces the cited corpus and emits `data/notre-dame-canonical.json` (every node `{provenance, source, url, rights}`) + `artifacts/research-findings.json` (16 verdicts, 40 gaps) | Corpus written with cited findings **AND** canonical JSON parses with **0 nodes missing provenance/source** | Ingest stage of the ND-26 rail streams per-query "searching", per-claim asserted→verifying→**verdict** with source URL, a live confirmed/refuted/uncertain tally, and the research fail→revise→pass beat (35 m roof REFUTED→43 m; 297 steps REFUTED→dropped; chartres blog rights-DQ) |
| **1 · Derive** | `derive` | `node scripts/derive.mjs --building notre-dame` reads the canonical JSON, applies the Gothic ruleset, emits `artifacts/structural-spec.notre-dame.json` + `derivation-log` | `structural-spec` written; the `comp()` audit threw nothing (no unsourced component) | `derive.mjs` appends each component as JSONL in derivation order; the rail's Derive stage + the provenance bloom + streaming reasoning trace (ND-23/25) advance component-by-component — no blank-then-pop |
| **2 · Build** | `build` | `next build` of the R3F scene; the Viewer loads the spire spec via `?building=notre-dame` | `next build` exits 0; the spire scene renders non-blank | Build Theater (ND-22) assembles the spire live in derivation order, scrub/replay from the playback backbone (state-000…N.json) |
| **3 · Verify** | `verify` → `vision` | `node scripts/verify.mjs --building notre-dame` recomputes V01–V14 + P01–P03 **from component coords** (never `key_dimensions`); then a vision sub-agent grades in a **fresh context** and merges a soft grade into `verifier-report.json` | Deterministic verify **exit 0** AND vision pass AND `done.rubric.json` self-grades green | Live verifier HUD (ND-24) ticks checks green; the V08 CRITICAL guard is visible; a red→revise→green beat is staged |
| **4 · Loop** (autonomy spine) | `loop` | On verify red, the driver classifies **rule-engine vs geometry-builder** from the failing check id, applies/re-derives the scoped fix, re-runs Derive→Verify until green or max-iters; **keeps every** `verifier-report.*.failed.json`. Includes exactly one scripted `demo:corrupt` → verify **REFUSES** (V08 CRITICAL, exit 1) → `demo:restore` → green | ≥1 genuine logged fail→revise→pass cycle persisted; loop terminates only on verify exit 0 + vision pass | The HUD shows the live red-CRITICAL → revise → green beat; this loop is the autonomy evidence judges score |
| **5 · Record → Ship** | `record` → `ship` | `record`: Playwright `recordVideo` captures the Build Theater + tailed SSE log into a committed `artifacts/run-*.webm` (ffmpeg, no human screen-capture). `ship`: deploy `out/`, assert the live URL returns HTTP 200 and the build gate is green | Video artifact written; deployed URL **200**; build gate green; `run-summary.json` records all gate verdicts | The recording IS the watchable artifact — it opens on the research segment and runs research→derive→build→verify→corrupt-refusal→live spire end to end |

**Cross-phase gates that make it honest:** Phase 1 cannot start until ingest produces a provenance-complete canonical JSON (so `derive.mjs` never reads the fabricated Reims/"Nohesive" docs — ND-12 is a hard precondition). Phase 3's G09 source-registry check fails the build if any component's `source` doesn't resolve to the rights-cleared registry (Tallon/CNRS/AGP/chartres-blog = rejected). Phase 5 cannot ship unless Phase 4 left the rubric green.

### Research question — resolved: **run-live-with-the-persisted-corpus-as-answer-key (deterministic "verified replay")**

The three options and why the answer is clear:

- **Blind live re-run** of real fan-out web search is **non-deterministic, multi-minute, network- and rights-dependent** — fatal for a timed live demo with no fallback. Rejected as the default.
- **Pure recording / playback** of a frozen transcript is safe but shows **nothing autonomous** — there is no live agent behavior to score. Rejected as the only mode.
- **Cache-as-answer-key (verified replay)** is the only option that is simultaneously **watchable, deterministic, rerunnable, and honestly autonomous.**

**Recommendation:** implement `scripts/research.mjs` mirroring `derive.mjs` (single deterministic entry, emits artifacts + a tailable JSONL log). **Default = verified replay** (no network): it reads `docs/NOTRE_DAME_VERIFIED_CORPUS.md` as the answer-key and emits `data/notre-dame-canonical.json` + `artifacts/research-findings.json` (16 verdicts + 40 gaps), **byte-stable across runs**, streaming the verdict-by-verdict reveal into the Ingest rail. Expose a real `--mode=live` flag that invokes the `deep-research` fan-out and writes back a fresh corpus, with **automatic fallback to replay** on any failure (network/rights/timeout). This makes research the first link of the build chain (`research → ingest → derive → verify → …`) so the hand-off becomes one unbroken automated pipe, the frozen corpus stays the source of truth, and the audience still watches research *happen* — without betting the live demo on the network.

## Master orchestration — one runnable end-to-end driver

**Single entry point:** `npm run goal` (alias `npm run orchestrate`) → `node scripts/orchestrate.mjs`.
It is the only thing a judge runs to execute the **whole** flow. Two reinforcing framings: (A) a **deterministic npm pipeline** (`--replay`) for the always-green demo fallback, and (B) a **/goal-driven dynamic workflow** for the autonomous live run. The driver reads `done.rubric.json` as the single source of "done" and writes `artifacts/run-summary.json {phases, durations, gate results, verdict}`.

```jsonc
// scripts/orchestrate.mjs — dynamic-workflow outline (each phase: banner → JSONL event → GATE)
[
  { "phase": "1 RESEARCH", "does": "node scripts/research.mjs (replay default; --mode=live w/ auto-fallback). Emits data/notre-dame-canonical.json + artifacts/research-findings.json + tailable research-log",
    "gate": "corpus present with cited findings; canonical JSON parses; 0 nodes missing {provenance,source,url,rights}" },
  { "phase": "2 INGEST", "does": "validate + register: every node → rights-cleared source-registry; GAP fields marked, never invented",
    "gate": "schema-valid; 0 nodes traceable to fabricated Reims/Nohesive docs (ND-12 precondition)" },
  { "phase": "3 DERIVE", "does": "node scripts/derive.mjs --building notre-dame → structural-spec.notre-dame.json + derivation-log (JSONL streamed)",
    "gate": "spec written; comp() audit threw nothing (no unsourced component)" },
  { "phase": "4 BUILD", "does": "next build of the R3F scene; Viewer routes the spire spec via ?building=notre-dame (Nanchan stays green)",
    "gate": "next build exits 0; spire view non-blank" },
  { "phase": "5 VERIFY", "does": "node scripts/verify.mjs --building notre-dame (V01-V14 + P01-P03 from component coords) → screenshot → vision sub-agent (fresh context) merged into verifier-report.json",
    "gate": "deterministic verify exit 0 AND vision pass AND done.rubric.json self-grades green" },
  { "phase": "6 LOOP", "does": "if VERIFY red: classify rule-engine-vs-geometry-builder from failing check id, apply scoped fix, re-run 3→5 up to max-iters; keep every *.failed.json. Includes ONE scripted demo:corrupt → verify REFUSES (V08 CRITICAL, exit 1) → demo:restore → green",
    "gate": "≥1 logged fail→revise→pass cycle persisted; terminates only on verify exit 0 + vision pass" },
  { "phase": "7 RECORD", "does": "Playwright recordVideo captures the Build Theater + tailed SSE log → artifacts/run-*.webm (ffmpeg; no human screen-capture)",
    "gate": "video artifact written and non-empty" },
  { "phase": "8 SHIP", "does": "deploy out/, then assert live URL HTTP 200 and build gate green; write run-summary.json",
    "gate": "URL 200 AND build green — otherwise the run fails with the failing phase named" }
]
```

**Wiring (package.json):**
```jsonc
"scripts": {
  "goal":        "node scripts/orchestrate.mjs",
  "orchestrate": "node scripts/orchestrate.mjs",
  "research":    "node scripts/research.mjs",
  "ingest":      "node scripts/orchestrate.mjs --only ingest",
  "build":       "node scripts/derive.mjs --building notre-dame && node scripts/verify.mjs --building notre-dame && next build"
}
```

**Rules that make it real, not theater:**
- **Gated, not linear.** Today `npm run build` is a one-shot `derive && verify && next build` (3 of 8 stages, silent). The orchestrator wraps — does not replace — that spine and **consumes verify's exit code** to drive the LOOP. A non-zero stage exits the run with the failing phase named.
- **Impossible to skip the gate.** Reaching SHIP requires verify exit 0 + vision pass + every required `done.rubric.json` item green. The LOOP is the centerpiece and the autonomy evidence.
- **Live by default, deterministic on demand.** Each phase appends JSONL events; an `/api` SSE route `fs.watch`es the artifacts and advances the ND-26 rail live. `--replay` runs the identical sequence against frozen artifacts (skips the network research with a "using verified corpus" banner) so the demo never blocks.
- **Rerunnable tomorrow.** Swap the corpus → the same pipeline reconstructs another building (already proven on Nanchan, which stays green as the regression anchor). Ship this as the saved workflow so judges can rerun it.

## 5. Tickets — execute in dependency order

| Ref | Ticket | Layer | Owner | Deps | Acceptance |
|---|---|---|---|---|---|
| ND-1 | Pull & verify spire corpus ✅ | Data | Claude | — | **Done** — 94 verified findings → committed to `docs/NOTRE_DAME_VERIFIED_CORPUS.md` (16 verdicts, 40 gaps) |
| ND-2 | Scaffold `notre-dame-canonical.json` (spire) | Data | Claude | ND-1 | **Source every value from `docs/NOTRE_DAME_VERIFIED_CORPUS.md`**; unit module = pied du roi (324.8 mm); `{provenance, source, url, rights}`; height, base square, taper, statue groups, rooster; mark unsourced fields as gaps, never invent |
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
| ND-29 | Live Claude Code session stream (real agent thinking) | UI/Demo | Claude | ND-28 | `claude -p --output-format stream-json` / transcript tail / hook → SSE → live reasoning + tool-call feed from a real run |
| ND-30 | `done.rubric.json` — machine-gradable rubric | Verify | Austin | — | Agent/verifier self-grades "done" against it (mirrors the DoD); the orchestration artifact |
| ND-31 | Saved demo workflow / one-key live run | Ship | Team | ND-22,24 | One command drives the full live demo (streamed build + `demo:corrupt`→restore beat); deterministic replay fallback |
| ND-32 | **Playback System** — pre-generated state replay | UI/Demo | Claude | ND-5 | `generate-playback-states.mjs` emits `state-000…N.json` (progressive accumulation by phase); `PlaybackControls` (slider + play/pause/reset + 0.25×–4× + phase label); Viewer `playbackMode`. The deterministic backbone of the Build Theater |
| ND-33 | **Master orchestrator** `scripts/orchestrate.mjs` + `npm run goal` | Ship | Austin | all | One command runs all 8 phases gated (research→ingest→derive→build→verify→loop→record→ship); each gates the next; writes `run-summary.json`. Absorbs ND-31 |
| ND-34 | Loop-until-green driver (fail→route→revise→pass) | Verify | Austin | ND-33 | Consumes verify exit code; classifies rule-engine vs geometry fix; re-runs to green or max-iters; keeps every `*.failed.json`; one scripted `demo:corrupt`→refuse→restore beat |
| ND-35 | **Runnable research** `scripts/research.mjs` (replay-default, `--mode=live`) | Data | Claude | — | Emits `data/notre-dame-canonical.json` + `artifacts/research-findings.json` (16 verdicts, 40 gaps) + tailable log; reads the corpus as answer-key; byte-stable; `--mode=live` runs deep-research w/ auto-fallback. Makes research→derive one pipe (automates ND-2) |
| ND-36 | Ingest validation: corpus → canonical JSON, provenance/rights gate | Data | Claude | ND-35 | Validates every node has provenance+source+url+rights; GAP fields never filled; every source resolves to the rights-cleared registry; hard-fails on a fabricated/unsourced value |
| ND-37 | Record + ship: capture the full run to video + assert live URL | Ship | Team | ND-33 | Playwright `recordVideo` captures the end-to-end run → committed `artifacts/run-*.webm` (ffmpeg, no human capture); asserts deployed URL HTTP 200 + build gate green |

## 6. Rubric → hackathon scoring (Impact 35 / Demo 35 / Autonomy 15 / Orchestration 15)

- **Impact (35%):** a real heritage tool that makes fidelity affordable; the building the world watched burn (2019) and reopen (2024); provenance you can audit.
- **Demo (35%):** drawing→3D reveal → provenance toggle → **fail→revise→pass** (`demo:corrupt` live refusal) → the live spire. Must hold up live.
- **Autonomy (15%):** the verifier gate + vision sub-agent catch failures **without a human**; long autonomous stretches; interventions = new information only; failed reports kept as proof.
- **Orchestration (15%):** "done" is machine-verifiable (`npm run build` + responding URL); **rerunnable** — swap the data corpus and the same pipeline reconstructs another building (already proven on Nanchan).

## 7. The `/goal` command

```
/goal Build and ship the Notre-Dame de Paris spire (la flèche) reconstruction per docs/GOAL_NOTRE_DAME_SPIRE.md. First read that brief + docs/NOTRE_DAME_VERIFIED_CORPUS.md (the ONLY source of dimensions) and study the Nanchan implementation (scripts/derive.mjs, scripts/verify.mjs, components/Viewer.tsx, data/nanchan-canonical.json) as your template; NEVER use data from the fabricated Reims/Nohesive docs. Work the backlog ND-1..ND-37 in dependency order. Derive the spire from data/notre-dame-canonical.json + public-domain Viollet-le-Duc drawings and Gothic geometric rules into artifacts/structural-spec.json (every component tagged {provenance, source, url, rights}); render it procedurally in React Three Fiber with no imported meshes; and gate on scripts/verify.mjs — the deterministic geometry + pixel checks AND a vision-verifier sub-agent run in a fresh context. Loop derive -> verify -> screenshot -> vision-verify until green; on failure route the fix to the rule engine or the geometry builder and re-run; keep every failed verifier report. DONE when: npm run build (derive && verify && next build) exits 0 with zero unsourced components (G09 source-registry passes), the provenance toggle + drawing-to-3D reveal + construction sequence + click-to-inspect + the real-time Build Theater all work, no restricted assets are used, and a deployed URL responds. Never correct measured reality toward the Gothic ideal (V09); deviations are labeled, not fixed.
```

## 8. Orchestration notes

- Hold the loop in a **dynamic workflow** (derive → build → render → verify → route revisions). `/goal` carries the completion target.
- The **vision-verifier sub-agent gates completion** and runs in an independent context — the builder may not stop until it passes.
- Give the run **persistent memory**: distill each fixed failure into a general rule (e.g. "the builders widened load-bearing arms to 11 fen" → encode the real rule, don't re-derive it).
- Keep **failed verifier reports** — a logged fail→revise→pass cycle is the autonomy evidence.
