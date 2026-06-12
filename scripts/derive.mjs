#!/usr/bin/env node
/**
 * Yingzao Rule Engine — derives structural-spec.json from the canonical survey
 * data plus Yingzao Fashi rules. Deterministic, zero API calls.
 *
 * Precedence contract (PRD §7.2):
 *   measured / reconstructed_design  >  Fashi rule (rule_derived)  >  conjecture
 * A sourced value is never overridden by a rule. Deviations from the Fashi are
 * kept and annotated, never "fixed". Conjectural inputs propagate to dependents.
 *
 * Outputs: artifacts/structural-spec.json, artifacts/derivation-log.md
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const C = JSON.parse(readFileSync(join(ROOT, "data/nanchan-canonical.json"), "utf8"));

const FEN_MM = C.modular_system.fen_mm.value; // 16.5
const log = [];
const L = (s) => log.push(s);
const components = [];

/** Push a component; hard-fail if it lacks provenance or source (audit gate). */
function comp(c) {
  if (!c.provenance || !c.source) {
    throw new Error(`UNSOURCED COMPONENT: ${c.id} — nothing renders without a source.`);
  }
  components.push(c);
}

const r1 = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------------------
L(`# Derivation Log — 南禅寺大殿 Nanchan Temple Main Hall`);
L(``);
L(`Rule Engine run. Inputs: \`data/nanchan-canonical.json\` (ZHANG2022 survey, QI1980 repair record) + 营造法式 (YZFS, 1103) rules.`);
L(`Precedence: measured/reconstructed → YZFS rule → flagged conjecture. Deviations are data, not errors.`);
L(``);
L(`## 0. Modular system 材分`);
L(`- 1 fen 分° = ${FEN_MM} mm; 1 营造尺 = ${C.modular_system.yingzao_chi_mm.value} mm [ZHANG2022 — 57-arm caliper study]`);
L(`- 材等: ${C.modular_system.cai_grade.value}; 单材 10×15 分, 足材 21 分 [ZHANG2022; YZFS 卷四]`);
L(``);

// --- Plan / column grid ----------------------------------------------------
const sideBay = C.plan.side_bay_width.fen;      // 200
const centralBay = C.plan.central_bay_width.fen; // 300
const depthBay = C.plan.depth_bay_each.fen;     // 200
const totalW = 2 * sideBay + centralBay;        // 700
const totalD = 3 * depthBay;                    // 600

L(`## 1. Column grid 柱网`);
L(`- Facade bays 面阔 = ${sideBay}:${centralBay}:${sideBay} fen → total ${totalW} fen = ${totalW * FEN_MM} mm [ZHANG2022, reconstructed_design]`);
L(`- Depth bays 进深 = ${depthBay}×3 → total ${totalD} fen [ZHANG2022]`);
L(`- Column x-axes: ±${totalW / 2}, ±${centralBay / 2}; z-axes: ±${totalD / 2}, ±${depthBay / 2}. Perimeter only — ${C.plan.column_count} columns, 0 interior (厅堂式 彻上明造).`);

const XS = [-totalW / 2, -centralBay / 2, centralBay / 2, totalW / 2]; // -350,-150,150,350
const ZS = [-totalD / 2, -depthBay / 2, depthBay / 2, totalD / 2];     // -300,-100,100,300

const pingzhuMM = C.columns.pingzhu_height.mm;       // 3900
const Hcol = r1(pingzhuMM / FEN_MM);                  // 236.4 fen — controlled in chi
const shengqi = C.columns.corner_rise_shengqi.fen;    // 2
const colR = C.columns.diameter_round.fen / 2;        // 12

L(`- 平柱 height = 13 尺 = ${pingzhuMM} mm = ${Hcol} fen (controlled in chi, not fen) [ZHANG2022]`);
L(`- 生起 corner rise = +${shengqi} fen — measured, GENTLER than YZFS 卷五 「三间生高二寸」 (≈3.6 fen). Deviation kept. [ZHANG2022]`);
L(`- Round column ⌀ ${colR * 2} fen. Three square columns on the west gable are later replacements → conjecture. [ZHANG2022]`);
L(``);

