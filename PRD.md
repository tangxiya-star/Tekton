# PRD: Yingzao 营造

*Working title, from《营造法式》(Yingzao Fashi), the 1103 treatise that encodes how Tang–Song timber buildings were made.*

## 1. One-Line Punch

**Yingzao is an evidence-based reconstruction engine: Fable 5 rebuilds Tang dynasty timber architecture in 3D from survey data and 900-year-old construction rules — and every component can prove where it came from.**

## 2. Product Summary

China's surviving Tang wooden architecture consists of four buildings, all in Shanxi, all one fire away from existing only in drawings. Meanwhile, China's reconstruction industry routinely produces "historical" buildings that are scenography: Qing-style paint on Tang-style frames, concrete under glazed tile, eras blended freely — because getting it *right* (checking the Yingzao Fashi, cross-referencing survey reports, expert review) is slow and expensive, so projects settle for *looks old* instead.

Yingzao makes "right" cheaper than "looks like." A Fable 5 pipeline ingests:

1. **Measured survey data** (factual dimensions from published reports — column grid, bay widths, timber sections)
2. **The Yingzao Fashi ruleset** (public-domain text: the cai-fen 材分 modular system, bracket-set composition, roof-curve 举折 rules)

and **derives** the building: bay layout from the column grid, bracket sets (dougong 斗拱) from the modular rules, roof curvature from the juzhe formulas. A vision-equipped verifier agent grades rendered output against the historical measured drawings and rule-compliance checks before anything ships. The result is an interactive 3D spatial narrative in the browser — walkthrough, construction-sequence animation, exploded views — where a **provenance layer** color-codes every component by its evidence: measured, rule-derived, or conjecture.

> We're not using AI to fake old buildings faster. We're using it to make fidelity affordable — and to make every guess wear a label.

## 3. Why This Matters (Impact)

**For cultural institutions and the public:** Existing ≠ accessible ≠ legible. Nanchan Temple stands in a remote Shanxi village; even visitors can't see the part that matters — the jointed frame and bracket sets hidden in the roof that have held for 1,200 years without a nail. Digital twins make heritage *dissectible*. (Precedent: Digital Dunhuang is a national-priority program for caves that still exist.)

**As insurance:** Notre-Dame's laser scans became the backbone of its rebuild only *after* the fire. Four Tang timber buildings remain. The Foguang Temple monitoring program itself documents flood damage history and ongoing risk.

**Against bad reconstruction:** The pipeline's differentiator is **provenance**. Every component answers "why do you look like this" — this bracket arm's proportions cite Yingzao Fashi fascicle 4; this bay width cites the published survey data; this finial is flagged conjecture. The verifier doesn't just check resemblance; it checks that nothing renders without a source.

**One-line answer to "it still exists, why rebuild it":**
We validate the method on buildings we can still check, in order to reconstruct the ones we never can again.

## 4. Founder Story

I'm a design engineer who ships with Claude Code — five hackathon wins on the principle that fidelity and beauty aren't tradeoffs. This project is personal: the buildings of my own heritage are routinely "restored" into things that never existed, not from malice but because correctness doesn't scale. A model that reads a 900-year-old ruleset, derives a structure, and proves its work is the first tool that makes correctness scale.

## 5. The Subject Buildings

| Building | Role | Why |
|---|---|---|
| **Nanchan Temple Main Hall 南禅寺大殿** (782 CE, oldest surviving Chinese timber building) | **Primary build — validation set** | 3 bays, exposed simple frame: smallest complete Tang structure. Ground truth exists (building + published survey dimensions + Liang Sicheng-era drawings), so the verifier has a real answer key. |
| **Foguang Temple East Hall 佛光寺东大殿** (857 CE) | Data-rich alternate / stretch | Most thoroughly surveyed: 1937 Yingzao Society drawings, Shanxi institute dimension data, 2011 Tsinghua laser-scan report. 7 bays — several times Nanchan's modeling load. |
| **Daming Palace, Hanyuan Hall 大明宫含元殿** (vanished; foundations only) | **Closing vision shot — inference** | Input: archaeological column-base coordinates + Yingzao Fashi rules only. No modern reconstruction images used. Demonstrates the pipeline's purpose: deriving buildings that can no longer be checked, using a method already validated on one that can. |

