# Notre-Dame de Paris — Verified Data Corpus (ND-1 output)

> **This is the ONLY source of dimensions for the Notre-Dame build.** Produced by a 6-researcher fan-out + adversarial verification workflow (94 findings, 16 claims independently verified). Every value is cited to a real public-domain or factual source.
>
> ⚠️ **Do NOT use any number or source from `docs/NOTRE_DAME_TECH_TEMPLATE.md`, `METHODOLOGY_FOR_NOTRE_DAME.md`, or `NOTRE_DAME_QUICKSTART.md`** — their data is fabricated (Reims, "Nohesive"). Use those docs ONLY for pipeline/code structure; use THIS file for all data.
>
> Canonical output filename is `data/notre-dame-canonical.json` (hyphenated), regardless of any other spelling below.

---

I have everything I need: the exact provenance-color palette, the precedence contract, the component/verifier schema, and confirmation that the prior Notre-Dame data layer was fabricated (which is precisely why this verified corpus matters). I'll now produce the deliverable using only the verified/cited-uncertain values, dropping refuted ones and substituting corrected values.

Key verifier-derived constraints I'll honor:
- **Height under roof = 35 m is REFUTED** → use 43 m (under roof) and 33 m (vault crown) per corrected_value.
- **North tower 297 steps REFUTED** → drop step count; keep 69 m tower height (confirmed).
- **Pier diameters (1.948/1.377/0.974 m) UNCERTAIN + mis-attributed** → mark as gap/conjecture, not Bork/Tallon measured.
- **Chevet radii UNCERTAIN, pied-du-roi 148 conversion mis-sourced** → cite-uncertain, drop the "148 PdR = Bork" attribution.
- **Rib widths UNVERIFIED** → gap.
- Confirmed anchors: 128 m length, 48 m width, 43.5 m facade, ~13 m nave, 5.9 m aisle, 33/32.5 m vault, transept 48×14, spire 96 m total / ~30 m base / ~66 m above-base, Bell's PD set.

Here is the deliverable.

---

# Yingzao Building #2 — Notre-Dame de Paris (Spire / Nave Bay / *la forêt*)
### Builder brief — mirrors the Nanchan pipeline (`derive → verify → ship`, every component `{provenance, source, citation}`)

Module unit for this building is the **pied du roi (royal foot) = 324.8 mm** — the French-Gothic analog of Nanchan's *fen*. The bay/module is the cai-fen analog. Verified-value provenance classes are identical to Nanchan's four: `measured` / `reconstructed_design` / `rule_derived` / `conjecture`. Provenance colors (from `components/Viewer.tsx`): measured `#d9a843`, reconstructed_design `#a3812f`, rule_derived `#5e6ca8`, conjecture `#b34a38`.

---

## 1. GOAL (Definition of Done)

> **DoD:** A live URL renders an R3F scene of Notre-Dame de Paris whose geometry is generated **only** by `scripts/derive.mjs` from `data/notredame-canonical.json` + the Gothic ruleset, such that:
> 1. `npm run build` (= `derive && verify && next build`) **exits 0** — `derive.mjs` throws on any component lacking `{provenance, source}`, and `verify.mjs` passes **V01–V14** (below), recomputing every assertion from component geometry, never from the engine's own `key_dimensions`.
> 2. The scene loads in the browser (P02 non-blank for all canonical views; spire, one nave bay/section, and *la forêt* roof frame all visible).
> 3. **Zero unsourced components**: provenance audit (V12) reports 0 components without a class+source; every `measured`/`reconstructed_design` value traces to a URL in the corpus; everything not sourced is rendered in the **conjecture** color, never silently invented.
> 4. The **measured-reality-wins** guard (V08, critical) passes: the spire's measured **96 m total / ~30 m base** is preserved and **not** "idealized" toward any ad-triangulum/Roriczer rule; a rule that overrides a sourced value is a CRITICAL failure.
> 5. `artifacts/verifier-report.json` is written and committed (failures kept as immutable `*.failed.json`, per the Nanchan PRD §7.4 evidence rule).

---

## 2. TARGET ARC