// --- Platform (no published dimension — visual context only) ---------------
const PLAT_MARGIN = 130; // fen beyond column grid
const PLAT_H = 40;
L(`## 2. Platform 台基`);
L(`- No published platform dimensions in the corpus. Sized for visual context: grid + ${PLAT_MARGIN} fen margin, ${PLAT_H} fen high → CONJECTURE (renders red; honest label, not data).`);
L(``);
comp({
  id: "platform",
  name_zh: "台基", name_en: "Platform",
  phase: "platform",
  role: "Raised earthen-core masonry platform carrying the entire timber frame.",
  geometry: { type: "box", w: totalW + 2 * PLAT_MARGIN, h: PLAT_H, d: totalD + 2 * PLAT_MARGIN },
  position: [0, -PLAT_H / 2, 0],
  provenance: "conjecture",
  source: "No published dimension in corpus — sized for visual context only",
});

// --- Columns ---------------------------------------------------------------
const squareCols = new Set(["-350,-300", "-350,-100", "-350,100"]); // west gable, 3 of 4
let colIdx = 0;
const columnTop = {}; // key "x,z" -> top y (fen)
for (const x of XS) {
  for (const z of ZS) {
    const isPerimeter = Math.abs(x) === totalW / 2 || Math.abs(z) === totalD / 2;
    if (!isPerimeter) continue;
    const isCorner = Math.abs(x) === totalW / 2 && Math.abs(z) === totalD / 2;
    const h = isCorner ? Hcol + shengqi : Hcol;
    const key = `${x},${z}`;
    const isSquare = squareCols.has(key);
    columnTop[key] = h;
    colIdx++;
    comp({
      id: `col-${colIdx}`,
      name_zh: isCorner ? "角柱" : isSquare ? "方柱（西山面，后代更换）" : "檐柱",
      name_en: isCorner ? "Corner column" : isSquare ? "Square column (west gable, later replacement)" : "Eave column",
      phase: "columns",
      role: isCorner
        ? `Corner column with 生起 rise of +${shengqi} fen — gentler than the YZFS rule, a documented deviation.`
        : "Perimeter eave column; the hall has no interior columns, freeing the floor for the altar.",
      geometry: isSquare
        ? { type: "box", w: colR * 2, h, d: colR * 2 }
        : { type: "cylinder", r: colR, h },
      position: [x, h / 2, z],
      provenance: isSquare ? "conjecture" : "reconstructed_design",
      source: "ZHANG2022",
      yzfs_ref: isCorner ? C.columns.corner_rise_shengqi.yzfs_ref : C.columns.diameter_round.yzfs_ref,
      deviation_from_fashi: isCorner ? true : undefined,
      note: isSquare ? C.columns.square_columns.note : undefined,
    });
  }
}
L(`## 3. Columns — ${colIdx} placed (4 corner +${shengqi} fen 生起, 3 west-gable square columns flagged conjecture).`);
L(``);

// --- Bracket sets 五铺作 ----------------------------------------------------
const P = C.bracket_sets_puzuo;
const ludou = P.ludou_capital_block;          // 29×26×18, lift 11
const LIFT = 11;                               // ludou lift (vs typical 12) [ZHANG2022]
const ZUCAI = C.modular_system.cai_grade.zucai_height_fen; // 21
const CAI_H = C.modular_system.cai_grade.cai_height_fen;   // 15
const j1out = P.hua_gong_outward_jumps.jump1_fen; // 27
const j2out = P.hua_gong_outward_jumps.jump2_fen; // 20
const inFR = P.hua_gong_inward_jumps.front_rear_jump1_fen; // 32
const inG1 = P.hua_gong_inward_jumps.gable_jump1_fen;      // 35
const inG2 = P.hua_gong_inward_jumps.gable_jump2_fen;      // 22
const ARM_W = P.zucai_strengthening.other_arms_width_fen;  // 10
const ARM_W_STRONG = P.zucai_strengthening.arm_width_fen;  // 11
const GONG_LEN = P.transverse_arms.nidao_gong_fen;         // 70 (= ling gong 70)
const STACK = P.puzuo_total_height.fen;                    // 95
const HEAD = 6; // arm head extension beyond jump centre, render allowance