Demo arc: prove rigor on Nanchan (80%), then 30 seconds of Hanyuan Hall derivation as the "why this matters" close.

## 6. User Experience — Spatial Narrative (Not a Chatbot)

A browser-based 3D experience. Narrative is bound to space and interaction, never a chat box.

1. **Approach** — the hall in landscape context; era framing (782 CE, surviving the Huichang persecution by being small and remote).
2. **Construction sequence** — timeline scrubber assembles the building in build order: platform → columns → bracket sets → beam frame → roof. The core "wow" beat.
3. **Component inspection** — click any dougong/beam: name (CN/EN), structural role, and its **evidence citation**.
4. **Exploded view** — the frame separates to show joinery; no nails, all interlock.
5. **Provenance layer (signature feature)** — a toggle that colors every component by evidence class:
   - **Measured** (survey data) — e.g. bronze
   - **Rule-derived** (Yingzao Fashi) — e.g. indigo
   - **Conjecture** (flagged, minimal) — e.g. red
   One switch shows the entire model's honesty. It is also the live answer to both "what about China's careless restorations?" and "doesn't AI hallucinate?" — nothing renders without a source; what can't cite, shows red.
6. **Inference mode (Hanyuan Hall)** — same scene framework, provenance layer showing mostly rule-derived + conjecture coloring, which is precisely the point.

## 7. Reconstruction Pipeline — Agent Architecture & Reasoning

Five roles, run at build time inside Claude Code. Reasoning is not a black box: each agent **writes its reasoning trace to disk** (`derivation-log.md`, `verifier-report.json`), so the thinking is itself an artifact — debuggable, judgeable, and part of the provenance chain.

### 7.1 Data Ingester
Structures published survey dimensions into the canonical building JSON (column grid, bay widths, cai grade, member sections), each field tagged `{provenance, source}`. *(For Nanchan this is largely pre-built from Zhang et al. 2022 — done before the event as data prep, declared as such.)*

### 7.2 Rule Engine — the derivation reasoner (Fable, long context)
**Input:** canonical JSON + Yingzao Fashi fascicle text in one context.
**Output:** `structural-spec.json` — every component's position, dimensions (in fen), and joints — plus `derivation-log.md`.
**Reasoning contract:**
- For every component, resolve in strict precedence: **measured/reconstructed value → Fashi rule → flagged conjecture.** A value with a source is never overridden by a rule; a rule-derived value cites its fascicle; anything else is emitted with `provenance: conjecture`.
- **Deviations are data, not errors.** Where the building contradicts the Fashi (Nanchan does in 7 documented ways — widened load-bearing arms, over-long inward jumps, gentler roof), the engine must keep the measured value and write the deviation note. The 782 building outranks the 1103 rulebook.
- Show the arithmetic: each derived dimension in the log reads like `purlin spacing = total depth 600 fen / 4 rafters = 150 fen [ZHANG2022 §3.6]`.
- Uncertainty propagates: a conjectural input (e.g. the 1975-restored eave projection) makes every dependent component conjectural.

### 7.3 Geometry Builder — the constructor
Generates the R3F scene module **procedurally from `structural-spec.json`** — parametric geometry in fen-space scaled by 16.5mm/fen, no mesh imports. Every mesh carries `{componentId, provenance, citation}`. Build order in code mirrors real construction order (platform → columns → puzuo → frame → roof), which is what makes the construction-sequence animation free.

### 7.4 Vision Verifier — the independent grader
**Why independent:** models grade their own work poorly; the verifier runs in a **fresh context window** that has never seen the builder's reasoning — only the rendered screenshots, the reference drawings, and the rubric. (This is the documented Fable 5 pattern: verifier sub-agents outperform self-critique precisely because grading happens in an isolated context.)
**Loop:** headless-render canonical views (front elevation, cross-section, bracket close-up, provenance-layer view) → grade against the 12 `verifier_targets` (bay rhythm 200:300:200, puzuo stack = 95 fen, purlin intervals = 150 fen, roof ratio ≈ 1:2.67, zero unsourced components, …) → emit `verifier-report.json` with per-check pass/fail and pixel-measured ratios → failures route back as scoped revision tasks to the Rule Engine (if the spec is wrong) or Geometry Builder (if the rendering is wrong).
**Critical rule (V09):** the verifier must NOT "correct" the building toward the Fashi ideal. Measured reality wins; a verifier that normalizes the 1:2.67 roof to the rulebook's 1:3 has failed.
**Reports are kept, including failures** — a logged fail→revise→pass cycle is evidence of autonomy, not a blemish.

