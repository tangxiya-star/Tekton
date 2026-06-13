# Kickoff — Notre-Dame Spire (Yingzao)

The exact prompt + instructions to hand an autonomous agent to build the entire flow end-to-end. The repo is the single source of truth (`docs/GOAL_NOTRE_DAME_SPIRE.md` + `docs/NOTRE_DAME_VERIFIED_CORPUS.md`); the build does **not** depend on Notion.

## Pre-flight (do these first)

1. **Make the repo public** (the hackathon DQs private repos):
   ```bash
   gh repo edit tangxiya-star/yingzao --visibility public --accept-visibility-change-warnings
   ```
2. **(optional) Clean the working tree** so the build starts clean:
   ```bash
   git checkout -- artifacts/
   ```
3. **Fresh session on Fable 5.** Open a new Claude Code session in this repo on branch `feat/notre-dame-methodology`, set the model to **Fable 5** (`/model`). Fresh context = clean autonomy log (judges score it).

## Kick off — Option A: the `/goal` command (≤ 4000 chars)

`/goal` is capped at 4000 characters. Use this compact version — it points to the in-repo docs (which hold all the detail) and embeds only the non-negotiables. Prefix with `/goal `. **(2,883 chars.)**

```text
Goal: build the Notre-Dame de Paris spire (Viollet-le-Duc's 1859 fleche) reconstruction end-to-end and autonomously, in this repo on branch feat/notre-dame-methodology.

READ FIRST (all detail lives in the repo): docs/KICKOFF_PROMPT.md, docs/GOAL_NOTRE_DAME_SPIRE.md (brief + Definition of Done + Research-guardrails + the 8-phase flow + backlog ND-1..ND-37 with acceptance + deps), and docs/NOTRE_DAME_VERIFIED_CORPUS.md (the ONLY source of dimensions; 16 verdicts, 40 gaps). Template = the Nanchan code: scripts/derive.mjs, scripts/verify.mjs, scripts/demo.mjs, data/nanchan-canonical.json, components/Viewer.tsx. NEVER take numbers or sources from NOTRE_DAME_TECH_TEMPLATE/METHODOLOGY/QUICKSTART (structure only).

Non-negotiables: nothing renders without a real cited source; precedence measured > rule_derived > conjecture (a sourced value is never overridden by a rule); V09 - never normalize measured reality toward the ideal (CRITICAL fail); research is cite-or-gap (no source -> GAP, never invent), every measured value adversarially verified in a fresh context with >=2 independent sources; restricted data (Tallon/CNRS/blogs) is cite-only, never ingested.

Work the backlog ND-1..ND-37 in dependency order, building the 8-phase pipeline behind one command npm run goal (scripts/orchestrate.mjs), each phase gating the next: research (scripts/research.mjs, verified-replay default; emits data/notre-dame-canonical.json + artifacts/research-findings.json) -> ingest (validate provenance+source+url+rights) -> derive (Gothic rules -> artifacts/structural-spec.json; no imported meshes) -> build (procedural React Three Fiber) -> verify (scripts/verify.mjs deterministic checks recomputed from component coords + a vision sub-agent in a fresh context) -> loop (fix -> re-run to green; keep every failed report; include one scripted demo:corrupt -> verify REFUSES -> demo:restore) -> record (Playwright -> artifacts/run-*.webm) -> ship (deploy; URL 200). Also build the watchable demo surface: provenance toggle, drawing->3D reveal, construction-sequence animation, click-to-inspect, the real-time Build Theater, and deterministic playback. Scope: SPIRE ONLY (towers/nave/whole building are the documented post-v1 roadmap).

Discipline: the verifier gates completion - do NOT stop until npm run goal is green end-to-end; let it loop fail->revise->pass and keep every failed report; distill fixes into persistent memory; ask the human ONLY for new info you cannot obtain (a deploy credential).

DONE = npm run goal green end-to-end: zero unsourced components (G09 source-registry), >=1 logged fail->revise->pass, the vision sub-agent passes, the V09 guard holds (demo:corrupt refused), the demo surface works, a recorded artifacts/run-*.webm exists, and a deployed URL responds 200.

Begin by reading the three docs, then post a short plan of the first 3-4 tickets and proceed.
```