L(`## 4. Bracket sets 五铺作双杪偷心造 — column-top only, no intercolumnar sets`);
L(`- Vertical stack: ludou lift ${LIFT} + 4 tiers × 足材 ${ZUCAI} = ${LIFT + 4 * ZUCAI} fen = ${STACK} fen ✓ matches reconstructed total (ludou underside → 撩檐枋 top) [ZHANG2022]`);
L(`  - tier levels above ludou underside: 华栱一跳 ${LIFT}–${LIFT + ZUCAI}, 华栱二跳 ${LIFT + ZUCAI}–${LIFT + 2 * ZUCAI}, 令栱层 ${LIFT + 2 * ZUCAI}–${LIFT + 3 * ZUCAI}, 撩檐枋 ${LIFT + 3 * ZUCAI}–${STACK}`);
L(`- 栌斗 ${ludou.width_fen}×${ludou.depth_fen}×${ludou.height_fen} fen — smaller than YZFS 32×32×20; ludou lift ${LIFT} vs typical 12. Deviations kept. [ZHANG2022 caliper]`);
L(`- Outward jumps ${j1out}+${j2out} = ${j1out + j2out} fen (= 撩檐 offset, V06). Jump 1 complies with YZFS 30-fen cap.`);
L(`- Inward jumps: front/rear ${inFR}, gable ${inG1}+${inG2} — EXCEED the 30-fen cap and exceed outward jumps; structural optimization under the beams. Deviation kept. [ZHANG2022]`);
L(`- 足材 strengthening: load-bearing first-jump 华栱 (and central-bay 2nd jumps) ${ARM_W_STRONG} fen wide vs ${ARM_W} elsewhere (ANOVA p=8.18e-11) — the keystone mechanics story (V12). [ZHANG2022]`);
L(`- 泥道栱 = 令栱 = ${GONG_LEN} fen (YZFS: 62/72 inverted) — deviation kept.`);
L(``);

let puzuoIdx = 0;
for (const x of XS) {
  for (const z of ZS) {
    const key = `${x},${z}`;
    if (!(key in columnTop)) continue;
    const top = columnTop[key];
    const isCorner = Math.abs(x) === totalW / 2 && Math.abs(z) === totalD / 2;
    const onFrontRear = Math.abs(z) === totalD / 2 && !isCorner;
    const isCentralBayCol = onFrontRear && Math.abs(x) === centralBay / 2;
    // outward direction unit vector
    const dir = isCorner
      ? [Math.sign(x) * Math.SQRT1_2, Math.sign(z) * Math.SQRT1_2]
      : onFrontRear ? [0, Math.sign(z)] : [Math.sign(x), 0];
    puzuoIdx++;
    const pid = `pz-${puzuoIdx}`;
    const kind = isCorner ? "转角铺作" : "柱头铺作";
    const base = {
      phase: "puzuo",
      provenance: "reconstructed_design",
      source: "ZHANG2022 (caliper + point-cloud)",
    };

    // 栌斗 — wide face along the wall it sits in
    const alongX = onFrontRear || isCorner;
    comp({
      ...base,
      id: `${pid}-ludou`,
      name_zh: `栌斗（${kind}）`, name_en: "Ludou capital block",
      role: "Capital block collecting the whole bracket set's load into the column.",
      geometry: {
        type: "box",
        w: alongX ? ludou.width_fen : ludou.depth_fen,
        h: ludou.height_fen,
        d: alongX ? ludou.depth_fen : ludou.width_fen,
      },
      position: [x, top + ludou.height_fen / 2, z],
      yzfs_ref: ludou.yzfs_ref,
      deviation_from_fashi: true,
      note: ludou.note,
    });

    // 华栱 tiers — boxes along the jump direction
    const inward1 = isCorner ? inFR : onFrontRear ? inFR : inG1;
    const inward2 = isCorner ? 0 : onFrontRear ? 0 : inG2;
    const tiers = [
      { n: 1, out: j1out, inw: inward1, w: ARM_W_STRONG, strong: true },
      { n: 2, out: j1out + j2out, inw: inward2 || inward1, w: isCentralBayCol ? ARM_W_STRONG : ARM_W, strong: isCentralBayCol },
    ];
    for (const t of tiers) {
      const len = t.out + t.inw + 2 * HEAD;
      const centerAlong = (t.out - t.inw) / 2;
      const y = top + LIFT + (t.n - 1) * ZUCAI + ZUCAI / 2;
      const cx = x + dir[0] * centerAlong;
      const cz = z + dir[1] * centerAlong;
      const diag = isCorner;
      comp({
        ...base,
        id: `${pid}-hg${t.n}`,
        name_zh: `${diag ? "角" : ""}华栱（${t.n === 1 ? "第一跳" : "第二跳"}${t.strong ? "，足材加宽" : ""}）`,
        name_en: `${diag ? "Corner " : ""}Hua-gong arm, jump ${t.n}${t.strong ? " (strengthened, 11 fen)" : ""}`,
        role: t.strong
          ? "Load-bearing projecting arm widened to 11 fen — the builders bent the modular system for mechanics, centuries before Ming/Qing practice."
          : "Projecting arm stepping the eave load outward; 偷心造 — no transverse arm rides this jump.",
        geometry: diag
          ? { type: "box", w: len, h: ZUCAI, d: t.w }
          : { type: "box", w: dir[0] ? len : t.w, h: ZUCAI, d: dir[1] ? len : t.w },
        position: [cx, y, cz],
        rotation_deg: diag ? [0, -Math.sign(dir[0] * dir[1]) * 45, 0] : undefined,
        yzfs_ref: t.n === 1 ? P.hua_gong_outward_jumps.yzfs_ref : undefined,
        deviation_from_fashi: t.inw > 30 || t.strong ? true : undefined,
        note: isCorner ? "Corner set simplified: diagonal arm only (v1); full 转角铺作 composition deferred." : undefined,
      });
    }

    // 泥道栱 — transverse arm in the wall plane, in the ludou mouth
    comp({
      ...base,
      id: `${pid}-nidao`,
      name_zh: "泥道栱", name_en: "Nidao gong (wall-plane arm)",
      role: "Transverse arm in the wall plane carrying the 柱头枋 tiers.",
      geometry: { type: "box", w: alongX ? GONG_LEN : ARM_W, h: CAI_H, d: alongX ? ARM_W : GONG_LEN },
      position: [x, top + LIFT + CAI_H / 2, z],
      yzfs_ref: P.transverse_arms.yzfs_ref,
      deviation_from_fashi: true,
      note: "70 fen — equals the ling gong, breaking the usual early pattern (YZFS: 62).",
    });

    // 令栱 — at the second jump head, carrying the 撩檐枋
    if (!isCorner) {
      const off = j1out + j2out;
      comp({
        ...base,
        id: `${pid}-ling`,
        name_zh: "令栱", name_en: "Ling gong (eave-purlin arm)",
        role: "Outermost transverse arm receiving the 撩檐枋 that carries the eave.",
        geometry: { type: "box", w: dir[0] ? ARM_W : GONG_LEN, h: CAI_H, d: dir[1] ? ARM_W : GONG_LEN },
        position: [x + dir[0] * off, top + LIFT + 2 * ZUCAI + CAI_H / 2, z + dir[1] * off],
        deviation_from_fashi: true,
        note: "70 fen, not shorter than the nidao gong (YZFS expects 72>62 the other way).",
      });
    }
  }
}
L(`Placed ${puzuoIdx} bracket sets (${puzuoIdx - 4} column-top + 4 corner, corner sets simplified v1).`);
L(``);