### 7.5 Narrative Composer
Generates component descriptions and era narration **from cited sources only** (the inscription text, the An Lushan / Manjusri-cult context, the 高三距五 sightline stations). No uncited historical claims; the same provenance discipline as the geometry.

```text
canonical JSON + Yingzao Fashi
→ Rule Engine ──ᵈᵉʳⁱᵛᵃᵗⁱᵒⁿ ˡᵒᵍ──► structural-spec.json
→ Geometry Builder → scene module
→ headless render → Vision Verifier (fresh context, rubric grading)
     ├─ fail → scoped revision task → re-derive / re-build → re-verify
     └─ pass → freeze artifacts → static site build → deploy
```

## 8. Build-Day Orchestration (How Fable Builds Yingzao)

Autonomy and orchestration are judged from the session log, brief, and rubric. Plan:

**Before event (not in demo, not claimed as day-of work):**
- Prepare the data corpus: Nanchan/Foguang dimension JSON, Yingzao Fashi relevant fascicles (plain text), reference drawing scans, Hanyuan column-base coordinates.
- Write and rehearse this brief + `done.rubric.json` + verifier criteria on personal credits; distill failure modes (bracket modeling, roof curves) back into the brief as general rules.
- Lock design direction: palette, type, narration tone — in the brief.

**On the day:**
- Fresh public repo. Hand Fable 5 the brief, data corpus, and rubric. `/goal`: live URL where the Nanchan experience completes with verifier pass ≥ threshold.
- Vision verifier sub-agent (independent context) gates completion; builder cannot stop until renders pass drawing-comparison and rule-compliance checks.
- Human interventions limited to new information (keys, deploy credentials), recorded in the session log.
- Done is machine-verifiable: URL responds, scene loads, verifier report passes, provenance layer audit shows zero unsourced components.

**Submission:** public repo, live URL, brief, rubric, session log, verifier reports (including failed-then-revised iterations — these are evidence, keep them), 1-minute video (3-minute live version reserved for Round 2).

**Meta-note for judges:** the product's thesis (machine-verifiable fidelity) and the build process (machine-verifiable done) are the same pattern. The brief is rerunnable: swap the data corpus and the same setup reconstructs Foguang Temple or the Yingxian Pagoda.

## 9. Data Sources & Rights

- **Yingzao Fashi** — ancient text, fully public domain. Core ruleset.
- **Published survey dimensions** (Shanxi institute, Tsinghua report, academic papers) — factual data, not copyrightable. Used as numbers; **no scanned figures from the 2011 Tsinghua report are used as assets.**
- **Yingzao Society / Liang Sicheng measured drawings** — author d. 1972; under China's life+50 term these entered the public domain (2023). Used as verifier reference; sources credited in README; prefer early Society bulletin versions to avoid publisher layout-rights claims.
- **Hanyuan Hall** — archaeological base-plan data only. **No modern scholars' reconstruction images (Fu Xinian, Yang Hongxun) are used or imitated** — their copyrights are active, and independence from them is also the methodological point.
- All sources listed in README with rights notes (hackathon rule: unauthorized assets = DQ).

## 10. MVP Scope

**Must have:** Nanchan Hall full pipeline (ingest → derive → build → verify → ship); browser 3D scene with orbit/walkthrough; construction-sequence animation; component inspection with citations; provenance layer toggle; vision verifier with at least one logged fail→revise→pass cycle; public repo; live URL.

**Should have:** exploded view; Hanyuan Hall inference mode (vision shot); verifier report viewer; EN/CN narration toggle.

**Nice to have:** ambient sound; landscape context; cai-grade explainer; export verifier report as PDF.

**Do not build:** chatbot/Q&A of any kind, user accounts, CMS, mobile-native app, photoreal texturing (stylized + accurate beats photoreal + unverifiable), any building beyond the three named.

## 11. Tech Stack & System Architecture

**Form factor:** a web application. Desktop-first (3D walkthrough wants screen real estate and WASD/orbit controls), responsive down to tablet; mobile gets a guided "tour mode" (scripted camera path, tap-to-inspect) rather than free navigation.