| Tier | Target | Why it fits | Expected provenance-color mix |
|---|---|---|---|
| **PRIMARY** | **La flèche** (Viollet-le-Duc 1859 spire) | Single best **public-domain measured drawing** exists — the *Dictionnaire raisonné* "Flèche" elevation+plans plate, author d. 1879 (BnF ARK `mm320202712p`, [BnF Passerelles](https://passerelles.essentiels.bnf.fr/fr/image/44140e30-c8c3-40c2-b613-55c6009b22da-elevation-et-plans-la-fleche-notre-dame-paris-par-viollet-le-duc)). Headline dims **96 m total / ~30 m base** are multiply-confirmed. It is a clean, octagonal, parametric taper — the *yingzao*-style "module → elevation" story in one object. | Mostly **reconstructed_design** (19th-c. design intent off PD drawings) + **measured** (96 m, 30 m, weights) anchors. Per-section heights (souche/fût/galleries/aiguille) = **rule_derived** (struck off the PD plate) or **conjecture** where the plate can't be scaled. |
| **STRETCH** | **One nave bay / cross-section** (4-storey elevation: arcade · tribune · oculi · clerestory; double aisles) | Lets the rule engine show **bay-rhythm-from-module** and **pointed-arch + sexpartite-vault geometry struck from springing points**. Anchored by confirmed dims: nave vessel ~13 m, aisle 5.9 m, vault crown 33 m, double-bay transverse arch 12 m. | **measured** (13 m, 5.9 m, 33 m, 48/14 m transept) + **rule_derived** (bay interval ~6 m, arch/vault rib curves) + **conjecture** (rib section widths, individual pier diameter — unverified). |
| **VISION SHOT** | **La forêt** — lost 13th-c. oak roof frame | The deliberate **conjecture/inference** piece: frame **counts, entraxe, span, height, dating are measured** (Fromont–Trentesaux 2014–15 relevé + dendro), but member **sections are photo-deduced** and **tree count/volume are contested estimates** — so uncertainty *propagates* and dominates the render, exactly like Nanchan's post-repair ridge. | Mixed by design: **measured** (57 nave frames, 0.71 m entraxe, ~10 m height, ~100 m length, 1156/1220s dating) + **reconstructed_design** (équarrissage from arXiv photos) + **conjecture** (≈1,000 vs 2,000–3,400 oaks; 3,000–5,000 m³ volume). |

---

## 3. CANONICAL DATA SKELETON — `data/notredame-canonical.json`

JSON sketch mirroring the Nanchan schema. **Only verified / cited-uncertain values appear.** Refuted values are dropped and replaced with the verifier's `corrected_value`. Unsourced fields are marked `"provenance": "GAP"` with no number — **do not fill**.

```jsonc
{
  "$schema_notes": {
    "purpose": "Canonical spec for Notre-Dame de Paris. Building #2 proving the Yingzao pipeline rerun. Every dimensional node carries provenance + source URL. Rule Engine derives geometry ONLY from this file + the Gothic ruleset; nothing renders unsourced.",
    "provenance_classes": {
      "measured": "Published survey/laser/instrument or multiply-confirmed published dimension (factual, uncopyrightable).",
      "reconstructed_design": "19th-c. design intent reconstructed from Viollet-le-Duc / Lassus PD drawings (the flèche is NOT medieval fabric).",
      "rule_derived": "Derived by OUR engine from the Gothic ruleset (ad quadratum/triangulum, Roriczer, two-centred arch). Must cite the rule.",
      "conjecture": "Flagged uncertain: contested estimate, photo-deduced, or lost fabric. Renders in conjecture color; MUST NOT be presented as measured."
    },
    "units": "Base module = pied du roi (royal foot) = 324.8 mm. The cai-fen analog is the BAY MODULE. mm = pied * 324.8.",
    "primary_drawing_source": {
      "id": "VLD-FLECHE",
      "citation": "Viollet-le-Duc, Dictionnaire raisonné de l'architecture française, art. 'Flèche', t.5 — 'Élévation et plans de la flèche'.",
      "url": "https://passerelles.essentiels.bnf.fr/fr/image/44140e30-c8c3-40c2-b613-55c6009b22da-elevation-et-plans-la-fleche-notre-dame-paris-par-viollet-le-duc",
      "rights": "public_domain",
      "note": "Author d.1879 → PD worldwide. THE measured-drawing asset. Engraving PD; cite BnF for provenance."
    },
    "secondary_sources": {
      "BELL1902": "Charles Hiatt, 'Notre Dame de Paris' (Bell's Handbooks), Gutenberg #60213 — PD cross-check dimensional set.",
      "FRIENDS": "Friends of Notre-Dame de Paris, official layout/facts page.",
      "CULTURE": "Ministère de la Culture, notre-dame-de-paris.culture.gouv.fr 'Petite histoire de la flèche'.",
      "FROMONT2016": "Fromont & Trentesaux relevé 2014–15 (Monumental 2016-1) via culture.gouv — la forêt frame counts.",
      "VANNUCCI2020": "Vannucci et al., arXiv:2005.12584 — la forêt structural model (sections photo-deduced).",
      "RORICZER1486": "Roriczer, 'Büchlein von der Fialen Gerechtigkeit' (1486), 1847 Archaeological Jrnl PD translation — pinnacle rule.",
      "BRICK-ARCH": "Brick Development Association, 'Gothic Arch' — two-centred arch construction (equilateral/lancet/drop)."
    }
  },

  "meta": {
    "name_fr": "Cathédrale Notre-Dame de Paris",
    "name_en": "Notre-Dame de Paris",
    "date": { "value": "begun c.1163; spire 1859 (Viollet-le-Duc); spire+roof lost 15 Apr 2019; reopened 7–8 Dec 2024",
              "provenance": "measured", "source": "FRIENDS / Wikipedia",
              "url": "https://en.wikipedia.org/wiki/Notre-Dame_de_Paris" },
    "build_state": "pre-2019 / reconstructed à l'identique state (the flèche rebuilt to the SAME Viollet-le-Duc design, 96 m).",
    "fire_event": { "value": "ignition in la forêt ~18:18; flèche collapse ~19:50; ~750 t stone+lead fell",
                    "provenance": "measured", "source": "Wikipedia / Britannica",
                    "url": "https://en.wikipedia.org/wiki/Notre-Dame_de_Paris" }
  },

  "modular_system": {
    "pied_du_roi_mm": { "value": 324.8, "provenance": "measured", "source": "standard French historical metrology",
      "note": "Royal foot. All pied-du-roi conversions in corpus use 0.3248 m. The unit, like Nanchan's chi, is the metrological anchor." },
    "bay_module": {
      "value": "double-bay (sexpartite high vault spans TWO arcade intervals) ~12 m on approx-square plan; single arcade interval ~6 m",
      "single_span_m": 6.0, "double_bay_m": 12.0,
      "provenance": "rule_derived",
      "source": "60 m nave length / 10 documented spans (FRIENDS); double-bay corroborated by reconstructed transverse-arch span 12 m (J. Cultural Heritage)",
      "url": "https://www.sciencedirect.com/science/article/abs/pii/S1296207423000638",
      "note": "DERIVATION, not a published single-bay survey value. Bays vary slightly — treat 6 m as an averaged module, the cai-fen analog. ~12 m double-bay ≈ nave width (square travee)."
    },
    "design_ruleset": {
      "ad_quadratum": { "value": "successive square side ratio = 1/√2 ≈ 0.7071; area halves; diagonal/side = √2",
        "provenance": "rule_derived", "source": "Salama et al. 2016; pure Euclid",
        "url": "https://www.researchgate.net/publication/304352380" },
      "ad_triangulum": { "value": "triangle height = base × √3/2 ≈ 0.8660 (set elevation heights from plan width)",
        "provenance": "rule_derived", "source": "Hiscock, 'The Symbol at Your Door' ch.10; pure geometry",
        "url": "https://www.taylorfrancis.com/chapters/mono/10.4324/9781315236872-10/ad-triangulum-nigel-hiscock" },
      "two_centred_arch": { "value": "equilateral: radius=span, centres at the two springing points, rise=span×0.866; lancet: radius>span; drop: radius<span",
        "provenance": "rule_derived", "source": "Brick Development Association 'Gothic Arch' (verbatim)",
        "url": "https://www.brick.org.uk/uploads/downloads/d-brick-arch.pdf" },
      "roriczer_pinnacle": { "value": "base square → 45°-rotated inscribed squares (side ratio 1/√2): outer=plinth, next=shaft, inner=panel. Vertical Auszug ~ shaft 6×, spire 7× base width (RE-VERIFY against verbatim text before hard-coding)",
        "provenance": "rule_derived", "source": "Roriczer 1486 / Archaeological Journal v.4 (1847), PD",
        "url": "https://en.wikisource.org/wiki/Archaeological_Journal/Volume_4/Rules_for_Constructing_a_Pinnacle,_as_given_by_Mathias_Roriczer_in_1486",
        "note": "Used for the spire's pinnacles (16 per spire). 6×/7× multiples are CITED-UNCERTAIN — flagged a gap." }
    }
  },

  "cathedral_geometry": {
    "total_length":   { "m": 128, "pied_du_roi": 394.1, "provenance": "measured", "source": "FRIENDS + Wikipedia infobox (CONFIRMED)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/", "note": "= 420 ft. Bell's PD gives 390 ft (interior/diff. reference) — see cross-check." },
    "total_width_transept": { "m": 48, "pied_du_roi": 147.8, "provenance": "measured", "source": "FRIENDS layout (CONFIRMED); = transept arm-to-arm length = chevet outer Ø 47.88 m",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "west_facade_width": { "m": 43.5, "pied_du_roi": 134, "provenance": "measured", "source": "FRIENDS west-facade page (CONFIRMED; sources publish 135 PdR, exact ~134)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "facade_height_no_towers": { "m": 45, "pied_du_roi": 138.5, "provenance": "measured", "source": "FRIENDS (CONFIRMED alongside facade width)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "west_tower_height": { "m": 69, "pied_du_roi": 212.4, "provenance": "measured", "source": "de.Wikipedia + FRIENDS (CONFIRMED)",
                        "url": "https://de.wikipedia.org/wiki/Kathedrale_Notre-Dame_de_Paris",
                        "note": "DROPPED: '297 steps (Bell's)' — REFUTED, no source corroborates; historic ~387 / current ~422–424 if a step count is ever needed." },
    "nave_vessel_width": { "m": 13, "pied_du_roi": 40.0, "provenance": "measured", "source": "FRIENDS + techno-science.net 'vaisseau central 13 m' (CONFIRMED)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "side_aisle_width": { "m": 5.9, "pied_du_roi": 18.2, "provenance": "measured", "source": "FRIENDS (CONFIRMED); chevet/ambulatory aisle laser 5.76 m (=11 coudée) Bork 2014/Tallon",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "nave_bays": { "value": 10, "provenance": "measured", "source": "FRIENDS nave page; paired into 5 sexpartite double-bays",
                        "url": "https://www.friendsofnotredamedeparis.org/cathedral/artifacts/nave/" },
    "vault_crown_height": { "m_range": [32.5, 33], "pied_du_roi": "100–101.6", "provenance": "measured", "source": "de.Wikipedia 32.5 m (nave); FRIENDS/structurae 33 m=108 ft (CONFIRMED)",
                        "url": "https://de.wikipedia.org/wiki/Kathedrale_Notre-Dame_de_Paris", "note": "Distinct from height-under-roof (43 m). Do NOT use 35 m here." },
    "height_under_roof": { "m": 43, "pied_du_roi": 132.4, "provenance": "measured", "source": "FRIENDS 'height under nave roof 43 m (141 ft)' (CONFIRMED; CORRECTED from refuted 35 m claim)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/",
                        "note": "VERIFIER REFUTED the earlier '~35 m' label. 35 m/115 ft is only a loose 'general interior height'; the height-under-roof is 43 m, vault crown is 33 m." },
    "transept": { "length_arm_to_arm_m": 48, "arm_width_m": 14, "provenance": "measured", "source": "FRIENDS (CONFIRMED both)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "rose_windows": { "west_diameter_m": 9.7, "transept_NS_diameter_m": 13.1, "provenance": "measured", "source": "FRIENDS (official, medium-confidence — diameters vary slightly by source)",
                        "url": "https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/" },
    "elevation_storeys": { "value": "4 storeys: arcade · gallery/tribune · oculi zone · clerestory; five-vessel plan (double aisles, galleries above)",
                        "provenance": "measured", "source": "Official notredamedeparis.fr interior architecture (CONFIRMED)",
                        "url": "https://www.notredamedeparis.fr/en/understand/architecture/interior-architecture/" },

    "_GAP_nave_pier_diameter": { "provenance": "GAP",
        "note": "DO NOT FILL. No published nave free-standing 'pilier cantonné' diameter. The 1.948/1.377/0.974 m figures are UNCERTAIN + MIS-ATTRIBUTED (an amateur blog's ad-quadratum derivation, NOT Bork/Tallon measured). If rendered, flag conjecture; never cite to a laser survey." },
    "_GAP_chevet_radii": { "provenance": "GAP",
        "note": "Bork/Tallon concentric chevet radii (6.65/12.42/18.18/23.94 m, apse Ø 13.30 m) are cited-UNCERTAIN — traceable only to one self-published blog; the '47.88 m = 148 PdR' conversion is the blogger's, NOT Bork's. Verify against Bork 2014 (Architectural Histories 2(1)) / Bork 2022 (JSAH 81(1)) before use." },
    "_GAP_vault_rib_widths": { "provenance": "GAP",
        "note": "Transverse rib ~0.48 m / diagonal ~0.36–0.38 m are PLAUSIBLE BUT UNVERIFIED (paywalled). Sexpartite GEOMETRY is confirmed (6 cells, 2 diagonal + 3 transverse ribs, double-bay, alternation of supports); only the metric rib widths are a gap." },
    "_GAP_aisle_vault_heights": { "provenance": "GAP", "note": "Inner/outer aisle + tribune vault crown heights not published numerically; would need a measured section (Dehio-Bezold PD plates)." }
  },

  "spire": {
    "total_height": { "m": 96, "pied_du_roi": 295.6, "provenance": "measured",
        "source": "Wikipedia 'Spire of NDP' + culture.gouv 'Culminant à 96 m' (CONFIRMED, multi-source)",
        "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/petite-histoire-de-la-fleche", "note": "To summit/rooster head, above street." },
    "base_level": { "m": 30, "provenance": "measured",
        "source": "constructionbtp 'ancré à 30 m du sol au-dessus de la croisée du transept' + culture.gouv (CONFIRMED; one Culture source gives 33 m for tabouret platform)",
        "url": "https://www.constructionbtp.com/batiment/article/2023/06/12/144676/fleche-notredame-paris-chef-uvre-charpente-chene",
        "note": "Enrayure zéro ~1 m above the crossing vaults." },
    "height_above_base": { "m": 66, "provenance": "reconstructed_design",
        "source": "DERIVED 96 − 30 (FR Wikipedia/culture.gouv)", "url": "https://fr.wikipedia.org/wiki/Fl%C3%A8che_de_Notre-Dame_de_Paris",
        "note": "CITED-UNCERTAIN: 93 m (rooster base) vs 96 m (rooster head) ambiguity; ~45 m commonly rendered above the ridge. Not a single clean published figure — see gap." },
    "base_footprint": { "trapezoid_m": [15, 13], "provenance": "measured",
        "source": "Restaurons Notre-Dame, 'trapèze irrégulier de 15 m sur 13' (tabouret) (medium confidence)",
        "url": "https://www.restauronsnotredame.org/post/notre-dame-de-paris-le-tabouret-ou-la-souche-de-la-fl%C3%A8che-de-viollet-le-duc",
        "note": "Irregular crossing footprint; octagon inscribed in this — exact octagon springing dimension is a GAP." },
    "profile_six_parts": { "value": "1 tabouret → 2 souche → 3 octagonal fût (quadrilobes) → 4 first openwork gallery → 5 second level (8 gabled bays) → 6 aiguille + coq; octagon angles set on roof ridges + 4 valleys",
        "provenance": "reconstructed_design", "source": "culture.gouv 'Petite histoire de la flèche' + VLD Dictionnaire 'Flèche'",
        "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/petite-histoire-de-la-fleche", "note": "THE taper schema — drives the rule engine's spire profile." },
    "tabouret": { "weight_t": 80, "pieces": 110, "provenance": "measured", "source": "Restaurons ND (medium)",
        "url": "https://www.restauronsnotredame.org/post/notre-dame-de-paris-le-tabouret-ou-la-souche-de-la-fl%C3%A8che-de-viollet-le-duc",
        "note": "Transfers spire load to the 4 crossing piers. 80 t is PART OF the 500 t timber total, not additional." },
    "oak_framework": { "weight_t": 500, "pieces": 1000, "provenance": "measured", "source": "Friends of NDP / FR Wikipedia (CONFIRMED)",
        "url": "https://www.friendsofnotredamedeparis.org/cathedral/artifacts/spire/" },
    "lead_cladding": { "weight_t": 250, "provenance": "measured", "source": "Friends of NDP / Wikipedia (CONFIRMED)",
        "url": "https://www.friendsofnotredamedeparis.org/cathedral/artifacts/spire/" },
    "ornament_per_spire": { "value": "hundreds of crockets + floral motifs; pinnacles; bay arcatures; 8 quadrilobes; gargoyles (count contested: 16 per culture.gouv vs 32 in press boilerplate)",
        "provenance": "conjecture", "source": "constructionbtp + culture.gouv (reconstruction à l'identique counts)",
        "url": "https://www.constructionbtp.com/batiment/article/2023/06/12/144676/fleche-notredame-paris-chef-uvre-charpente-chene",
        "note": "REVISED per adversarial verification (artifacts/adversarial-verification.json): the '~200 crockets/face, 32 gargoyles' framing was REFUTED — it traces to a single press cluster; the official Ministry source gives ~112 crochets on the aiguille arêtes and 16 gargouilles. Counts are conjecture; rendered ornament form is reconstructed_design off the VLD plate." },
    "statues": { "value": "16 copper: 12 apostles (4 groups of 3, staggered) + 4 evangelist symbols; St Thomas faces inward, bears VLD's features",
        "apostle_h_m": 3.40, "evangelist_h_m": 2.0, "apostle_kg_contested": [140, 150], "evangelist_kg_contested": [65, 75],
        "provenance": "measured", "source": "EN/FR Wikipedia + Persée Bulletin Monumental 2009 + mediachimie.org (CONFIRMED)",
        "url": "https://www.persee.fr/doc/bulmo_0007-473x_2009_num_167_2_7284",
        "note": "Count/heights/arrangement measured + adversarially corroborated. WEIGHTS are cited-uncertain (apostle 140 vs ~150 kg per culture.gouv/diocèse; evangelist 65 vs ~75 kg) → recorded as contested ranges, conjecture, drive no geometry. Removed 11 Apr 2019, four days before fire → originals survive." },
    "rooster": { "approx_kg": 30, "provenance": "conjecture", "source": "EN/FR Wikipedia + culture.gouv",
        "url": "https://en.wikipedia.org/wiki/Spire_of_Notre-Dame_de_Paris",
        "note": "CITED-UNCERTAIN: ~30 kg (most) vs ~10 kg (one ND culture page) — the sources CONFLICT so the weight is conjecture (V13). The coq's existence + ~96 m summit position are measured. Holds 3 relics. New gilded rooster installed 16 Dec 2023." },

    "_GAP_per_section_heights": { "provenance": "GAP",
        "note": "DO NOT FILL with invented numbers. Exact heights of souche / octagonal fût / each openwork gallery / aiguille are NOT published. They MUST be scaled off the PD VLD 'Flèche' plate (ark mm320202712p) by the rule engine and tagged rule_derived, or left conjecture." }
  },

  "la_foret": {
    "_note": "Lost 13th-c. oak roof frame. Conjecture DOMINATES by design — counts/spans measured, sections photo-deduced, tree count contested.",
    "nave_frames": { "count": 57, "entraxe_m": 0.71, "provenance": "measured",
        "source": "Fromont & Trentesaux 2014–15 relevé via culture.gouv (direct count of surviving members)",
        "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/les-charpentes-medievales",
        "note": "Principal frames (chevrons maîtres) spaced ~3.5 m, 4 fermettes between (arXiv ~75 cm)." },
    "choir_frames": { "straight_bays": 33, "apse_hemicycle": 24, "entraxe_m": 0.80, "provenance": "measured",
        "source": "Fromont & Trentesaux via culture.gouv", "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/les-charpentes-medievales",
        "note": "Choir principal frames ~4.1 m." },
    "frame_span": { "nave_m": 14, "choir_m": 12.5, "tie_beam_m": 13, "provenance": "measured",
        "source": "culture.gouv (Fromont/Trentesaux) + Vannucci arXiv:2005.12584 (~13 m model)",
        "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/les-charpentes-medievales" },
    "frame_height_above_vaults": { "m": 10, "model_m": 9.75, "provenance": "measured",
        "source": "culture.gouv '10 m de haut'; arXiv 9.75 m; clerestory raised ~2.70 m so entraits clear the vault",
        "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/les-charpentes-medievales",
        "note": "Ridge ~43–45 m above floor; vault crown ~33 m." },
    "framework_length": { "official_m": 100, "model_m": 115.6, "provenance": "measured",
        "source": "culture.gouv '100 m'; arXiv 115.6 m (full ridge run)", "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/les-charpentes-medievales" },
    "dating": { "value": "choir charpente ~1220 (1225–30); nave ~1230–40; earliest felling 1156 with reused ~1160–70 timbers",
        "provenance": "measured", "source": "Dendrochronology (Bernard et al.) via academia.edu + Vannucci arXiv (instrument-based)",
        "url": "https://www.academia.edu/97637195/" },
    "member_sections_nave": { "value": "entrait 26×29; rafters 16×25.5; poinçon 23.5×18.5; faux-entrait 17×24; poteaux 17×20; jambettes 15×16; sablières 22×14; suspente 12×12 (cm)",
        "provenance": "reconstructed_design", "source": "Vannucci et al. arXiv:2005.12584 Table 1 — explicitly 'deduced from observation of some pictures'",
        "url": "https://arxiv.org/abs/2005.12584", "note": "NOT a caliper survey — photo-deduced. Render acceptable but tagged accordingly." },
    "member_sections_choir": { "value": "entrait 30×35; rafters 18×19; faux-entrait/lierne 13×27; poteaux 19×15; jambe 18×23; blochet 15×15; sablières 19×14 (cm)",
        "provenance": "reconstructed_design", "source": "Vannucci arXiv Table 1 (photo-deduced)", "url": "https://arxiv.org/abs/2005.12584" },
    "not_original_19c": { "value": "transept crossing + spire charpentes = Lassus/Viollet-le-Duc ~1855–62, frame-and-purlin spaced ~5.5 m — NOT the medieval chevrons-formant-fermes",
        "provenance": "context", "source": "FR Wikipedia / CNRS Épaud", "url": "https://fr.wikipedia.org/wiki/Charpente_de_Notre-Dame_de_Paris",
        "note": "Hard boundary: medieval = nave+choir; 19th-c = crossing+spire. Keep distinct in render." },

    "_CONJECTURE_tree_count": { "value": "≈1,000 oaks (Épaud) vs 2,000–3,400 (Corvol)", "provenance": "conjecture",
        "source": "Épaud CNRS News vs Corvol via FR Wikipedia", "url": "https://news.cnrs.fr/opinions/the-framework-of-notre-dame-putting-an-end-to-stereotypes",
        "note": "Genuinely contested; unknowable from the destroyed structure. Pure inference — render conjecture-colored, show BOTH estimates." },
    "_CONJECTURE_timber_volume": { "value": "≈3,000–5,000 m³ (Corvol); modelled ~135 t total mass (arXiv)", "provenance": "conjecture",
        "source": "Corvol via FR Wikipedia + arXiv Table 2", "url": "https://fr.wikipedia.org/wiki/Charpente_de_Notre-Dame_de_Paris" },
    "_CONJECTURE_trunk_dims": { "value": "~97% trees Ø25–30 cm to ~12 m; ~3% Ø~50 cm to ~15 m (long entraits); avg age ~60 yr (Épaud) vs 100–120 yr (Corvol)",
        "provenance": "conjecture", "source": "Épaud CNRS News (interpretive; competing estimate exists)",
        "url": "https://news.cnrs.fr/opinions/the-framework-of-notre-dame-putting-an-end-to-stereotypes" }
  },

  "pd_crosscheck": {
    "bell_1902": { "value": "length 390 ft (118.87 m); width at transepts 144 ft (43.89 m); nave length 225 ft (68.58 m); nave width excl. aisles 39 ft (11.89 m); nave vault 102 ft (31.09 m); 104 triforium columns",
        "provenance": "measured", "source": "Bell's Handbook, Gutenberg #60213 (CONFIRMED verbatim, fully PD)",
        "url": "https://www.gutenberg.org/files/60213/60213-h/60213-h.htm",
        "note": "Independent PD baseline. Smaller than modern figures (interior/diff. reference). Use as cross-check, NOT as the primary build target — modern 128 m/48 m/33 m win." }
  }
}
```

---

## 4. RULE-ENGINE STRATEGY (`scripts/derive.mjs`) — what derives from what

Precedence is the Nanchan contract, retargeted: **`measured`/`reconstructed_design` > Gothic rule (`rule_derived`) > `conjecture`.** A sourced value is never overridden by a rule. Same audit gate: `comp()` throws if `{provenance, source}` is missing.

1. **Module → bay rhythm (nave/section).** Module = the ~12 m double-bay (≈ nave vessel width → square *travée*), single arcade interval ~6 m (`bay_module`, `rule_derived`). Place 10 nave column-axes at ~6 m, paired into 5 sexpartite double-bays. Aisle bay = ½ nave bay (Gothic convention). Anchor cross-section to the **confirmed** verticals: arcade/tribune/oculi/clerestory 4-storey scheme, vessel 13 m, aisle 5.9 m, vault crown **33 m** (not 35).

2. **Pointed arches struck from springing points** (`two_centred_arch`, `rule_derived`, BDA verbatim). Arcade/clerestory: choose `radius/span` per arch class — **equilateral** (radius = span, centres at the two springs, rise = span × 0.866) is the default High-Gothic setting; lancet (radius > span) for tall clerestory lancets; drop (radius < span) where flatter. Every arch curve is *computed*, never hand-drawn.

3. **Sexpartite vault ribs** (`rule_derived`): 6 cells from 2 diagonal + 3 transverse ribs over a double-bay; intermediate transverse rib semicircular+stilted to the keystone, main transverse ribs two-centred pointed (12 m span). Rib *section widths* are a **GAP** → render at a flagged nominal in conjecture color, never as measured.

4. **Spire taper from the PD drawing** (`reconstructed_design` + `rule_derived`). Anchor the two `measured` facts hard: **96 m summit, 30 m base** (→ 66 m visible extent). Build the octagon on the 15×13 m crossing footprint with angles on roof ridges + valleys. The six-part profile (tabouret → souche → fût → 2 openwork galleries → aiguille+coq) is **scaled off the BnF "Flèche" plate** (ark `mm320202712p`) — every per-section height is `rule_derived` ("scaled from PD plate, ratio×96 m") because **no per-section number is published** (gap). Quadrilobes/gabled bays/crockets per the confirmed ornament counts.

5. **Pinnacles via Roriczer** (`rule_derived`): the 16 spire pinnacles use the 1486 rule — base square → 45°-rotated inscribed squares (1/√2) for plinth/shaft/panel, Auszug to vertical. The 6×/7× vertical multiples are **cited-uncertain** → emit with a `note` flagging re-verification; do not present as exact.

6. **Uncertainty propagation (the *la forêt* vision shot).** Measured frame counts/entraxe/span/height/dating set the geometry; member **sections are `reconstructed_design`** (photo-deduced, arXiv) and therefore so are dependents; **tree count and timber volume are `conjecture`** and propagate — anything sized off them renders conjecture-colored, and the render must show **both** Épaud (~1,000) and Corvol (2,000–3,400) estimates rather than picking one. This is the deliberate analog of Nanchan's post-1975-repair ridge: lost fabric ⇒ conjecture dominates ⇒ honesty over false precision.

7. **Provenance never invented.** Refuted/uncertain values are *not* numerically filled: nave pier Ø, chevet radii, rib widths, per-section spire heights all stay `GAP`/`conjecture`. The engine emits them only with a flagged source string or not at all.

---

## 5. VERIFIER TARGETS (`scripts/verify.mjs`) — recomputable from component geometry

Each `Vnn` recomputes from `components[]` positions/dimensions (never from `key_dimensions`). Tolerances explicit. Scene length unit = pied du roi unless noted; metric tolerances in m.

| ID | Assertion | Tolerance |
|---|---|---|
| **V01** | Cathedral total length (extreme component span, W front → E chevet) = **128 m** | ±2% |
| **V02** | Max width across transept components = **48 m**; transept arm width = **14 m** | ±2% |
| **V03** | Nave vessel clear width (inner arcade faces) = **13 m**; each side aisle = **5.9 m** | ±3% |
| **V04** | Nave bay rhythm: **10 arcade intervals**, mean single span ≈ **6 m**, paired into 5 double-bays ≈ **12 m**; aisle bay = ½ nave bay | interval ±5% |
| **V05** | High-vault crown height above floor = **33 m** (accept 32.5–33). **Guard: must NOT equal 35 m** (the refuted figure) and must NOT equal 43 m (that's height-under-roof) | crown ±3%; hard-reject 35 m & 43 m |
| **V06** | Height under roof (vault extrados / interior roof apex) = **43 m**, distinct from V05 crown | ±3% |
| **V07** | Arcade pointed arches are two-centred struck from springing points: for each arch, the two arc centres lie on the springing line and `rise ≈ span × 0.866` for the equilateral class (±2%); rib vault is **sexpartite** (6 cells, 2 diagonal + 3 transverse ribs) over each double-bay | rise ±2%; topology exact |
| **V08** ⚠ critical | **Spire total height = 96 m**, base anchored at **~30 m** (accept 30–33), visible extent ≈ 66 m. **Measured-reality guard:** the engine must NOT normalize the spire toward any ad-triangulum/Roriczer ideal that contradicts the sourced 96 m / 30 m — a spire "corrected" away from 96 m total or 30 m base is a CRITICAL failure | 96 m ±1%; base 30–33 m; **no idealization** |
| **V09** | Spire is **octagonal** on the ~15×13 m crossing footprint, with the **six-part profile** present (tabouret, souche, fût, 2 openwork galleries, aiguille+coq) and 8 faces; angles on roof ridges + 4 valleys | footprint ±5%; 8 faces exact |
| **V10** | Spire statuary: **16 copper statues** = 12 apostles (4 groups of 3, staggered heights) + 4 evangelist symbols; apostle ≈ 3.40 m, evangelist ≈ 2.0 m; St Thomas faces inward | count exact; heights ±5% |
| **V11** | *La forêt* frame: **57 nave frames** at **0.71 m** entraxe; nave span ≈ **14 m**; frame height above vault ≈ **10 m**; medieval (nave+choir) frames distinct from 19th-c. crossing/spire (~5.5 m) | counts exact; spacings ±3% |
| **V12** | **Provenance audit:** every component carries a valid class + non-empty source; **0 unsourced**. Conjecture-required set colored conjecture: *la forêt* tree-count/volume markers, any nave-pier-diameter, chevet radii, per-section spire heights, rib widths | 0 unsourced; 0 misclassed |
| **V13** | **No-invention guard:** no component may carry a `measured` class while citing the refuted/uncertain values — i.e. nave pier Ø (1.948/1.377/0.974 m), chevet radii (6.65/12.42/18.18/23.94), or rib widths (0.48/0.36–0.38) must be `conjecture`/`GAP`, never `measured` and never attributed to "Bork/Tallon laser survey" | hard-fail on violation |
| **V14** | *La forêt* uncertainty propagation: tree count renders **both** ~1,000 (Épaud) and 2,000–3,400 (Corvol) as conjecture; timber-volume-dependent geometry is conjecture-colored; member-section-dependent geometry is ≤ `reconstructed_design`, never `measured` | class-ceiling exact |
| **P01–P03** | (pixel layer, as Nanchan) all canonical views non-blank (>3% non-bg); provenance view shows **all four** evidence-class colors; spire + nave bay + *la forêt* each visible in ≥1 view | per Nanchan |

---

## 6. RIGHTS TABLE

| Source | URL | Verdict | Reason / DQ risk |
|---|---|---|---|
| **VLD "Flèche" elevation+plans plate** (BnF Passerelles, ark `mm320202712p`) | [link](https://passerelles.essentiels.bnf.fr/fr/image/44140e30-c8c3-40c2-b613-55c6009b22da-elevation-et-plans-la-fleche-notre-dame-paris-par-viollet-le-duc) | **USE as asset** | Author d.1879 → PD worldwide. The single best measured-drawing asset (elevation + plans together). Cite BnF for provenance. |
| **VLD *Dictionnaire raisonné* t.5 'Flèche' text+figs** (Wikisource/IA/Gutenberg) | [link](https://fr.wikisource.org/wiki/Page:Viollet-le-Duc_-_Dictionnaire_raisonn%C3%A9_de_l%E2%80%99architecture_fran%C3%A7aise_du_XIe_au_XVIe_si%C3%A8cle,_1854-1868,_tome_5.djvu/447) | **USE** | PD (d.1879). Structural/charpente system figures. |
| **Bell's Handbook NDP** (Gutenberg #60213) | [link](https://www.gutenberg.org/files/60213/60213-h/60213-h.htm) | **USE** | Fully PD; verbatim-confirmed dimensional cross-check set. |
| **Roriczer 1486 / Archaeological Journal v.4 (1847)** | [link](https://en.wikisource.org/wiki/Archaeological_Journal/Volume_4/Rules_for_Constructing_a_Pinnacle,_as_given_by_Mathias_Roriczer_in_1486) | **USE** | 1486 original + 1847 translation both PD. (Shelby 1977 modern translation = CITE only, in copyright.) |
| **Villard de Honnecourt MS Fr 19093** (Gallica) + 1858 Lassus facsimile | [link](https://gallica.bnf.fr/ark:/12148/btv1b10509412z/) | **USE (verify hi-res banner)** | Medieval original PD; confirm Gallica per-file "conditions d'utilisation" before ingesting raster. |
| **Dehio–Bezold atlas** (UB Heidelberg, PD Mark 1.0) | [link](https://digi.ub.uni-heidelberg.de/diglit/dehio1887atlas1/0007) | **USE** | Explicit Public Domain Mark — cleanest open repo for NDP plans/sections. Scaled dims = `reconstructed_design`. |
| **Lassus/VLD 1843 restoration report** (Gallica `bpt6k104823k`) | [link](https://gallica.bnf.fr/ark:/12148/bpt6k104823k) | **USE** | Pre-1900 PD; confirm live banner (403 at research time). `reconstructed_design`. |
| **Commons: Drawings by Viollet-le-Duc** | [link](https://commons.wikimedia.org/wiki/Category:Drawings_by_Eug%C3%A8ne_Viollet-le-Duc) | **USE** | PD by age; verify each file tag at ingest. |
| **MPP/MAP BibNum portal** (Etalab open license) | [link](https://bibnum.mediatheque-patrimoine.culture.gouv.fr/Conditions-utilisation-des-images) | **USE (BibNum only)** | Etalab = free commercial reuse w/ attribution. **DQ:** the *main* MPP/RMN-GP catalogue gatekeeps the SAME PD works — always pull the BibNum/Gallica/Heidelberg/Commons copy, never the RMN-GP file. |
| Friends of ND / culture.gouv / Wikipedia / techno-science / Restaurons ND / constructionbtp | (in corpus) | **USE (data) / CITE (text)** | Dimensions are uncopyrightable facts → ingest numbers; do not ingest page prose/images. |
| Vannucci arXiv:2005.12584; Épaud CNRS News; Corvol | (in corpus) | **CITE; numbers USE** | Numeric sections/counts are facts. **DQ:** Épaud article text copyrighted (cite only); sections are *photo-deduced* → `reconstructed_design`, not measured. |
| **Tallon ~1B-pt cloud** | [link](https://en.wikipedia.org/wiki/Andrew_Tallon) | **NEITHER (CITE facts only)** | No open license; custody unclear (Vassar/widow). Point count/5 mm are citable facts; data NOT ingestible. |
| **AGP ~50B-pt surveys** | [link](https://artgp.fr/references/notre-dame/) | **NEITHER (CITE)** | Proprietary commissioned deliverable, no reuse license. |
| **CNRS/De Luca digital twin / Aioli** | [link](https://news.cnrs.fr/articles/a-digital-twin-for-notre-dame) | **NEITHER (CITE)** | Restricted, authenticated access, no public CC license / data charter found. |
| **chartrescathedralconceptualplan blog** (pier Ø, chevet radii) | [link](https://chartrescathedralconceptualplan.wordpress.com/) | **NEITHER** | Self-published; values are an amateur ad-quadratum *derivation* MIS-attributed to Bork/Tallon. **Hard DQ** — do not ingest, do not cite as measured. |
| **Ubisoft AC Unity model; RMN-GP scans; Microsoft/Iconem "Open ND"** | (in corpus) | **NEITHER / CITE** | Ubisoft = artistic, proprietary, not metrology (myth). RMN-GP scans = reproduction-gatekept. Microsoft/Iconem GitHub release unverified (future tense, no license found). |

---

## 7. GAPS & RISKS

**Could not source (leave as `GAP`, do not fill):**
- **Nave free-standing pier diameter** — no published figure; the 1.948/1.377/0.974 m set is uncertain + mis-attributed.
- **Per-section spire heights** (souche / fût / each gallery / aiguille) — not published; must be *scaled off the PD VLD plate* (rule_derived) or stay conjecture.
- **Vault rib section widths** (0.48 / 0.36–0.38 m) — paywalled, unverified (geometry/topology confirmed; only widths missing).
- **Chevet concentric radii** — cited-uncertain; verify against Bork 2014/2022 primaries before any numeric use.
- **Aisle/tribune vault crown heights** — not published numerically.
- **Roriczer 6×/7× vertical multiples** — read via WebFetch, not verbatim; re-confirm before hard-coding.

**Where conjecture will dominate (by design):** the *la forêt* vision shot — member sections are photo-deduced (`reconstructed_design`), and tree count (≈1,000 Épaud vs 2,000–3,400 Corvol) + timber volume (3,000–5,000 m³) are genuinely contested `conjecture`. This is the intended showcase of the pipeline's honesty, mirroring Nanchan's post-repair ridge.

**Two refuted claims now corrected in the corpus (do not regress):** (1) "height under roof ~35 m" → **REFUTED**; use **43 m under roof / 33 m vault crown** (35 m is only a loose "general interior height"). (2) "north tower 297 steps (Bell's)" → **REFUTED**, no source; dropped (historic ~387 / current ~424 if ever needed).

**Single biggest risk to a clean demo:** **provenance leakage on the chevet/pier numbers.** The most precise-looking figures (1.948 m piers, 6.65/12.42/18.18/23.94 m radii, 148 pied-du-roi) all trace to *one self-published blog* that *mis-attributes its own ad-quadratum derivations to the Bork/Tallon laser survey*. If those land in the canonical file tagged `measured`, the build ships a false "laser-measured" claim — exactly the unsourced-component failure the verifier exists to catch. **Mitigation: V13 hard-fails** any `measured` component citing those values, and they stay `GAP`/`conjecture`. The spire (PRIMARY) is low-risk: 96 m/30 m are multiply-confirmed and the drawing is cleanly PD, so anchor the demo there.

Relevant files: canonical schema to author at `/Users/austinburgess/Development/yingzao/data/notredame-canonical.json`; rule engine `/Users/austinburgess/Development/yingzao/scripts/derive.mjs`; verifier `/Users/austinburgess/Development/yingzao/scripts/verify.mjs`; provenance colors in `/Users/austinburgess/Development/yingzao/components/Viewer.tsx`. Note: prior `docs/METHODOLOGY_FOR_NOTRE_DAME.md` carries a fabricated data layer (flagged in-repo) — methodology reusable, numbers there are invalid; this corpus supersedes them.

---

## Appendix A — adversarial verification verdicts (16)

### Total exterior/structural length of the cathedral
- **verdict:** confirmed
- **asserted:** 128 m (= 420 ft; ~394 pied du roi at 0.3248 m)
- **corrected:** 128 m (420 ft; 394.1 pied du roi at 0.3248 m/pied) — no correction needed; value is accurate
- **source:** Friends of Notre-Dame de Paris — "Notre-Dame Cathedral" architecture/facts page, which states "Length: 420 feet (128 meters)" (independent of Wikipedia). Also corroborated by Wikipedia 'Notre-Dame de Paris' infobox ("Length: 128 m (420 ft)").
- https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/

### Total/maximum width at the transept
- **verdict:** confirmed
- **asserted:** 48 m (= 157 ft; ~148 pied du roi)
- **corrected:** 48 m (157 ft; ~148 pied du roi) — overall/maximum building width, equal to the transept length. Note: the narrowly-defined "transept width" (width of the transept arm) is 14 m (46 ft), per the same official source.
- **source:** Friends of Notre-Dame de Paris — official layout/architecture page ("Width: 48 m (157 ft)"; "Transept length: 48 m (157 ft)"); corroborated by Le Marais Mood ("48 meters in width at the transept level")
- https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/

### West facade width
- **verdict:** confirmed
- **asserted:** 43.5 m (= 142 ft; ~134 pied du roi)
- **corrected:** 43.5 m (= 142 ft; published sources state 135 pied du roi, though the exact conversion is ~134)
- **source:** French Wikipedia / techno-science.net mirror of "Cathédrale Notre-Dame de Paris - Éléments architecturaux extérieurs": "43,5 mètres (135 pieds-du-roi)" wide, "45 mètres (141 pieds)" high — independent of the cited Friends of Notre-Dame source, which itself states "43.5 meters wide."
- https://www.techno-science.net/glossaire-definition/Cathedrale-Notre-Dame-de-Paris-page-3.html

### Central nave width (clear span between arcade piers, inner vessel)
- **verdict:** confirmed
- **asserted:** ~13 m (= ~42 ft; ~40 pied du roi)
- **corrected:** ~13 m (central vessel / vaisseau central width) = ~42 ft = ~40 pied du roi. No correction needed; value is accurate.
- **source:** techno-science.net — "Cathédrale Notre-Dame de Paris - Structure et dimensions": "largeur du vaisseau central de la nef : 13 mètres" (independent of the two cited sources). Secondary corroboration: German Wikipedia "über 12 Metern" (cited source, consistent).
- https://www.techno-science.net/glossaire-definition/Cathedrale-Notre-Dame-de-Paris-page-4.html

### Side-aisle width (each of the inner aisles)
- **verdict:** confirmed
- **asserted:** 5.9 m (= ~19 ft; ~18.2 pied du roi). Chevet/ambulatory aisle laser-measured at 5.76 m (= 11.0 coudée)
- **corrected:** No correction needed to the numbers. Optional citation refinement: 5.9 m side-aisle width is confirmed by the Friends of Notre-Dame layout page and the official notredamedeparis.fr documentation (~19 ft / ~18.2 pied du roi). The 5.76 m chevet/ambulatory aisle width is from Robert Bork, "The Chevet Plan at Notre-Dame in Paris: A Geometrical Analysis," Architectural Histories (EAHN) 2(1), 2014, based on Andrew Tallon's laser survey (Bork: "the width of the aisles amounts to 5.76 m"). The "= 11.0 coudée" conversion is exact (5.76 / 0.5236 = 11.00) but is the chartrescathedralconceptualplan blog author's derivation from Bork's figure, not Bork's own statement.
- **source:** Friends of Notre-Dame de Paris, "The Majestic Layout of Notre-Dame" (5.9 m / 19 ft per aisle), corroborated by official notredamedeparis.fr architecture pages; and Robert Bork, "The Chevet Plan at Notre-Dame in Paris: A Geometrical Analysis," Architectural Histories (EAHN), 2(1), 2014, based on Andrew Tallon's laser survey (5.76 m aisle width). 11.0 coudée conversion verified mathematically (5.76 / 0.5236 = 11.00).
- https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/

### Nave & choir high-vault crown (keystone) height above floor
- **verdict:** confirmed
- **asserted:** 32.5-33 m (German Wikipedia 32.5 m; structurae-type sheet 33 m / 108 ft; ~100-102 pied du roi)
- **corrected:** 32.5-33 m above floor (German Wikipedia: 32.5 m; Friends of Notre-Dame / fact sheets: 33 m = 108 ft; ~100-102 pied du roi). No correction needed.
- **source:** PARISCityVISION, "Notre-Dame de Paris en chiffres" — states "La hauteur sous voute s'eleve a 33 metres." This is independent of the two cited sources (German Wikipedia and Friends of Notre-Dame). Additionally the cited Friends of Notre-Dame page itself confirms "Nave and choir vault height: 33 m (108 ft)", and German Wikipedia confirms "Das Mittelschiff erreicht 32,5 Meter Hohe."
- https://www.pariscityvision.com/fr/paris/monuments/notre-dame-de-paris/chiffres

### Height under the roof (top of vault extrados / nave roof apex interior)
- **verdict:** refuted
- **asserted:** ~35 m (43 m sometimes cited for height under the nave roof timber); interior commonly 35 m / 115 ft
- **corrected:** Height under the nave roof (hauteur sous toit, top of vault extrados / interior roof space): 43 m (141 ft). Height under the vault (hauteur sous voute, top of vault intrados, nave and choir): 33 m (108 ft); German Wikipedia gives 32.5 m precisely. The "35 m / 115 ft" figure (Britannica, German Wikipedia) is an imprecise rounded "general interior height of the building," not the height under the roof timber.
- **source:** Friends of Notre-Dame de Paris (architecture/layout page) — "Nave and choir vault height: 33 m (108 ft)" and "Height under nave roof: 43 m (141 ft)"; corroborated by the official cathedral site notredamedeparis.fr and PARISCityVISION (33 m under vault, 43 m under roof), and German Wikipedia (32.5 m nave vault). Britannica states the roof is 115 ft (35 m), a looser figure.
- https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/

### West tower height
- **verdict:** refuted
- **asserted:** 69 m (= 226 ft; ~212 pied du roi); north tower stair = 297 steps (Bell's Handbook)
- **corrected:** West tower height: 69 m (= 226 ft; ~212 pied du roi) — CONFIRMED. North tower / tower-climb step count: NOT 297. Historically/pre-fire the published count was 387 steps to the top of the tower (sometimes given as 422 to the very summit of the south tower); the post-restoration route reopened Sept 2025 is reported as 422–424 steps total. Recommend dropping the "297 steps (Bell's Handbook)" figure or replacing it with the corroborated ~387 (historic) / 424 (current) figures with a modern citation.
- **source:** German Wikipedia "Kathedrale Notre-Dame de Paris" (height 69 m); official Towers of Notre-Dame de Paris site and ParisToVersailles (step count 422–424, contradicting 297)
- https://de.wikipedia.org/wiki/Kathedrale_Notre-Dame_de_Paris ; https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/ ; https://www.paristoversailles.com/the-bell-towers-of-notre-dame-cathedral/

### Transept dimensions
- **verdict:** confirmed
- **asserted:** Transept total length (arm to arm) = 48 m (= 157 ft); transept arm width = 14 m (= ~46 ft)
- **corrected:** No correction needed. Transept length (arm to arm) = 48 m (157 ft); transept arm width = 14 m (46 ft). Minor clarification: the 48 m figure is equivalently described by some sources as the cathedral's maximum width at the transept crossing.
- **source:** Friends of Notre-Dame de Paris — "The Majestic Layout of Notre-Dame" (states transept length 48 m / 157 ft and transept width 14 m / 46 ft); secondary corroboration from Le Marais Mood "10 figures about Notre-Dame de Paris" (48 m width at transept level).
- https://www.friendsofnotredamedeparis.org/notre-dame-cathedral/architecture/layout/

### Compound/primary pier diameter (arcade piers, chevet)
- **verdict:** uncertain
- **asserted:** Primary pier diameter 1.948 m (= 6.02 pied du roi); apse column diameter 1.377 m (= 4.25 pied du roi); ambulatory/secondary column 0.974 m (= 3.0 pied du roi)
- **corrected:** Provenance correction: The pier-diameter figures (1.948 m / 6.02 PdR; 1.377 m / 4.25 PdR; 0.974 m / 3.0 PdR) are NOT from Bork's EAHN article or Tallon's laser survey. They are the author-derived Ad Quadratum construction on the chartrescathedralconceptualplan WordPress blog (primary diameter = Apse-Circle radius minus Holy-Circle radius; successive values = previous / sqrt(2)). What Bork/Tallon actually report are the chevet circle radii: 6.65, 12.42, 18.18, 23.94 m. Also: the author is Robert Bork ("R. Bork"), not "P. Bork." Treat the diameter values as one analyst's geometric reconstruction, not as independently measured/citable fabric dimensions.
- **source:** No independent corroborating source found. The only source carrying these specific values is the non-independent relayed source (chartrescathedralconceptualplan.wordpress.com), where they are explicitly the author's own Ad Quadratum derivations rather than Bork/Tallon measurements. The genuine Bork/Tallon contribution (chevet circle radii 6.65 / 12.42 / 18.18 / 23.94 m and an equilateral-triangle scheme) is documented in Robert Bork, "The Chevet Plan at Notre-Dame in Paris: A Geometrical Analysis," EAHN/Architectural Histories — but it does not state these pier diameters.
- https://chartrescathedralconceptualplan.wordpress.com/tag/derivatives-primary-pier-diameter/

### Chevet (apse) geometry — laser-measured concentric radii
- **verdict:** uncertain
- **asserted:** Apse circle (centres of 4 apse piers) r=6.65 m; ambulatory-column circle r=12.42 m; outer ambulatory edge r=18.18 m; outermost chevet r=23.94 m (diameter 47.88 m = 148.0 pied du roi). Apse diameter 13.30 m
- **corrected:** Radii 6.65 / 12.42 / 18.18 / 23.94 m and apse diameter 13.30 m are attributed to Bork's geometrical analysis of Tallon's laser survey of Notre-Dame de Paris, but this attribution is traceable only to a single self-published amateur blog (chartrescathedralconceptualplan.wordpress.com) and could not be independently verified against Bork's primary text. The conversion "diameter 47.88 m = 148.0 pied du roi" (and the related 9.405 m / 29.06 PdR 'Holy Circle') is NOT from Bork/Tallon — it is the blog author's own derivation and should not be cited to the Bork/Tallon laser analysis. Recommend citing Bork's actual publications directly: Bork, R. (2014), "Dynamic Unfolding and the Conventions of Procedure," Architectural Histories 2(1):1-20; and Bork, R. (2022), "The Design Geometry of Notre-Dame in Paris," JSAH 81(1):21-41 — and verifying the metric radii against those primary sources before use.
- **source:** Nelly Shafik Ramzy, "Concept cathedral and 'squaring the circle': Interpreting the Gothic cathedral of Notre Dame de Paris as a standing hymn," Frontiers of Architectural Research (2021) — peer-reviewed, cites Bork 2014 for the chevet geometry but does NOT contain the asserted four-radii dataset (none of 6.65/12.42/18.18/23.94/13.30/47.88/148 appears in it). The only source carrying the exact asserted numbers is the non-independent, self-published blog chartrescathedralconceptualplan.wordpress.com. Bork's primary articles (journal.eahn.org; UC Press JSAH 81(1):21-41) exist but were inaccessible (403/bot-protected) for direct numeric verification.
- https://bu.edu.eg/portal/uploads/Engineering,%20Benha/Architectural%20Engineering/6786/publications/Nelly%20Shafiq%20Ramzy_1-s2.0-S209526352100008X-main.pdf

### Sexpartite high-vault geometry (nave & choir)
- **verdict:** uncertain
- **asserted:** Rib vault divided into 6 cells by 2 diagonal ribs + 3 transverse ribs; one high vault covers a DOUBLE bay (two arcade spans) on an approximately square plan; alternation of supports (alternating strong/weak responds). Nave transverse-rib width ~0.48 m; cross (diagonal) rib width ~0.36-0.38 m
- **corrected:** Geometry portion verified as stated: a sexpartite high vault is a rib vault divided into 6 cells by 2 diagonal (cross) ribs + 3 transverse ribs, covering a double bay (two arcade spans) on an approximately square plan, associated with alternation of supports — all confirmed for Notre-Dame de Paris's nave and choir. The specific rib-width figures (transverse ~0.48 m; diagonal ~0.36-0.38 m) are PLAUSIBLE BUT UNVERIFIED; the two cited journal articles are paywalled and the exact values could not be independently confirmed. Recommend either obtaining the full-text of the cited papers to confirm the measurements, or flagging the numeric rib widths as unverified.
- **source:** Wikipedia 'Sexpartite vault' (definition: 6 bays / 2 diagonal + 3 transverse ribs; NDP listed as example); Wikipedia 'Alternation of supports' (NDP alternating piers); University of Glasgow Gothic resource (double-bay coverage + rhythmically alternating bay system). The cited Tandfonline 2024 and ScienceDirect 'Reconstructing the fallen arch' articles are paywalled (HTTP 403) and could not be read to confirm the specific rib-width numbers.
- https://en.wikipedia.org/wiki/Sexpartite_vault ; https://en.wikipedia.org/wiki/Alternation_of_supports ; https://www.gla.ac.uk/departments/gothic_open/html/partite.htm ; https://www.tandfonline.com/doi/full/10.1080/15583058.2024.2427661 (paywalled) ; https://www.sciencedirect.com/science/article/abs/pii/S1296207423000638 (paywalled)

### Interior elevation scheme (storeys)
- **verdict:** confirmed
- **asserted:** Original early-Gothic elevation = FOUR storeys: arcade, gallery (tribune), triforium/oculi zone, clerestory; five-aisle plan (double aisles + galleries above)
- **corrected:** No correction needed. Original early-Gothic (12th-century) elevation = FOUR storeys: (1) arcade/great arches on monumental columns, (2) gallery/tribune (second-story aisle), (3) zone of oculi/round-window roundels (often called a triforium of roundels), (4) clerestory. Plan = five-vessel / five-aisle (nave flanked by double aisles, continuing into a double ambulatory in the choir), with galleries/tribunes above the aisles. In the 13th-century remodeling the oculi level was removed and the clerestory windows enlarged downward toward the tribune gallery.
- **source:** Official Notre-Dame de Paris cathedral website, "Interior Architecture" page (notredamedeparis.fr) — independent of the cited Encyclopedia.com / Wikipedia sources — corroborated further by the Higher Inquietude detailed elevation account. The official site states the "four-storey elevation" with "a level of tribunes" and the "five-vessel plan" with "double aisles" and "galleries... located above the pillars... the same width as the aisles."
- https://www.notredamedeparis.fr/en/understand/architecture/interior-architecture/

### Public-domain dimensional set (Bell's Handbooks to Continental Churches, Notre-Dame de Paris)
- **verdict:** confirmed
- **asserted:** Total length 390 ft (118.87 m / ~366 pied du roi); width at transepts 144 ft (43.89 m / ~135 pied du roi); nave length 225 ft (68.58 m / ~211 pied du roi); nave width (excl. aisles) 39 ft (11.89 m / ~36.6 pied du roi); nave vault height 102 ft (31.09 m / ~95.7 pied du roi); 104 triforium columns
- **corrected:** No correction needed. All figures match the cited source verbatim: "The length of Notre Dame is 390 ft.; the width at the transepts, 144 ft.; the length of the nave, 225 ft.; and the width of the nave (without the aisles), 39 ft. The height of the vaulting is 102 ft." and "These columns [triforium] are a hundred and four in number." The metric/pied-du-roi conversions are claimant-added and arithmetically correct.
- **source:** Project Gutenberg ebook #60213 — "Notre Dame de Paris" by Charles Hiatt (Bell's Handbooks to Continental Churches), full HTML text (Gutenberg mirror at mirrorservice.org/ibiblio)
- https://www.mirrorservice.org/sites/ftp.ibiblio.org/pub/docs/books/gutenberg/6/0/2/1/60213/60213-h/60213-h.htm

### Total height of the Viollet-le-Duc spire above the ground (to the summit/rooster head)
- **verdict:** confirmed
- **asserted:** 96 m (= 295.6 pieds du roi at 0.3248 m/pied)
- **source:** French Ministry of Culture — official Notre-Dame de Paris site, "Petite histoire de la flèche" (notre-dame-de-paris.culture.gouv.fr), which states "Culminant à 96 mètres". Also corroborated by notredamedeparis.fr (96 m) and Friends of Notre-Dame de Paris (96 m).
- https://notre-dame-de-paris.culture.gouv.fr/fr/petite-histoire-de-la-fleche

### Spire base is anchored above the transept crossing, roughly at roof level
- **verdict:** confirmed
- **asserted:** ~30 m above the ground (above the crossing of the transept / croisée du transept)
- **corrected:** ~30 m above ground (anchored above the croisée du transept / transept crossing). Note: official sources vary slightly — constructionbtp.com and notredamedeparis.fr give 30 m; the Ministère de la Culture article gives 33 m for the tabouret platform. Total spire height ~96 m.
- **source:** batiactu.com / notredamedeparis.fr (official Cathédrale Notre-Dame de Paris site) and Friends of Notre-Dame de Paris — all describe the spire anchored ~30 m above ground on the four pillars of the transept crossing (independent of the cited constructionbtp.com source)
- https://www.notredamedeparis.fr/en/understand/architecture/the-spire/

---

## Appendix B — known gaps (40)

- Notre-Dame de Paris — overall geometry & published dimensions (as built/restored, pre-2019): Aisle vault crown heights in metres (inner vs. outer aisle, and gallery/tribune vault height) are not given as explicit numeric values in the accessed public sources — only the four-storey elevation and double-aisle system are documented qualitatively. Needs a measured section drawing (e.g. Viollet-le-Duc Dictionnaire plates, or Dehio-Bezold) for crown heights.
- Notre-Dame de Paris — overall geometry & published dimensions (as built/restored, pre-2019): Nave-specific free-standing pier (round 'pilier cantonne'/cylindrical column) diameter in metres — accessed laser data (Bork/Tallon) covers the CHEVET piers (1.95 m primary, 1.38 m apse, 0.97 m ambulatory). A nave-arcade pier diameter was not separately published in the sources reached.
- Notre-Dame de Paris — overall geometry & published dimensions (as built/restored, pre-2019): A directly published (non-derived) single-bay/pier-interval dimension for the nave in metres — only derivable as ~6 m from 60 m nave / 10 spans, plus the 12 m double-bay transverse-arch span. A measured longitudinal section confirming individual bay intervals (which vary) was not located.
- Notre-Dame de Paris — overall geometry & published dimensions (as built/restored, pre-2019): Dehio-Bezold ('Die kirchliche Baukunst des Abendlandes') plate scale-bar dimensions and Viollet-le-Duc Dictionnaire raisonné measured drawings were not directly fetched (the primary plates would be the authoritative public-domain dimensional source; both are out of copyright and worth retrieving directly for module/section verification).
- Notre-Dame de Paris — overall geometry & published dimensions (as built/restored, pre-2019): Bork's EAHN/Architectural Histories article (journal.eahn.org) and the Tandfonline/ScienceDirect vault papers blocked automated retrieval (403/paywall); numeric values were obtained via secondary relays and should be confirmed against the originals before asset ingestion.
- Notre-Dame de Paris — overall geometry & published dimensions (as built/restored, pre-2019): Exact reconciliation of the two length figures (128 m modern vs. 118.9 m / 390 ft in Bell's) — likely interior vs. exterior or differing end-reference; a single measured total-length survey value with defined endpoints not located.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: No single authoritative published 'height above roof' number was found. 96 m above ground and ~30 m base level are sourced; ~66 m above-base and ~45 m visible-above-ridge are derived/approximate. Sources also disagree 93 m vs 96 m (rooster base vs rooster head). Needs a primary measured-survey value if precise above-roof height is required.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: Per-section heights of the spire (exact height of the souche, octagonal fût, each of the two openwork galleries, and the aiguille in metres) were not found as published numbers. The Viollet-le-Duc Dictionnaire 'Flèche' plate (BnF ark:/12148/mm320202712p) carries scaled elevation that could be scaled off the engraving, but explicit dimensioned figures per section were not located in text.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: The original 1850s drawings give measures partly in the French royal foot system, but the specific Notre-Dame spire drawings I located express dimensions in metric or were not transcribed with numbers; explicit pied-du-roi original dimensions for THIS spire were not captured (the medieval-spire-vs-tower comparative figures in the Dictionnaire are in metres). Pied du roi = 0.3248 m conversion provided where metric medieval figures exist.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: Exact base footprint over the crossing is the irregular trapezoid ~15 x 13 m for the medieval/original crossing; the precise octagon inscribed dimension at the spire's springing was not found as a number.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: Rooster weight conflicts: ~30 kg (most sources) vs ~10 kg (one ND culture page). Original-vs-reconstruction rooster mass not cleanly separated.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: The MPP/MAP original workshop drawings (Fonds Viollet-le-Duc) are PD by age but the digital reproductions are rights-restricted (© MAP / RMN-GP). A specific freely-reusable high-resolution scan of an as-built dimensioned spire relevé (with cotes) was not located; only the Dictionnaire engraving (PD via BnF Passerelles / Wikisource) is confirmed ingestible.
- La flèche (the spire) of Notre-Dame de Paris — Viollet-le-Duc's 1859 spire, its construction, statuary, and 2019-2024 reconstruction à l'identique. Primary build target. Includes public-domain measured-drawing source locations.: Exact count distinction between '~1,000 pieces of wood' for the whole spire vs the '110 pieces' tabouret vs total piece count is not fully reconciled across sources.
- Gothic / medieval geometric design "ruleset" — documented compass-and-straightedge systems for deriving component geometry from a module (the functional analog to the Yingzao Fashi for a Notre-Dame-class reconstruction pipeline): Exact Milanese braccio in meters: no single authoritative primary figure confirmed; commonly cited ~0.595 m (braccio da fabbrica ~0.5949 m) but sources range 0.59-0.60 m. Re-verify against a Milan Cathedral / Fabbrica del Duomo metrology source before hard-coding.
- Gothic / medieval geometric design "ruleset" — documented compass-and-straightedge systems for deriving component geometry from a module (the functional analog to the Yingzao Fashi for a Notre-Dame-class reconstruction pipeline): Roriczer pinnacle vertical multiples (shaft = 6x, spire = 7x base width) were read via WebFetch from the Wikisource page rather than quoted verbatim; the exact wording (whether the multiple is of the full side or the half-side, and which sub-element it governs) needs a direct read of the verbatim 1847 / 1486 text before being used as a generative rule.
- Gothic / medieval geometric design "ruleset" — documented compass-and-straightedge systems for deriving component geometry from a module (the functional analog to the Yingzao Fashi for a Notre-Dame-class reconstruction pipeline): Specific Villard folios for arch setting-out and voussoir/stone-cutting (art du trait / stereotomy) are attested by Zenner but I did not extract the exact folio numbers/captions for those individual constructions (only fol. 18v right-angle, fol. 20v altimetry were pinned). Consult Carl F. Barnes Jr., 'The Portfolio of Villard de Honnecourt' (2009) critical edition for per-folio detail.
- Gothic / medieval geometric design "ruleset" — documented compass-and-straightedge systems for deriving component geometry from a module (the functional analog to the Yingzao Fashi for a Notre-Dame-class reconstruction pipeline): No single printed 'building code' exists for French Gothic (confirmed): the ruleset is reconstructed from (a) the few surviving treatises (Roriczer, Schmuttermayer, Villard), (b) the Milan expertise documents (Stornaloco, Mignot), and (c) measured surveys. There is no Yingzao-Fashi equivalent that fixes Notre-Dame de Paris dimensions; module values for a specific French monument must come from measured survey expressed in pied du roi (324.8 mm).
- Gothic / medieval geometric design "ruleset" — documented compass-and-straightedge systems for deriving component geometry from a module (the functional analog to the Yingzao Fashi for a Notre-Dame-class reconstruction pipeline): Gallica's precise reuse licence for the specific high-resolution image files of MS Fr 19093 (public-domain content vs. possible Gallica commercial-reuse conditions on the digital files) should be confirmed on the item's 'conditions d'utilisation' before ingesting raster scans as assets; the underlying medieval work is unambiguously public domain.
- Notre-Dame de Paris — lost medieval (13th-c.) oak roof timber frame ("la forêt"), destroyed 15 April 2019: Per-member original survey cross-sections (équarrissage) directly from the Fromont & Trentesaux relevé published in Monumental 2016-1 were not retrievable in this session — only the arXiv paper's photo-deduced sections (Table 1) were obtained. The Monumental article is behind a paywall/print and should be consulted for the authoritative measured sections.
- Notre-Dame de Paris — lost medieval (13th-c.) oak roof timber frame ("la forêt"), destroyed 15 April 2019: A single authoritative total timber-volume figure for the lost frame does not exist as a measurement; only broad expert estimates (3,000-5,000 m3, Corvol) and modelled per-unit volumes (arXiv Table 2). The true total is unknowable from the destroyed structure.
- Notre-Dame de Paris — lost medieval (13th-c.) oak roof timber frame ("la forêt"), destroyed 15 April 2019: Exact number of trees is genuinely contested: Épaud ~1,000 vs Corvol ~2,000-3,400 oaks. No measured value possible.
- Notre-Dame de Paris — lost medieval (13th-c.) oak roof timber frame ("la forêt"), destroyed 15 April 2019: Henri Deneux's original measured survey drawings (1915-1927), the most precise pre-modern dimensional record, were not located online in this session; they are held in French archives (Médiathèque du Patrimoine / archives of the cathedral works) and may carry archival rights restrictions.
- Notre-Dame de Paris — lost medieval (13th-c.) oak roof timber frame ("la forêt"), destroyed 15 April 2019: Precise number of PRINCIPAL frames (chevrons maîtres / fermes principales) vs total frames per bay: arXiv labels them FC1-FC10+ (choir) and FN0-FN13+ (nave) but a clean total count of principal-only frames was not isolated; principal-frame spacing is 4.1 m (choir) / 3.5 m (nave) with 4 fermettes between each.
- Notre-Dame de Paris — lost medieval (13th-c.) oak roof timber frame ("la forêt"), destroyed 15 April 2019: The ridge height 'above the vaults' is reported only as the ~10 m charpente height and the ~2.70 m clerestory raising; an exact ridge-above-vault-crown figure with survey provenance was inferred (vault ~33 m, ridge ~43-45 m above floor) rather than stated as a single sourced datum.
- Notre-Dame de Paris reconstruction data sources — RIGHTS / access-license inventory (USE vs CITE vs NEITHER): No formal public 'data charter' (charte des données) document for the CNRS Chantier scientifique was locatable online. The De Luca J. Cultural Heritage 2023 paper (HAL hal-04300455) and the companion 'digital platform for centralization and long-term preservation' paper (ScienceDirect S1296207423001929) are the likely places it is described, but both were blocked (HAL Anubis 403; ScienceDirect 403). Recommend retrieving the open-access HAL PDFs directly to confirm exact data-governance/licensing language before relying on it.
- Notre-Dame de Paris reconstruction data sources — RIGHTS / access-license inventory (USE vs CITE vs NEITHER): Exact present-day custodian and access policy of Andrew Tallon's full 1-billion-point cloud is unconfirmed (reporting splits between Vassar and his widow Marie Tallon; no institutional repository or license identified). The DRAC/restoration architects reportedly received working copies, but no public license exists.
- Notre-Dame de Paris reconstruction data sources — RIGHTS / access-license inventory (USE vs CITE vs NEITHER): AGP point clouds: no published license or rights statement at all (neither open nor explicitly all-rights-reserved in the sources found). Treated as restricted by default; confirm with AGP/EPRNDP if any subset was released.
- Notre-Dame de Paris reconstruction data sources — RIGHTS / access-license inventory (USE vs CITE vs NEITHER): Could not load the live Gallica per-document rights banner for ark:/12148/bpt6k104823k (403). The pre-1900 public-domain status is virtually certain under Gallica policy, but verify the specific 'Conditions d'utilisation' banner at ingest.
- Notre-Dame de Paris reconstruction data sources — RIGHTS / access-license inventory (USE vs CITE vs NEITHER): The art.rmngp.fr page for the 1843 facade watercolor failed to load (TLS cert altname invalid); RMN-GP-specific reproduction terms for that exact image were inferred from RMN-GP's general model, not read verbatim.
- Notre-Dame de Paris reconstruction data sources — RIGHTS / access-license inventory (USE vs CITE vs NEITHER): No medieval (original-fabric) MEASURED dimensions were sourced in this rights pass — all openly usable drawing sources here are 19th-century reconstructed_design (Lassus/Viollet-le-Duc, Dehio-Bezold). Direct measured medieval geometry would have to come from the restricted scan datasets (Tallon/AGP/CNRS), which cannot be ingested. Pied du roi conversion (324.8 mm) noted for any future medieval measures; none were available to convert here.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: No confirmed OPEN, licensed dataset (point cloud, mesh, or BIM) of Notre-Dame was found that the pipeline could legitimately ingest. Every measured dataset located (Tallon ~1B points, AGP ~50B points, CNRS digital twin) is restricted/proprietary or has unstated license terms.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Whether the CNRS/MAP digital twin actually opened to researchers in 2025, and under what license (CC-BY? research-only? embargoed?) - sources state intent ('opened to the international research community in 2025') but give no concrete access/license terms. Needs a direct check of Huma-Num / 3D-SHS / MASA / Aioli.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Whether the Microsoft + Iconem 'Open Notre-Dame' temporal 3D models were ever actually published on GitHub and under what license - press used future tense and named no license. This is the top lead for genuinely open data; verify the Iconem and Microsoft GitHub orgs directly.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Exact license of the 'Mapping Gothic France' / Media Center for Art History (Columbia) imagery and drawings - described as 'open source' but no CC license confirmed in sources reviewed.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Confirmed scanner model for Tallon's survey - widely reported as Leica ScanStation C10, but National Geographic (primary-ish) did not name the model; treat as secondary-sourced.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Precise, certified survey accuracy for the actual Notre-Dame scans (the '5 mm' is a general laser-scan capability statement, not a per-campaign certified tolerance).
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Official notredamedeparis.fr pages (the/spire and plans/elevations) returned HTTP 403 to the automated fetch tool - dimensions were cross-checked via Friends of Notre-Dame de Paris (which cites the official site) and Britannica/Wikipedia, but a human should confirm directly on notredamedeparis.fr.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Whether the rebuilt spire's detailed structural drawings (Remi Fromont / Cedric Trentesaux releve of the Viollet-le-Duc spire) are publicly available - these would be the authoritative 'reconstructed_design' source for spire geometry and were not located in this pass.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Pre-fire roof framing ('la foret') exact member dimensions and the 13th-century vs Viollet-le-Duc timber geometry - relevant for the spire/roof, not captured here.
- Notre-Dame de Paris: existing digital reconstruction efforts (laser/point cloud, photogrammetry, BIM/digital twin, Ubisoft AC Unity model), 2019 fire / 2024 reopening timeline, and rights/openness of datasets: Exact reconciliation of 'two years' vs '14 months' vs '~5,000 hours' for the Ubisoft model - figures conflict across outlets; no single authoritative Ubisoft statement located.