// --- Beam frame 四架椽屋 ----------------------------------------------------
const RF = C.roof_frame;
const liaoyanOff = RF.liaoyan_to_niuji_horizontal.fen; // 47 = 27+20 ✓
const liaoyanZ = totalD / 2 + liaoyanOff;              // 347
const liaoyanSpan = RF.liaoyan_purlin_span_front_to_rear.fen; // 694
const RISE = RF.total_rise_juwu.fen;                   // 130 — CONJECTURE (1975 repair)
const liaoyanTopY = Hcol + STACK;                      // 331.4
const ridgeTopY = liaoyanTopY + RISE;                  // 461.4
const DEPRESS = 10;                                    // measured mid-purlin depression (rule: 13)

L(`## 5. Roof frame 四架椽屋 — purlins & beams`);
L(`- Purlin spacing = total depth ${totalD} / 4 rafters = ${totalD / 4} fen each: 牛脊枋 z=±${totalD / 2}, 平槫 z=±${totalD / 4}, 脊槫 z=0 — equal ${totalD / 4}-fen intervals [ZHANG2022, V08]`);
L(`- 撩檐枋 horizontal offset from 牛脊枋 = ${j1out}+${j2out} = ${liaoyanOff} fen ✓; front-to-rear span = ${liaoyanSpan} fen = 2×${liaoyanZ} ✓ [ZHANG2022, V06/V08]`);
L(`- 举高 RISE = ${RISE} fen over half-span ${liaoyanSpan / 2} → ratio 1:${r1(liaoyanSpan / 2 / RISE / 1) === 0 ? "" : (liaoyanSpan / 2 / RISE).toFixed(2)} ≈ 1:2.67 — GENTLER than YZFS 1:3 (would be ~231 fen). CONJECTURE: the 1974–75 repair removed ridge-area members, so the original rise is uncertain. Propagates to all rise-dependent members (V09: do NOT correct toward the rulebook). [ZHANG2022/QI1980]`);
const pingChord = RISE * (liaoyanZ - totalD / 4) / liaoyanZ;
const pingY = liaoyanTopY + pingChord - DEPRESS;
const niujiY = liaoyanTopY + RISE * (liaoyanZ - totalD / 2) / liaoyanZ;
L(`- 折屋 heights above 撩檐枋背 (${r1(liaoyanTopY)} fen abs): 脊槫背 +${RISE} = ${r1(ridgeTopY)}; 平槫 chord ${RISE}×(${liaoyanZ}−${totalD / 4})/${liaoyanZ} = ${r1(pingChord)} − depression ${DEPRESS} (measured; rule says 13) = ${r1(pingY - liaoyanTopY)} → ${r1(pingY)}; 牛脊枋 chord = ${r1(niujiY - liaoyanTopY)} → ${r1(niujiY)}`);
L(``);