**Two-plane architecture.** The system is deliberately split into a build-time agentic plane and a runtime static plane:

```text
BUILD TIME (Claude Code, Fable 5, day-of)          RUNTIME (deployed site, no LLM)
┌──────────────────────────────────────┐           ┌──────────────────────────────┐
│ data corpus (canonical JSON + Fashi) │           │ Next.js app (static export)  │
│   → Rule Engine (derivation)         │  emits    │   reads structural-spec.json │
│   → Geometry Builder (scene code)    │  ───────► │   React Three Fiber renders  │
│   → Vision Verifier (render grading) │ artifacts │   provenance layer / narrative│
│   → revision loop until pass          │           │   verifier report viewer     │
└──────────────────────────────────────┘           └──────────────────────────────┘
```

The agent pipeline runs **once, at build time**, orchestrated by Fable 5 in Claude Code. Its outputs are frozen, verified artifacts committed to the repo: `structural-spec.json` (full derived geometry with per-component provenance + citations), `derivation-log.md` (the Rule Engine's reasoning trace), `verifier-report.json` (all grading cycles including failures), and the generated scene module. The deployed site renders these artifacts and makes **zero runtime LLM calls** for the core experience. Rationale: (a) the live demo cannot depend on API latency or availability; (b) the autonomy score is judged from the session log, and this design makes the pipeline *be* the build process; (c) it is philosophically consistent — a product about verifiability ships the frozen, verified result, not a fresh unverified generation per visitor.

**Frontend:**
- Next.js 14+ (App Router), TypeScript, Tailwind. Static export (`output: 'export'`) — no server runtime needed; deploy to Vercel.
- **React Three Fiber + drei** for the 3D scene. All geometry is **generated procedurally from `structural-spec.json`** (BoxGeometry/ExtrudeGeometry composed per the fen-module dimensions) — no imported GLB/OBJ assets, which is both the rights-safety guarantee and the proof that the model derived the building rather than displaying a downloaded one.
- Scene graph mirrors the spec: every mesh carries `{componentId, provenance, citation}` in userData → provenance toggle is a material swap keyed on that tag; click-to-inspect reads the same metadata. One source of truth.
- Construction sequence = staged visibility/animation over the same scene graph (platform → columns → puzuo → beams → roof), driven by a timeline scrubber (no separate animation assets).
- State: Zustand (camera stations, active layer, inspector). No database, no auth, no CMS.

**Build-time AI plane:**
- Claude Code + Fable 5, Anthropic API. Long-context derivation (Yingzao Fashi fascicles + canonical JSON in one context), code generation (scene module), and **vision-based verification**: the pipeline renders canonical views headlessly (Playwright screenshot of the R3F scene), and a verifier sub-agent grades the images against reference drawings and the `verifier_targets` checklist.
- Orchestration: a dynamic-workflow script holds the loop (derive → build → render → verify → route revisions); `/goal` carries the completion target.

**Data:** static in-repo corpus — `nanchan-canonical.json` (survey dimensions, per-field provenance), Yingzao Fashi fascicle text (public domain), reference drawing scans for the verifier. No external data fetches at runtime.

## 12. Definition of Done

1. Live URL, public repo.
2. Nanchan scene loads and is navigable; construction sequence plays.
3. Every rendered component carries an evidence class and citation; provenance toggle works.
4. Component inspection shows name, role, and source for at least the principal frame and one full bracket set.
5. Verifier report exists showing render-vs-drawing comparison, rule-compliance results, and at least one revision cycle.
6. Zero unsourced components (provenance audit passes).
7. Hanyuan inference mode renders from base-plan + rules only *(should-have; cut first under time pressure)*.
8. Session log demonstrates long autonomous stretches; interventions are new-information only.
9. Demo shows only day-of work.

## 13. Submission Checklist

- [ ] Public repo, live URL accessible
- [ ] **1-minute** demo video (Nanchan rigor → provenance toggle → Hanyuan close)
- [ ] Brief (this PRD), `done.rubric.json`, session log, verifier reports submitted
- [ ] README: pitch, the restoration problem, method (data + rules → derivation → vision verification), source/rights table, why Fable 5, how to rerun, what was built day-of, demo link
