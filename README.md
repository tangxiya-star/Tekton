# Yingzao 营造 — Notre-Dame de Paris · La flèche

**An evidence-based 3D reconstruction of the Notre-Dame de Paris spire** — Viollet-le-Duc's 1859 *flèche*, rebuilt *à l'identique* in 2024 — where **every component proves its source**, an **independent verifier gates the build**, and **nothing renders without a citation**.

> Live URL: `<to be filled at ship>`

---

## The problem

Digital heritage reconstructions routinely present **conjecture as fact**. A model looks authoritative — clean meshes, confident dimensions — but you cannot tell which numbers came from a survey, which from a 19th-century drawing, which from a geometric rule, and which someone simply invented to fill a hole. The most dangerous values are the most precise-looking ones (e.g. a "1.948 m laser-measured pier diameter" that turns out to be an amateur blogger's geometric guess mis-attributed to a real laser scan).

Here, **provenance is the product.** Every rendered component carries its evidence class, its real source URL, and a rights verdict. **What can't cite, shows red.** A value that cannot be traced to a rights-cleared source does not reach the render — the verifier refuses to ship it.

---

## The method — an 8-phase gated pipeline

The whole flow runs behind a single command, `npm run goal` (`scripts/orchestrate.mjs`). It is **eight stages grouped into six watchable phases**, and **each phase gates the next** — reaching a later phase is impossible unless the prior gate is green. A `--replay` path mirrors the identical sequence against frozen artifacts so a timed demo never blocks on the network.

| # | Phase | What runs | Gate to advance |
|---|---|---|---|
| 1 | **Research** | `scripts/research.mjs` (verified-replay by default; `--mode=live` runs the deep-research fan-out with auto-fallback) reads the verified corpus as the **answer key** and emits `data/notre-dame-canonical.json` + `artifacts/research-findings.json` (16 verdicts, 40 gaps), streaming the verdict-by-verdict reveal | Corpus present; canonical JSON parses; **0 nodes missing `{provenance, source, url, rights}`** |
| 2 | **Ingest** | Validates + registers every node against the rights-cleared `source_registry`; GAP fields marked, never invented | Schema-valid; **0 nodes traceable to the fabricated Reims/"Nohesive" docs** |
| 3 | **Derive** | `scripts/derive.mjs --building notre-dame` applies the Gothic ruleset to the canonical and emits `artifacts/structural-spec.notre-dame.json` + a tailable `derivation-stream.notre-dame.jsonl` | Spec written; the **`comp()` audit threw nothing** — no component lacking `{provenance, source}` reaches the spec |
| 4 | **Build** | `next build` of the R3F scene; the Viewer loads the spire spec via `?building=notre-dame` | `next build` exits 0; the spire scene renders non-blank |
| 5 | **Verify** | `scripts/verify.mjs --building notre-dame` recomputes the **V-checks from component coordinates** (never from `key_dimensions`); then a **vision sub-agent grades in a fresh context** and merges a soft grade into `verifier-report.json` | Deterministic verify **exit 0** AND vision pass AND `done.rubric.json` self-grades green |
| 6 | **Loop** | On a red check, the driver classifies **rule-engine vs geometry-builder** from the failing check id, applies the scoped fix, and re-runs Derive→Verify until green; **keeps every** `verifier-report.*.failed.json`. Includes exactly one scripted **V08 measured-reality guard** beat: `demo:corrupt` → verify **REFUSES** (exit 1) → `demo:restore` → green | ≥1 logged fail→revise→pass cycle persisted; terminates only on verify exit 0 + vision pass |
| 7 | **Record** | Playwright `recordVideo` captures the Build Theater + tailed log into a committed `artifacts/run-*.webm` | Video artifact written and non-empty |
| 8 | **Ship** | Deploy `out/`, assert the live URL returns HTTP 200 and the build gate is green; write `run-summary.json` | URL 200 AND build green |

**What makes it honest, not theater:**
- **The verified corpus is the answer key.** Every number in `data/notre-dame-canonical.json` traces to `docs/NOTRE_DAME_VERIFIED_CORPUS.md` (16 adversarially-verified verdicts, 40 explicit gaps). The derive engine **never** reads the fabricated Reims/"Nohesive" docs.
- **The `comp()` audit gate** throws at derive time on any component missing a provenance class or source — a fabricated value cannot even be emitted into the spec.
- **The verifier recomputes from geometry.** V-checks read back the actual component coordinates and re-derive height, taper monotonicity, the octagon footprint, and the statue count — it never trusts the engine's own summary numbers.
- **The vision sub-agent runs in a fresh context** with no memory of how the scene was built, grading soft visual quality (silhouette, taper smoothness, statuary placement) independently.
- **The V08 measured-reality guard** is the centerpiece of the loop: `npm run demo:corrupt` idealizes the spire away from its sourced 96 m / 30 m anchors; verify fires a CRITICAL failure and exits 1; `npm run demo:restore` returns it to green. Measured reality is **never** corrected toward a Gothic ideal.

---

## The provenance model

Four evidence classes, each with its own render colour (from `data/notre-dame-canonical.json` / `components/SpireViewer.tsx`):

| Class | Colour | Meaning |
|---|---|---|
| `measured` | `#d9a843` | Published survey value or a multiply-confirmed published dimension (factual, uncopyrightable). **Requires ≥ 2 independent sources** to qualify as measured. |
| `reconstructed_design` | `#a3812f` | 19th-c. design intent reconstructed from Viollet-le-Duc / Lassus public-domain drawings (the *flèche* is not medieval fabric — it is an 1859 design). |
| `rule_derived` | `#5e6ca8` | Derived by our engine from the Gothic ruleset (*ad quadratum* / *ad triangulum*, the Roriczer pinnacle rule, the two-centred arch). Must cite the rule. |
| `conjecture` | `#b34a38` | Flagged uncertain: contested estimate, photo-deduced, scaled where no number is published, or lost fabric. Renders red. **Never** presented as measured. |
| *(GAP)* | — | Could not be sourced. **Never** filled with a number — the corpus ships 40 of these as the model to emulate, never to guess. |

**Precedence:** `measured` / `reconstructed_design` > `rule_derived` > `conjecture`. A sourced value is **never** overridden by a rule, and a conjectural input makes every dependent component conjectural.

### The anti-hallucination thesis, working

The adversarial-verification pass (`artifacts/adversarial-verification.json`) is a **second agent in a fresh context whose only job is to refute** each `measured` claim. It did exactly that:

- **REFUTED the ornament counts.** The widely-repeated "~200 crockets per face / 32 gargoyles" framing traces to a single non-independent press cluster; the official Ministry source gives *different* figures (≈112 *crochets gothiques* on the *aiguille* arêtes, **16** gargoyles not 32, 8 *grands-ducs* + 8 griffons on the pinnacles). → the ornament **counts were reclassified to `conjecture`**, and the rendered ornament takes its *form* from the public-domain Viollet-le-Duc plate, not from those contested counts.
- **FLAGGED the statue weights.** Heights are well-supported (apostles ≈ 3.40 m, evangelists ≈ 2.0 m), but the **weights conflict** across authoritative sources (apostle 140 kg vs ~150 kg; evangelist 65 kg vs ~75 kg). → the weights are **recorded as contested ranges, drive no geometry**, and the statues render at their measured *heights*; the count (16 = 12 + 4) and arrangement stay measured.

This is the thesis in action: the build's own verification caught two over-confident "facts" and demoted them before they could ship as truth.

---

## Source & rights table

The build is gated by the rights-cleared `source_registry` (the **G09 / V14 source-registry check**): every rendered component's `source` must resolve here with a `use` or `use-data` verdict, or the build hard-fails.

| Source key | Citation | URL | Rights | Verdict |
|---|---|---|---|---|
| **VLD-FLECHE** | Viollet-le-Duc, *Dictionnaire raisonné*, art. 'Flèche', t.5 — 'Élévation et plans de la flèche', engraving | [BnF Passerelles](https://passerelles.essentiels.bnf.fr/fr/image/44140e30-c8c3-40c2-b613-55c6009b22da-elevation-et-plans-la-fleche-notre-dame-paris-par-viollet-le-duc) | public_domain | **use** |
| **VLD-DICT** | Viollet-le-Duc, *Dictionnaire raisonné* t.5 'Flèche' text + figures | [Wikisource](https://fr.wikisource.org/wiki/Page:Viollet-le-Duc_-_Dictionnaire_raisonn%C3%A9_de_l%E2%80%99architecture_fran%C3%A7aise_du_XIe_au_XVIe_si%C3%A8cle,_1854-1868,_tome_5.djvu/447) | public_domain | **use** |
| **CULTURE-FLECHE** | Ministère de la Culture — official Notre-Dame site, 'Petite histoire de la flèche' | [culture.gouv.fr](https://notre-dame-de-paris.culture.gouv.fr/fr/petite-histoire-de-la-fleche) | facts_uncopyrightable | **use-data** |
| **FRIENDS** | Friends of Notre-Dame de Paris — official spire page | [friendsofnotredamedeparis.org](https://www.friendsofnotredamedeparis.org/cathedral/artifacts/spire/) | facts_uncopyrightable | **use-data** |
| **NDP-SPIRE** | Cathédrale Notre-Dame de Paris (official) — 'The spire' | [notredamedeparis.fr](https://www.notredamedeparis.fr/en/understand/architecture/the-spire/) | facts_uncopyrightable | **use-data** |
| **CONSTRUCTIONBTP** | constructionbtp.com — 'Flèche Notre-Dame, chef-d'œuvre de charpente en chêne' (2023) | [constructionbtp.com](https://www.constructionbtp.com/batiment/article/2023/06/12/144676/fleche-notredame-paris-chef-uvre-charpente-chene) | facts_uncopyrightable | **use-data** |
| **RESTAURONS-ND** | Restaurons Notre-Dame — 'le tabouret ou la souche de la flèche' | [restauronsnotredame.org](https://www.restauronsnotredame.org/post/notre-dame-de-paris-le-tabouret-ou-la-souche-de-la-fl%C3%A8che-de-viollet-le-duc) | facts_uncopyrightable | **use-data** |
| **WIKIPEDIA-SPIRE** | Wikipedia — 'Spire of Notre-Dame de Paris' | [en.wikipedia.org](https://en.wikipedia.org/wiki/Spire_of_Notre-Dame_de_Paris) | facts_uncopyrightable | **use-data** |
| **PERSEE-2009** | *Bulletin Monumental* 2009, t.167-2 (Persée) — Viollet-le-Duc spire statuary | [persee.fr](https://www.persee.fr/doc/bulmo_0007-473x_2009_num_167_2_7284) | facts_uncopyrightable | **use-data** |
| **MEDIACHIMIE** | mediachimie.org — the copper statuary of the spire | [mediachimie.org](https://www.mediachimie.org/) | facts_uncopyrightable | **use-data** |
| **RORICZER1486** | Roriczer, *Büchlein von der Fialen Gerechtigkeit* (1486); 1847 PD translation | [Wikisource](https://en.wikisource.org/wiki/Archaeological_Journal/Volume_4/Rules_for_Constructing_a_Pinnacle,_as_given_by_Mathias_Roriczer_in_1486) | public_domain | **use** |
| **AD-QUADRATUM** | *Ad quadratum*: successive square side ratio 1/√2 ≈ 0.7071 (Salama et al. 2016; pure Euclid) | [researchgate](https://www.researchgate.net/publication/304352380) | rule | **use** |
| **AD-TRIANGULUM** | *Ad triangulum*: triangle height = base × √3/2 ≈ 0.8660 (Hiscock, ch.10; pure geometry) | [taylorfrancis](https://www.taylorfrancis.com/chapters/mono/10.4324/9781315236872-10/ad-triangulum-nigel-hiscock) | rule | **use** |

### Rights-excluded — cite-only / neither (DQ-avoidance)

These may be referenced in prose but may **never** back a rendered component value. A value mis-attributed to any of them hard-fails (V13/V14). This is the disqualification-avoidance evidence: **unauthorized assets = disqualification.**

| Source key | Verdict | Reason |
|---|---|---|
| **TALLON-SCAN** | neither | Andrew Tallon ~1B-point laser cloud — no open license, custody unclear. Facts citable; data not ingestible. ([ref](https://en.wikipedia.org/wiki/Andrew_Tallon)) |
| **AGP-SCAN** | neither | AGP ~50B-point surveys — proprietary commissioned deliverable, no reuse license. ([ref](https://artgp.fr/references/notre-dame/)) |
| **CNRS-TWIN** | neither | CNRS/De Luca digital twin / Aioli — restricted, authenticated access, no public CC license. ([ref](https://news.cnrs.fr/articles/a-digital-twin-for-notre-dame)) |
| **CHARTRES-BLOG** | neither | chartrescathedralconceptualplan.wordpress.com — self-published; amateur *ad-quadratum* derivations **mis-attributed to Bork/Tallon**. Hard DQ — never ingest, never cite as measured. ([ref](https://chartrescathedralconceptualplan.wordpress.com/)) |

---

## How to rerun

```bash
npm install

# Run the whole 8-phase flow (research → ingest → derive → build → verify → loop → record → ship)
npm run goal            # alias: npm run orchestrate

# Individual stages
npm run research        # verified-replay; emits data/notre-dame-canonical.json + artifacts/research-findings.json
npm run derive          # canonical + Gothic rules → artifacts/structural-spec.notre-dame.json
npm run verify          # deterministic V-checks + pixel checks, recomputed from component coords

# The measured-reality guard beat
npm run demo:corrupt    # idealize the spire away from 96 m / 30 m → verify REFUSES (exit 1)
npm run demo:restore    # back to green

# Interactive viewer
npm run dev             # serves at http://localhost:3003 ; static export lives in out/
```

The app routes by query string:
- **`?building=notre-dame`** (default) → the spire (`SpireViewer`).
- **`?building=nanchan`** → the Nanchan timber hall, the **regression anchor** that must stay green when the corpus is swapped — proof the pipeline is rerunnable on a different building.

---

## Scope — spire only for v1

**The *flèche* (spire) only.** Flawless first, then expand. The spire is the cleanest proof-of-method: a single public-domain measured drawing exists, its headline dimensions are multiply confirmed, and it is a parametric octagonal taper — the whole "module → elevation → component" story in one object.

**Documented post-v1 roadmap** (each is just more components in the canonical + derive, gated by the same verifier):
1. **West towers + facade** (the iconic twin-tower massing — confirmed 69 m towers, 43.5 m facade)
2. **Nave / vaults / transept** (bay-rhythm from module, pointed-arch + sexpartite-vault geometry)
3. ***La forêt*** — the lost 13th-c. oak roof frame, as the deliberate conjecture/inference tier where uncertainty dominates the render by design
4. The **whole building**

---

## What's verified vs what's honest conjecture

The spire keeps Viollet-le-Duc's actual proportions; deviations from any Gothic ideal are annotated, never "fixed."

- **Measured (≥ 2 independent sources):** total height **96 m** to the rooster head, base anchored **~30 m** above the crossing (accept 30–33 m); the octagonal plan (8 faces); 500 t oak armature / 250 t lead cladding; **16 statues = 12 apostles + 4 evangelist symbols** with St Thomas (bearing Viollet-le-Duc's features) facing inward, apostles ≈ 3.40 m / evangelists ≈ 2.0 m. These are the hard anchors — never recomputed from a height-from-width ideal (V08 critical).
- **Reconstructed design (off the public-domain plate):** the six-part profile (tabouret → souche → fût → two openwork galleries → aiguille + coq) and the ornament *form* (quadrilobes, pinnacles, gabled bays).
- **Rule-derived:** **per-section heights** are *not published* → scaled off the Viollet-le-Duc 'Flèche' plate proportions (tagged "scaled from PD plate"); the octagon inscribed in the mean ~14 m crossing footprint; the Roriczer pinnacle insets.
- **Honest conjecture / GAP:** the **exact octagon springing dimension** (a GAP — never filled); the **rooster weight** (sources conflict, ~30 kg vs ~10 kg → conjecture); ornament counts (contested, refuted by adversarial verification); the Roriczer 6×/7× vertical multiples (cited-uncertain). No invented numbers fill the 40 documented gaps.

---

*Yingzao 营造 — every component can prove where it came from.*