// 四椽栿 — YZFS 卷五 用梁之制: 四椽栿 广两材两栔 = 2×15+2×6 = 42 fen, width ≈ 2/3 → 28
const BEAM4_H = 42, BEAM4_W = 28;
const BEAM2_H = 36, BEAM2_W = 24; // 平梁 广两材一栔 = 36
L(`- 四椽栿 section: no measured value in corpus → YZFS 卷五 用梁之制 「四椽栿广两材两栔」= 2×15+2×6 = ${BEAM4_H} fen, width 2/3 ≈ ${BEAM4_W} → rule_derived`);
L(`- 平梁 section: YZFS 「平梁广两材一栔」= ${BEAM2_H} fen → rule_derived`);
L(``);

for (const sx of [-1, 1]) {
  const x = sx * centralBay / 2;
  const beamTopY = Hcol + LIFT + 2 * ZUCAI + BEAM4_H; // rests atop inward jump-2 tier
  comp({
    id: `beam4-${sx > 0 ? "E" : "W"}`,
    name_zh: "四椽栿", name_en: "Four-rafter beam",
    phase: "frame",
    role: "Main transverse beam spanning the full 600-fen depth in one leap — possible only because the hall is small; carried on the lengthened inward bracket jumps.",
    geometry: { type: "box", w: BEAM4_W, h: BEAM4_H, d: totalD + 2 * inFR },
    position: [x, beamTopY - BEAM4_H / 2, 0],
    provenance: "rule_derived",
    source: "Span: ZHANG2022 grid; section: YZFS 卷五 用梁之制",
    yzfs_ref: "YZFS 卷五 「四椽栿广两材两栔」",
  });
  // 驼峰 camel humps under 平梁 — removed in 1975 repair → conjecture
  for (const sz of [-1, 1]) {
    comp({
      id: `tuofeng-${sx > 0 ? "E" : "W"}${sz > 0 ? "S" : "N"}`,
      name_zh: "驼峰（1975 年修缮拆除，推想复原）", name_en: "Camel hump (removed 1974–75, conjectural)",
      phase: "frame",
      role: "Bearing block between the four-rafter beam and the ping beam. The 1974–75 repair removed the originals; this is a flagged guess.",
      geometry: { type: "box", w: 30, h: 20, d: 24 },
      position: [x, beamTopY + 10, sz * depthBay / 2],
      provenance: "conjecture",
      source: "QI1980 via ZHANG2022 — ridge-area members removed in repair",
    });
  }
  const pbTopY = beamTopY + 20 + BEAM2_H;
  comp({
    id: `pingliang-${sx > 0 ? "E" : "W"}`,
    name_zh: "平梁", name_en: "Ping beam (two-rafter beam)",
    phase: "frame",
    role: "Upper beam spanning the middle two rafter-bays; the scissor braces rise from its ends to the ridge.",
    geometry: { type: "box", w: BEAM2_W, h: BEAM2_H, d: depthBay + 40 },
    position: [x, pbTopY - BEAM2_H / 2, 0],
    provenance: "rule_derived",
    source: "Span: ZHANG2022 purlin grid; section: YZFS 卷五",
    yzfs_ref: "YZFS 卷五 「平梁广两材一栔」",
  });
  // 大叉手 scissor braces → ridge. Rise is conjectural ⇒ propagates.
  for (const sz of [-1, 1]) {
    const x1 = depthBay / 2, y1 = pbTopY;            // foot at ping beam end
    const y2 = ridgeTopY - 21;                        // under ridge purlin
    const lenD = Math.hypot(x1, y2 - y1);
    const rotX = Math.atan2(-(y2 - y1), -sz * x1) * 180 / Math.PI;
    comp({
      id: `chashou-${sx > 0 ? "E" : "W"}${sz > 0 ? "S" : "N"}`,
      name_zh: "大叉手", name_en: "Scissor brace",
      phase: "frame",
      role: "Pair of inclined braces carrying the ridge purlin directly — the archaic Tang solution, kept alone after the 1975 repair removed the dwarf-post assembly.",
      geometry: { type: "box", w: 15, h: 12, d: lenD },
      position: [x, (y1 + y2) / 2, sz * x1 / 2],
      rotation_deg: [rotX, 0, 0],
      provenance: "conjecture",
      source: "QI1980 via ZHANG2022 — current config post-repair; original ridge structure uncertain; rise 130 fen itself conjectural (propagated)",
    });
  }
}

