# Handoff for Holly — Apply the Yingzao Pipeline to an Asian Temple

> **Hi Holly!** This is everything you need to apply the Yingzao reconstruction pipeline to an Asian temple. **The big shortcut:** **Nanchan Temple** is already fully built, shipped, and passing 20/20 — and its rule engine already encodes the Chinese-timber ruleset (Yingzao Fashi / cai-fen). So for an Asian temple you mostly **adapt the data, not the hard engine.** Notre-Dame is the worked example of a *fresh* build (a whole new Gothic ruleset); you have it easier.

## TL;DR — where to start
1. Read this doc, then skim `docs/METHODOLOGY_FOR_NOTRE_DAME.md` (it's the **generic** 5-layer methodology, written 从南禅寺到圣母院 — Nanchan-first, bilingual).
2. Open the **Nanchan implementation** — it's your working template: `data/nanchan-canonical.json`, `scripts/derive.mjs`, `scripts/verify.mjs`, `scripts/demo.mjs`, `components/Viewer.tsx`.
3. Decide your subject (§3), gather a **verified corpus** with the guardrails (§5), then run the pipeline (§4).

## 1. What Yingzao is (the thesis)
An **evidence-based 3D reconstruction engine**: rebuild a historic building from **measured survey data + period building rules**, where **every component proves where it came from** (`measured` / `reconstructed_design` / `rule_derived` / `conjecture`). An **independent verifier gates the build** — nothing renders without a real, cited source, and measured reality is never "corrected" toward the rulebook. The pipeline is **rerunnable**: swap the data corpus → a new building. That's exactly what you're doing.

## 2. The pipeline (8 gated phases — building-parameterized)
`research → ingest → derive → build → verify → loop → record → ship`, behind one command (`npm run goal` once the orchestrator exists; today the spine is `derive → verify → build`). Each phase gates the next; the verifier won't let an unsourced or rule-overridden build through. Full detail: **`docs/GOAL_NOTRE_DAME_SPIRE.md`** (the worked brief) + the **Verifier & Acceptance Gate** notes.

## 3. Your subject — which Asian temple?
- **If the temple IS Nanchan** (bringing it through the *new* end-to-end engine as the second demo use case): the data + rule engine + verifier already exist and pass. Your job is **pipeline parity** — run Nanchan through the orchestrator / research-replay framing / Build Theater / playback / recorded demo so it demos identically to Notre-Dame. Much less data work.
- **If it's a NEW Asian temple** (e.g. another Tang/Song timber hall): use Nanchan as the **direct template** — same ruleset, same scripts, new canonical data. This is the rerun recipe in §4.

> Not sure which Austin means? Confirm with him — it changes how much data work there is. Either way this doc covers you.

## 4. How to apply it — the rerun recipe
1. **Research & verify the corpus** (§5 guardrails). Produce a `*_VERIFIED_CORPUS.md` (cited, with verdicts + gaps) like `docs/NOTRE_DAME_VERIFIED_CORPUS.md`.
2. **Build the canonical** `data/<temple>-canonical.json` — copy `nanchan-canonical.json`'s schema; every dimensional node carries `{provenance, source, url}`; gaps stay gaps.
3. **Reuse the ruleset.** For a Chinese timber temple, `scripts/derive.mjs` already implements the Yingzao Fashi cai-fen system (材分 module, 斗拱 bracket sets, 举折 roof curve). Point it at your canonical; adjust only where your building differs. *(This is the part Notre-Dame had to build from scratch — you inherit it.)*
4. **Render.** `components/Viewer.tsx` is procedural (no imported meshes); make it building-parameterized (`?building=<temple>`) so Nanchan stays green.
5. **Verify.** `scripts/verify.mjs` recomputes the checks **from component coordinates** (never `spec.key_dimensions`) + a vision sub-agent in a fresh context. Define your building's `verifier_targets` in the canonical (bay rhythm, bracket stack, roof ratio, etc.).
6. **Loop → record → ship.** Fix→re-run to green (keep failed reports); record the run; deploy.

## 5. The guardrails — DO NOT skip these
These are *the product*. They're what separates this from AI slop.
- **Cite-or-gap:** every value needs a real, resolvable source URL. No source → it's a **GAP**, never a number. Never invent.
- **Adversarial verification:** every `measured` value is refuted-tested by a second agent in a **fresh context**; require **≥2 independent sources**; single-source = uncertain.
- **Rights gate:** classify each source **use / cite-only / neither**. Restricted scans/data = cite-only, never ingested. (Hackathon rule: unauthorized assets = DQ.)
- **V09 (critical):** **measured reality outranks the rulebook.** Keep real deviations, annotate them, **never normalize toward the ideal** (Nanchan's roof is 1:2.67, gentler than the Fashi's 1:3 — that's *data*, not an error). The verifier fails the build if anyone "corrects" it.
- **No source-laundering:** provenance traces to the *actual* origin, never re-attributed to something more authoritative.

## 6. What to read / copy (the file map)
| What | Where | Use |
|---|---|---|
| Generic 5-layer methodology | `docs/METHODOLOGY_FOR_NOTRE_DAME.md` | Read first — Nanchan-first + bilingual |
| Code patterns / adaptation guide | `docs/NOTRE_DAME_TECH_TEMPLATE.md` | How to adapt derive/verify/Viewer |
| The worked brief (fresh build) | `docs/GOAL_NOTRE_DAME_SPIRE.md` | The full DoD + 8-phase flow + backlog |
| Verified data example | `docs/NOTRE_DAME_VERIFIED_CORPUS.md` | What a cited corpus looks like |
| Kickoff prompt + /goal | `docs/KICKOFF_PROMPT.md` | The agent kickoff pattern |
| **Your template (Asian temple)** | `data/nanchan-canonical.json` · `scripts/derive.mjs` · `verify.mjs` · `demo.mjs` · `components/Viewer.tsx` | Copy + adapt — the working reference |
| The product thesis | `PRD.md` | Why, UX, rights discipline |

## 7. Kickoff (building-parameterized /goal)
Mirror `docs/KICKOFF_PROMPT.md`, swapping the building: read the methodology + your verified corpus + the **Nanchan implementation as the template**; build `data/<temple>-canonical.json` (cited) → derive → render → verify (V-checks from components + vision sub-agent) → loop to green → record → ship; never use unsourced data; never normalize measured reality (V09). Branch off `feat/notre-dame-methodology` (or `main`) so Nanchan + Notre-Dame stay green.

## 8. Gotchas / lessons learned
- **The fabricated-data trap (real story):** an early AI draft of the Notre-Dame docs invented a "Nohesive 2019" survey and described the wrong cathedral (Reims). That's exactly what the guardrails prevent — trust nothing without a resolvable source. Don't reuse numbers from the `NOTRE_DAME_*` methodology docs; use the verified corpus.
- **Never trust `spec.key_dimensions`** — the verifier recomputes everything from the components' real geometry, so a deriver bug can't hide.
- **Keep failed verifier reports** — a logged fail→revise→pass cycle is the autonomy evidence, not a blemish.
- **Deviations are data** — the builders widened Nanchan's load-bearing bracket arms to 11 fen (vs 10); the first verifier run was 19/20 because the *check* assumed uniform 10 — the 1,200-year-old measurement corrected the code. Expect your building to break a rule; keep the measurement.

## 9. Ownership / who to ask
- **Austin** — the verifier & acceptance gate (V-checks, V09, the vision sub-agent layer).
- **Holly (you)** — the Asian-temple use case.
- Board: the **Epics** database (each building is an epic) + the per-epic ticket board. Notre-Dame's board (ND-1..ND-37) is the template for what a build's tickets look like.

## 10. Definition of done (your build)
Same bar as Notre-Dame: `derive && verify && build` green · zero unsourced components · ≥1 logged fail→revise→pass · vision sub-agent passes · V09 guard holds · provenance toggle + inspection work · live URL responds. The verifier — not a human — decides done.
