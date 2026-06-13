# GOAL — Scale Notre-Dame to the Whole Cathedral (level-of-detail + tiers)

> Scale from the flawless spire to the **whole cathedral** using the rerunnable pipeline + the fidelity template. The honest constraint drives the design: **don't attempt full fidelity everywhere — go massing-first, then tier by tier, parallel where possible, and let the provenance toggle show the fidelity gradient.**

## Is it scalable given time constraints? (the honest answer)
- **The engine scales** — rerunnable, building/component-parameterized; proven Nanchan → Notre-Dame spire. ✅
- **Full-fidelity whole cathedral is NOT a hackathon-timeframe task** — 10–50× the spire's surface, much of it with no clean public-domain measured drawings (→ heavy conjecture). Weeks, not hours.
- **The time-smart path** = **LOD: whole-building MASSING now (fast, sourced, recognizable) + the flawless spire + fidelity tiers until time runs out.** Each tier is independently shippable.
- **Partial fidelity is honest, not a gap** — the provenance toggle renders massing as reconstructed/rule-derived and thin-source detail as conjecture. That gradient *is* the product's point.

## Strategy
1. **Pass 1 — MASSING (do first):** the overall volumes (nave + aisles, west front + two towers, transept + crossing with the spire, choir/apse/chevet, roofline) from the verified headline dims. Recognizable silhouette, every block sourced.
2. **Pass 2+ — FIDELITY TIERS (priority order, each a gated goal from the fidelity template):**

| Tier | Adds | Primary sources |
|---|---|---|
| Spire ✅ | (done — the flawless hero) | VLD *Flèche* plate |
| West towers + facade | Gallery of Kings (28), rose window, 3 portals/tympana, tracery, tower pinnacles | Dehio-Bezold + VLD facade drawings |
| Nave + vaults | sexpartite vaults, compound piers, arcade/tribune/clerestory, flying buttresses | Dehio sections, VLD *Dictionnaire* |
| Transept | the two transept rose windows, the gables | Dehio + VLD |
| Choir / apse / chevet | the radiating chapels, the double ambulatory | Dehio plan |
| Roof / *la forêt* | the lost 13th-c. oak frame (conjecture tier) | Fromont relevé (mostly conjecture) |

3. **Parallelize:** the tiers are **independent component groups** — separate canonical + derive scopes that compose into one `structural-spec.notre-dame.json` + one scene behind the existing building selector. Run multiple agents in parallel per tier.

## Rules (unchanged) + time-box
- cite-or-gap · provenance per component · measured-reality guard · rights gate · **procedural geometry, no imported meshes** · uncertainty propagates — where PD sources thin (fine tracery, sculpture, the forêt), mark `rule_derived` or `conjecture`, **never invent**.
- Verifier targets extend per tier (recomputed from component coords) + the vision sub-agent; each added to `done.rubric.json`; the build can't ship a tier unsourced or rule-overridden; **Nanchan + the spire stay green.**
- **Time-box:** finish Pass 1 (massing) first — that alone gives the recognizable whole cathedral — then add tiers in order until time runs out.

## Recommendation for the hackathon
Keep the **flawless spire as the hero**; add **whole-cathedral massing** as the *"and it scales to the entire building — and any place"* beat. **Do not attempt full detail everywhere** — the massing + spire + the provenance gradient tells the scaling story honestly and on time.

## The `/goal` command
```
/goal Scale the Notre-Dame reconstruction from the spire to the WHOLE cathedral per docs/GOAL_NOTRE_DAME_WHOLE.md, using the rerunnable pipeline (research -> derive -> verify -> render) and the fidelity-template pattern. Prereq: the spire is green and merged. WORK BY LEVEL-OF-DETAIL AND TIER, time-boxed - do NOT attempt full fidelity everywhere. PASS 1 (MASSING, do first - fast, recognizable, mostly sourced): derive the whole-cathedral massing from the verified headline dimensions in docs/NOTRE_DAME_VERIFIED_CORPUS.md (length 128 m, width 48 m at the transept, west facade 43.5 m / 45 m, towers 69 m, nave vault 33 m, etc.) - the overall volumes (nave + aisles, west front + two towers, transept + crossing carrying the existing spire, choir/apse/chevet, the roofline). Every massing block carries {provenance, source, url, rights}; the silhouette must read as Notre-Dame with the flawless spire on the crossing. PASS 2+ (FIDELITY TIERS, in priority order, each its own gated goal via the fidelity template): (a) west towers + facade (Gallery of Kings 28, rose window, 3 portals/tympana, tracery) from Dehio-Bezold + VLD facade drawings; (b) nave + vaults (sexpartite vaults, compound piers, arcade/tribune/clerestory, flying buttresses); (c) transept + its rose windows; (d) choir/apse + radiating chapels; (e) roof / lost foret (conjecture tier). RULES (unchanged): cite-or-gap; provenance per component; measured-reality guard; rights gate; PROCEDURAL geometry, no imported meshes; uncertainty propagates - where public-domain sources thin (fine tracery, sculpture, the foret) mark rule_derived or conjecture, NEVER invent; the provenance toggle is the honesty layer (partial fidelity is fine; unsourced detail renders conjecture). PARALLELISM: tiers are independent component groups - build them as separate canonical+derive scopes that compose into one structural-spec.notre-dame.json + one scene behind the existing building selector; run multiple agents in parallel per tier if available. VERIFY: extend verifier_targets per tier (recomputed from component coords) + the vision sub-agent; add each to done.rubric.json; the build cannot ship a tier unsourced or rule-overridden; Nanchan + the spire stay green. TIME-BOX: finish PASS 1 (massing) first - that alone gives the recognizable whole cathedral - then add fidelity tiers in order until time runs out; each completed tier is independently shippable. DONE (per increment): the whole-cathedral massing renders recognizably with the spire; every component sourced or flagged; the verifier + rubric green for what's built; the provenance toggle honestly shows the fidelity gradient. Never present massing or conjecture as measured detail.
```