// 丁栿 ding beams (hip-gable ties) at gables
for (const sx of [-1, 1]) {
  comp({
    id: `dingfu-${sx > 0 ? "E" : "W"}`,
    name_zh: "丁栿", name_en: "Ding beam (gable tie)",
    phase: "frame",
    role: "T-plan beam tying the gable bracket sets into the main transverse frame — what makes the hip-gable end possible.",
    geometry: { type: "box", w: sideBay + inG1, h: 30, d: 22 },
    position: [sx * (totalW / 2 - (sideBay + inG1) / 2 + inG1), Hcol + LIFT + 2 * ZUCAI + 15, 0],
    provenance: "rule_derived",
    source: "Position: ZHANG2022 grid; member: YZFS 卷五 (section unrecorded in corpus)",
  });
}
L(`Frame: 2×四椽栿, 2×平梁, 4×驼峰(conjecture), 4×大叉手(conjecture, propagated), 2×丁栿 placed.`);
L(``);

// --- Purlins ----------------------------------------------------------------
const PURLIN_R = 10.5; // ≈ zucai/2 — section unrecorded → rule_derived
function purlin(id, zh, en, zAbs, topY, len, prov, src, note) {
  for (const sz of zAbs === 0 ? [0] : [-1, 1]) {
    comp({
      id: zAbs === 0 ? id : `${id}-${sz > 0 ? "S" : "N"}`,
      name_zh: zh, name_en: en, phase: "roof",
      role: "Longitudinal purlin; rafters bear on it. Spacing 150 fen ×4 across the depth.",
      geometry: { type: "cylinder", r: PURLIN_R, h: len, axis: "x" },
      position: [0, topY - PURLIN_R, sz * zAbs],
      provenance: prov, source: src, note,
    });
  }
}
const ridgeLen = centralBay + 100; // 歇山收山 v1: ridge overshoots central bay by 50 each side
purlin("tuan-ji", "脊槫", "Ridge purlin", 0, ridgeTopY, ridgeLen,
  "conjecture", "Height depends on conjectural rise 130 (QI1980 repair); spacing ZHANG2022",
  "Position horizontal: measured grid. Height: propagated conjecture (V09 — must NOT be normalized to YZFS 1:3).");
purlin("tuan-ping", "平槫", "Mid purlin", totalD / 4, pingY, ridgeLen + 160,
  "reconstructed_design", "ZHANG2022 — 150-fen spacing; mid depression 10 fen measured (rule: 13)",
  "Height uses measured depression on the conjectural chord — mixed certainty, noted.");
purlin("fang-niuji", "牛脊枋", "Ox-spine tie", totalD / 2, niujiY, totalW + 40,
  "reconstructed_design", "ZHANG2022 — rare early member atop the 2nd column-top tie");
