# Derivation Log — 南禅寺大殿 Nanchan Temple Main Hall

Rule Engine run. Inputs: `data/nanchan-canonical.json` (ZHANG2022 survey, QI1980 repair record) + 营造法式 (YZFS, 1103) rules.
Precedence: measured/reconstructed → YZFS rule → flagged conjecture. Deviations are data, not errors.

## 0. Modular system 材分
- 1 fen 分° = 16.5 mm; 1 营造尺 = 300 mm [ZHANG2022 — 57-arm caliper study]
- 材等: 二等材 (Grade II of Yingzao Fashi's eight grades); 单材 10×15 分, 足材 21 分 [ZHANG2022; YZFS 卷四]

## 1. Column grid 柱网
- Facade bays 面阔 = 200:300:200 fen → total 700 fen = 11550 mm [ZHANG2022, reconstructed_design]
- Depth bays 进深 = 200×3 → total 600 fen [ZHANG2022]
- Column x-axes: ±350, ±150; z-axes: ±300, ±100. Perimeter only — 12 columns, 0 interior (厅堂式 彻上明造).
- 平柱 height = 13 尺 = 3900 mm = 236.4 fen (controlled in chi, not fen) [ZHANG2022]
- 生起 corner rise = +2 fen — measured, GENTLER than YZFS 卷五 「三间生高二寸」 (≈3.6 fen). Deviation kept. [ZHANG2022]
- Round column ⌀ 24 fen. Three square columns on the west gable are later replacements → conjecture. [ZHANG2022]

## 2. Platform 台基
- No published platform dimensions in the corpus. Sized for visual context: grid + 130 fen margin, 40 fen high → CONJECTURE (renders red; honest label, not data).

## 3. Columns — 12 placed (4 corner +2 fen 生起, 3 west-gable square columns flagged conjecture).

## 4. Bracket sets 五铺作双杪偷心造 — column-top only, no intercolumnar sets
- Vertical stack: ludou lift 11 + 4 tiers × 足材 21 = 95 fen = 95 fen ✓ matches reconstructed total (ludou underside → 撩檐枋 top) [ZHANG2022]
  - tier levels above ludou underside: 华栱一跳 11–32, 华栱二跳 32–53, 令栱层 53–74, 撩檐枋 74–95
- 栌斗 29×26×18 fen — smaller than YZFS 32×32×20; ludou lift 11 vs typical 12. Deviations kept. [ZHANG2022 caliper]
- Outward jumps 27+20 = 47 fen (= 撩檐 offset, V06). Jump 1 complies with YZFS 30-fen cap.
- Inward jumps: front/rear 32, gable 35+22 — EXCEED the 30-fen cap and exceed outward jumps; structural optimization under the beams. Deviation kept. [ZHANG2022]
- 足材 strengthening: load-bearing first-jump 华栱 (and central-bay 2nd jumps) 11 fen wide vs 10 elsewhere (ANOVA p=8.18e-11) — the keystone mechanics story (V12). [ZHANG2022]
- 泥道栱 = 令栱 = 70 fen (YZFS: 62/72 inverted) — deviation kept.

Placed 12 bracket sets (8 column-top + 4 corner, corner sets simplified v1).

## 5. Roof frame 四架椽屋 — purlins & beams
- Purlin spacing = total depth 600 / 4 rafters = 150 fen each: 牛脊枋 z=±300, 平槫 z=±150, 脊槫 z=0 — equal 150-fen intervals [ZHANG2022, V08]
- 撩檐枋 horizontal offset from 牛脊枋 = 27+20 = 47 fen ✓; front-to-rear span = 694 fen = 2×347 ✓ [ZHANG2022, V06/V08]
- 举高 RISE = 130 fen over half-span 347 → ratio 1:2.67 ≈ 1:2.67 — GENTLER than YZFS 1:3 (would be ~231 fen). CONJECTURE: the 1974–75 repair removed ridge-area members, so the original rise is uncertain. Propagates to all rise-dependent members (V09: do NOT correct toward the rulebook). [ZHANG2022/QI1980]
- 折屋 heights above 撩檐枋背 (331.4 fen abs): 脊槫背 +130 = 461.4; 平槫 chord 130×(347−150)/347 = 73.8 − depression 10 (measured; rule says 13) = 63.8 → 395.2; 牛脊枋 chord = 17.6 → 349

- 四椽栿 section: no measured value in corpus → YZFS 卷五 用梁之制 「四椽栿广两材两栔」= 2×15+2×6 = 42 fen, width 2/3 ≈ 28 → rule_derived
- 平梁 section: YZFS 「平梁广两材一栔」= 36 fen → rule_derived

Frame: 2×四椽栿, 2×平梁, 4×驼峰(conjecture), 4×大叉手(conjecture, propagated), 2×丁栿 placed.

## 6. Purlins — 脊槫(conjecture-height) / 平槫×2 / 牛脊枋×2 / 撩檐枋×4 placed; intervals 150 fen ✓.

## 7. Roof surfaces 歇山顶
- Lower slope: 撩檐枋背 331.4 → 平槫 395.2 over run 197 fen; upper slope: → 脊槫 461.4 over 150 fen (steeper — 举折 curvature visible).
- Eave projection 2340 mm = 141.8 fen beyond 撩檐枋 — 1974–75 restoration estimate, explicitly unusable as design evidence → CONJECTURE [QI1980].
- 歇山收山 simplified v1: ridge length 400 fen, gable triangles at x=±200; refine later.

- 檐椽: YZFS 卷五 用椽之制 椽径≈9 分, 一椽一档 (spacing 18 fen). The exposed eave portion embodies the 1975 conjectural projection → conjecture (propagated). Eave drop 39 fen with slight 檐口微翘.
- 檐椽 placed: 134 rafters (front/rear + gable rows).
## 8. Altar 佛坛 — height 720 mm = 43.6 fen; clearances front 1510 / sides 1265 / rear 1320 mm → 546.7×428.5 fen, offset -5.8 fen rearward [ZHANG2022, measured]

## 9. Secondary members 阑额 · 柱础 · 散斗 · 柱头枋 · 正脊 · 围护
- 阑额: YZFS 卷五 「凡用阑额…广加材一倍」= 30 fen, 厚 20 → rule_derived. Top flush with column top. NO 普拍枋 above — an early-period trait, kept.
- 柱础: YZFS 卷三 「础方倍柱之径」 → 覆盆 plinth r≈17 fen, rule_derived (present but unrecorded in corpus).
- 散斗: YZFS 卷四 造斗之制 (corpus lacks explicit dou dims) → rule_derived; placed on 泥道栱 and 令栱 ends.
- 柱头枋: continuous wall-plane ties above the 泥道栱 (the 牛脊枋 rides the 2nd tier) → rule_derived.
- 正脊/鸱尾: form from Tang-period Dunhuang mural evidence (color-evidence list) — CITED CONJECTURE; height rides the conjectural rise (propagated).
- 围护 (today's fabric): white walls, central-bay double door, side-bay 直棂窗 — present in the building, dimensions NOT in corpus → conjecture (non-structural infill, labeled).

## 10. Provenance audit
- Components: 335 total — conjecture: 191, reconstructed_design: 73, rule_derived: 70, measured: 1
- Audit gate: every component carries {provenance, source} — enforced at emit time; an unsourced component throws.

## 11. Deviations from the Yingzao Fashi (kept, never corrected)
- zucai hua-gong width 11 fen (Fashi: uniform)
- inward jumps 32–35 fen exceed 30-fen cap
- ludou 29×26×18 fen (Fashi: 32×32×20)
- ling-gong 70 = nidao 70 (Fashi: 72 > 62 inverted)
- corner rise 2 fen, gentler than 「三间生高二寸」
- roof ratio 1:2.67, gentler than 1:3 rule
- ludou lift 11 fen vs typical 12

*The 782 building outranks the 1103 rulebook.*