## Kick off — Option B: full kickoff message (no length limit)

If you paste as a plain message (not `/goal`), use the complete version below — same intent, fully spelled out.

```text
You are building an evidence-based 3D reconstruction, autonomously and end-to-end, for the "Yingzao" project. Repo: this checkout on branch feat/notre-dame-methodology. Your north star: the spire of Notre-Dame de Paris (Viollet-le-Duc's 1859 flèche), reconstructed so that EVERY component proves where it came from, an independent verifier gates the build, and a live URL responds. Provenance is the product: nothing renders without a real, cited source.

== READ FIRST (in this order, before writing any code) ==
1. docs/GOAL_NOTRE_DAME_SPIRE.md — the full brief: Definition of Done, hard rules, the Research-guardrails section, the 8-phase end-to-end flow, the master orchestration, and the backlog ND-1..ND-37 with acceptance criteria + dependencies.
2. docs/NOTRE_DAME_VERIFIED_CORPUS.md — the ONLY source of Notre-Dame dimensions (adversarially verified, cited: 16 verdicts, 40 gaps, the canonical skeleton, the V01–V14 verifier targets, the rights table).
3. The Nanchan implementation = your working template — mirror its structure, don't reinvent: data/nanchan-canonical.json, scripts/derive.mjs (rule engine, precedence, deviation logging), scripts/verify.mjs (the gate — V-checks recomputed from components, pixel checks, V09), scripts/demo.mjs (corrupt/restore), components/Viewer.tsx (procedural R3F + provenance toggle).

⚠️ NEVER use data from docs/NOTRE_DAME_TECH_TEMPLATE.md / METHODOLOGY_FOR_NOTRE_DAME.md / NOTRE_DAME_QUICKSTART.md as numbers — use them only for code/pipeline structure. All data comes from the verified corpus.

== HARD RULES (do not violate) ==
- Precedence: measured / reconstructed_design > rule_derived > conjecture. A sourced value is NEVER overridden by a rule.
- V09 (critical): deviations are data, not errors. Keep the measured value, annotate it, NEVER normalize toward the Gothic ideal. A rule that overrides a sourced value is a CRITICAL failure.
- Uncertainty propagates: a conjectural input makes every dependent component conjectural.
- Rights / DQ-avoidance: only public-domain drawings + factual numeric data may be ingested as assets. Restricted data (Tallon raw scan, CNRS/AGP, self-published blogs) is CITE-ONLY, never ingested.
- Research anti-hallucination (Phase 0 / --mode=live): cite-or-gap (no resolvable source URL → it's a GAP, never a value); adversarial verification in a fresh context (a second agent tries to REFUTE every measured value); >=2 independent sources for any "measured" value; no source-laundering. Re-checked at ingest, at the G09 source-registry, and by the verifier's V12/V13 no-invention guard.

== THE WORK ==
Work the backlog ND-1..ND-37 in dependency order (critical path: research/canonical → derive → render → verify). Build the 8-phase pipeline behind one command, npm run goal (scripts/orchestrate.mjs), each phase gating the next:
0. research — scripts/research.mjs (verified-replay by default; --mode=live optional with auto-fallback) reads the corpus as the answer-key and EMITS data/notre-dame-canonical.json (every node {provenance, source, url, rights}) + artifacts/research-findings.json (16 verdicts, 40 gaps) + a tailable research-log. Gate: corpus cited; 0 nodes missing provenance.
1. ingest — validate the canonical JSON; GAP fields never filled; every source resolves to the rights-cleared registry. Gate: schema valid, 0 fabricated/unsourced nodes.
2. derive — scripts/derive.mjs applies the Gothic ruleset → artifacts/structural-spec.json + derivation-log (shows its arithmetic; logs deviations). Every component tagged {provenance, source, url, rights}; no imported meshes. Gate: no unsourced component.
3. build — procedural React Three Fiber scene from the spec. Gate: spire renders non-blank.
4. verify — scripts/verify.mjs recomputes the V-checks + pixel checks FROM component coordinates (never spec.key_dimensions), THEN a vision-verifier sub-agent grades soft visual quality in a FRESH context, merged into verifier-report.json. Gate: deterministic verify exit 0 AND vision pass AND done.rubric.json self-grades green.
5. loop — on red, classify rule-engine vs geometry-builder from the failing check, apply the scoped fix, re-run derive→verify until green; keep EVERY verifier-report.*.failed.json. Include exactly one scripted demo:corrupt → verify REFUSES (V09, exit 1) → demo:restore → green. Gate: >=1 logged fail→revise→pass.
6. record — Playwright recordVideo captures the full run (research → build → verify → corrupt-refusal → live spire) → committed artifacts/run-*.webm.
7. ship — deploy; assert the live URL returns HTTP 200; write run-summary.json.

Also build the watchable demo surface as you go: provenance toggle, drawing→3D reveal, construction-sequence animation, click-to-inspect (FR/EN name + role + citation), the real-time Build Theater (components stream in derivation order with the reasoning trace + live verifier HUD), and the deterministic playback (generate-playback-states.mjs + PlaybackControls).

Scope: the SPIRE ONLY for v1 (towers/facade → nave/vaults → whole building are the documented post-v1 roadmap — do not build them now).

== WORKING DISCIPLINE ==
- The verifier gates completion. You may NOT stop until npm run goal completes green end-to-end. Run derive→verify→screenshot→vision-verify in a loop; on failure, fix and re-run — don't ask a human to find what a check can catch.
- Keep every failed verifier report — a logged fail→revise→pass cycle is the autonomy evidence; do not delete it.
- Use persistent memory: when you fix a failure, distill it into a general rule (e.g. "the builders widened load-bearing arms to 11 fen") instead of re-deriving it.
- Stop to ask the human ONLY for genuinely new information you cannot obtain (a deploy credential / API key). Everything else, decide and proceed.

== OPTIONAL: live status (best-effort, never block on it) ==
If — and only if — a Notion MCP is connected, mark each ticket In Progress when you start it and Done when its acceptance passes, on the board here:
https://app.notion.com/p/37e7dadecb438143aef2e2c9d1e78ee5  (Tickets DB inside the Notre-Dame epic)
If Notion is not available, skip this silently and continue. NEVER pause, retry, or fail the build because of Notion — the repo (docs/GOAL_NOTRE_DAME_SPIRE.md) is the source of truth.

== DONE (machine-verifiable) ==
npm run goal completes green end-to-end with:
- data/notre-dame-canonical.json present; every dimension {provenance, source, url, rights}.
- Zero unsourced components (G09 source-registry passes).
- Deterministic verifier passes (V-checks from component coords + pixel checks); >=1 logged fail→revise→pass; failed reports kept.
- Vision-verifier sub-agent passes in a fresh context.
- V09 guard holds: demo:corrupt → verify refuses (exit 1) → demo:restore → green.
- Provenance toggle + drawing→3D reveal + construction sequence + click-to-inspect + the real-time Build Theater all work.
- A recorded artifacts/run-*.webm exists.
- No restricted assets ingested; live URL responds 200; README with source/rights table + rerun instructions.

Begin by reading the three sources above, then post a short plan of the first 3–4 tickets you'll execute, and proceed.
```

## While it runs
- **Intervene minimally** — only with *new information* (deploy creds, an API key). Course-corrections hurt the autonomy score; new-info doesn't.
- **Let the verifier gate self-check** — let it loop fail→revise→pass; don't fix what a check can catch. Keep the failed reports.
- It will need a **deploy credential** at the ship phase (e.g. Vercel login) — the one thing it can't do alone.

## When it's green
- You get a **live URL** + a recorded `artifacts/run-*.webm`.
- **Submit:** public repo · live URL · the brief (`docs/GOAL_NOTRE_DAME_SPIRE.md`) · `done.rubric.json` · the session log · the 1-minute video.