// 撩檐枋 — perimeter, rectangular 枋
for (const [idSuffix, w, d, pos] of [
  ["S", liaoyanSpan, ARM_W, [0, 0, liaoyanZ]],
  ["N", liaoyanSpan, ARM_W, [0, 0, -liaoyanZ]],
  ["E", ARM_W, liaoyanSpan - 0, [totalW / 2 + liaoyanOff, 0, 0]],
  ["W", ARM_W, liaoyanSpan - 0, [-totalW / 2 - liaoyanOff, 0, 0]],
]) {
  comp({
    id: `fang-liaoyan-${idSuffix}`,
    name_zh: "撩檐枋", name_en: "Eave purlin (liaoyan fang)",
    phase: "roof",
    role: "Perimeter member on the ling-gong heads carrying the eave; top of the 95-fen bracket stack.",
    geometry: { type: "box", w, h: ZUCAI, d },
    position: [pos[0], liaoyanTopY - ZUCAI / 2, pos[2]],
    provenance: "reconstructed_design",
    source: "ZHANG2022 — stack height 95 fen; span 694 fen",
  });
}
L(`## 6. Purlins — 脊槫(conjecture-height) / 平槫×2 / 牛脊枋×2 / 撩檐枋×4 placed; intervals ${totalD / 4} fen ✓.`);
L(``);

// --- Roof surfaces -----------------------------------------------------------
const EAVE_MM = RF.eave_projection.mm;            // 2340 — conjecture (1975 restoration)
const EAVE = r1(EAVE_MM / FEN_MM);                // ≈141.8 fen
const THICK = 8;
L(`## 7. Roof surfaces 歇山顶`);
L(`- Lower slope: 撩檐枋背 ${r1(liaoyanTopY)} → 平槫 ${r1(pingY)} over run ${liaoyanZ - totalD / 4} fen; upper slope: → 脊槫 ${r1(ridgeTopY)} over ${totalD / 4} fen (steeper — 举折 curvature visible).`);
L(`- Eave projection ${EAVE_MM} mm = ${EAVE} fen beyond 撩檐枋 — 1974–75 restoration estimate, explicitly unusable as design evidence → CONJECTURE [QI1980].`);
L(`- 歇山收山 simplified v1: ridge length ${ridgeLen} fen, gable triangles at x=±${ridgeLen / 2}; refine later.`);
L(``);

function slope(id, zh, en, runFrom, runTo, yFrom, yTo, width, axis, prov, src, note) {
  // axis "z": slope along z at constant x-extent `width`; axis "x": along x.
  const run = Math.abs(runTo - runFrom);
  const len = Math.hypot(run, yTo - yFrom);
  const angle = Math.atan2(yTo - yFrom, runTo - runFrom) * 180 / Math.PI;
  const mid = (runFrom + runTo) / 2, midY = (yFrom + yTo) / 2;
  comp({
    id, name_zh: zh, name_en: en, phase: "roof",
    role: "Tiled roof plane (rafters + sheathing + grey tile, rendered as a surface in v1).",
    geometry: axis === "z" ? { type: "box", w: width, h: THICK, d: len } : { type: "box", w: len, h: THICK, d: width },
    position: axis === "z" ? [0, midY, mid] : [mid, midY, 0],
    rotation_deg: axis === "z" ? [-angle, 0, 0] : [0, 0, angle],
    provenance: prov, source: src, note,
  });
}
const fullW = liaoyanSpan + 2 * 40;
for (const s of [-1, 1]) {
  const tag = s > 0 ? "S" : "N";
  slope(`roof-lower-${tag}`, "下架屋面（檐步）", "Lower roof slope", s * liaoyanZ, s * totalD / 4, liaoyanTopY, pingY, fullW, "z",
    "rule_derived", "Geometry from purlin positions [ZHANG2022] + surface inferred");
  slope(`roof-upper-${tag}`, "上架屋面（脊步）", "Upper roof slope", s * totalD / 4, s * 0, pingY, ridgeTopY, ridgeLen + 120, "z",
    "conjecture", "Depends on conjectural rise 130 fen (propagated) [QI1980]");
  slope(`roof-eave-${tag}`, "檐口（1975 年复原出檐）", "Eave extension (1975 restoration)", s * liaoyanZ, s * (liaoyanZ + EAVE), liaoyanTopY, liaoyanTopY - EAVE * (pingY - liaoyanTopY) / (totalD / 4 - liaoyanZ), fullW + 2 * EAVE, "z",
    "conjecture", RF.eave_projection.note + " [QI1980]");
  // gable-side hips
  const hipFromX = s * (totalW / 2 + liaoyanOff);
  slope(`roof-hip-${s > 0 ? "E" : "W"}`, "山面屋面", "Gable-side hip slope", hipFromX, s * ridgeLen / 2, liaoyanTopY, pingY, liaoyanSpan * 0.62, "x",
    "rule_derived", "Hip-gable side plane from 撩檐枋 to 收山 line (simplified v1)");
  slope(`roof-hip-eave-${s > 0 ? "E" : "W"}`, "山面檐口（1975 年复原出檐）", "Gable eave extension", hipFromX, s * (totalW / 2 + liaoyanOff + EAVE), liaoyanTopY, liaoyanTopY - EAVE * 0.32, liaoyanSpan * 0.7, "x",
    "conjecture", "Same 1975 restoration projection [QI1980]");
  // gable triangle 山花
  comp({
    id: `gable-${s > 0 ? "E" : "W"}`,
    name_zh: "山花", name_en: "Gable face",
    phase: "roof",
    role: "Vertical gable triangle of the hip-gable roof above the 收山 line.",
    geometry: { type: "box", w: 6, h: ridgeTopY - pingY, d: depthBay * 2 * 0.8 },
    position: [s * ridgeLen / 2, (ridgeTopY + pingY) / 2 - THICK, 0],
    provenance: "conjecture",
    source: "Form rule-typical; height depends on conjectural rise (propagated) [QI1980]",
  });
}

// --- Altar -------------------------------------------------------------------
const A = C.altar_and_statues;
const altarH = r1(A.altar_height.mm / FEN_MM);
const altarW = r1((totalW * FEN_MM - 2 * A.altar_clearances.sides_mm) / FEN_MM);
const altarD = r1((totalD * FEN_MM - A.altar_clearances.front_mm - A.altar_clearances.rear_mm) / FEN_MM);
const altarZoff = r1((A.altar_clearances.rear_mm - A.altar_clearances.front_mm) / 2 / FEN_MM);
L(`## 8. Altar 佛坛 — height ${A.altar_height.mm} mm = ${altarH} fen; clearances front ${A.altar_clearances.front_mm} / sides ${A.altar_clearances.sides_mm} / rear ${A.altar_clearances.rear_mm} mm → ${altarW}×${altarD} fen, offset ${altarZoff} fen rearward [ZHANG2022, measured]`);
comp({
  id: "altar",
  name_zh: "佛坛", name_en: "Buddhist altar",
  phase: "platform",
  role: "U-shaped low altar holding the 14 extant Tang statues; the column-free interior exists to serve it (右绕礼佛 circumambulation ring).",
  geometry: { type: "box", w: altarW, h: altarH, d: altarD },
  position: [0, altarH / 2, -altarZoff],
  provenance: "measured",
  source: "ZHANG2022",
});

// --- Assemble & audit --------------------------------------------------------
const spec = {
  meta: {
    building: C.meta.name_zh,
    building_en: C.meta.name_en,
    date_built: C.meta.date_built.value,
    generated_by: "scripts/derive.mjs (Yingzao Rule Engine)",
    canonical_source: "data/nanchan-canonical.json",
  },
  units: { fen_mm: FEN_MM, note: "All dimensions/positions in fen. Scene scale: 1 fen = 16.5 mm." },
  phases: ["platform", "columns", "puzuo", "frame", "roof"],
  key_dimensions: {
    total_width_fen: totalW, total_depth_fen: totalD,
    bay_rhythm: [sideBay, centralBay, sideBay],
    pingzhu_height_fen: Hcol, puzuo_stack_fen: STACK,
    liaoyan_top_y: r1(liaoyanTopY), ridge_top_y: r1(ridgeTopY),
    rise_fen: RISE, rise_ratio: `1:${(liaoyanSpan / 2 / RISE).toFixed(2)}`,
    purlin_interval_fen: totalD / 4, liaoyan_span_fen: liaoyanSpan,
    outward_jumps_fen: [j1out, j2out],
  },
  components,
};

const counts = {};
for (const c of components) counts[c.provenance] = (counts[c.provenance] || 0) + 1;
L(``);
L(`## 9. Provenance audit`);
L(`- Components: ${components.length} total — ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Audit gate: every component carries {provenance, source} — enforced at emit time; an unsourced component throws.`);
L(``);
L(`## 10. Deviations from the Yingzao Fashi (kept, never corrected)`);
for (const d of C.fashi_deviations_index.items) L(`- ${d}`);
L(``);
L(`*The 782 building outranks the 1103 rulebook.*`);

mkdirSync(join(ROOT, "artifacts"), { recursive: true });
writeFileSync(join(ROOT, "artifacts/structural-spec.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(ROOT, "artifacts/derivation-log.md"), log.join("\n") + "\n");
console.log(`derive: ${components.length} components → artifacts/structural-spec.json`);
console.log(`provenance: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
