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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- multi-building dispatch (ND-14) ---------------------------------------
// `--building notre-dame` runs the spire engine and exits; the default (nanchan)
// falls through to the engine below, so `npm run derive` stays byte-for-byte the
// Nanchan regression anchor.
function argBuilding() {
  const av = process.argv.slice(2);
  const eq = av.find((a) => a.startsWith("--building="));
  if (eq) return eq.split("=")[1];
  const i = av.indexOf("--building");
  if (i >= 0 && av[i + 1]) return av[i + 1];
  return "nanchan";
}
const BUILDING = argBuilding();
if (BUILDING === "notre-dame-towers" || BUILDING === "towers") {
  await import("./derive-notre-dame-towers.mjs");
  process.exit(0);
}
if (BUILDING === "notre-dame" || BUILDING === "notredame") {
  await import("./derive-notre-dame.mjs");
  process.exit(0);
}

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
const eaveDrop = 0.85 * EAVE * (pingY - liaoyanTopY) / (liaoyanZ - totalD / 4);
L(`## 7. Roof surfaces 歇山顶 — derived as watertight planes between purlin lines`);
L(`- Lower slope: 撩檐枋背 ${r1(liaoyanTopY)} → 平槫 ${r1(pingY)} over run ${liaoyanZ - totalD / 4} fen; upper slope: → 脊槫 ${r1(ridgeTopY)} over ${totalD / 4} fen (steeper — 举折 curvature visible at the 平槫 kink).`);
L(`- Eave projection ${EAVE_MM} mm = ${EAVE} fen beyond 撩檐枋, dropping ${r1(eaveDrop)} fen (85% of slope — slight 檐口微翘) — 1974–75 restoration estimate → CONJECTURE [QI1980].`);
L(`- 歇山收山 simplified: at 平槫 level the roof footprint is x=±${ridgeLen / 2}, z=±${totalD / 4}; hips run from the eave corners to that break rectangle; 山花 vertical above it.`);
L(``);

const XE = totalW / 2 + liaoyanOff + EAVE; // eave edge, gable dir
const ZE = liaoyanZ + EAVE;                // eave edge, front/rear
const XL = totalW / 2 + liaoyanOff;        // 撩檐枋 line
const ZL = liaoyanZ;
const XP = ridgeLen / 2;                   // 收山 break
const ZP = totalD / 4;
const yE = liaoyanTopY - eaveDrop, yL = liaoyanTopY, yP = pingY, yR = ridgeTopY;

function roofPoly(id, zh, en, pts, prov, src2, note) {
  comp({
    id, name_zh: zh, name_en: en, phase: "roof",
    role: "Tiled roof plane (rafters + sheathing + tile), derived as a surface between purlin lines.",
    geometry: { type: "poly", pts },
    position: [0, 0, 0],
    provenance: prov, source: src2, note, material: "huiwa",
  });
}
for (const s of [-1, 1]) {
  const t = s > 0 ? "S" : "N", tg = s > 0 ? "E" : "W";
  roofPoly(`roof-eave-${t}`, "檐口（1975 年复原出檐）", "Eave strip (1975 restoration)",
    [[-XE, yE, s * ZE], [XE, yE, s * ZE], [XL, yL, s * ZL], [-XL, yL, s * ZL]],
    "conjecture", RF.eave_projection.note + " [QI1980]");
  roofPoly(`roof-eave-${tg}`, "山面檐口（1975 年复原出檐）", "Gable eave strip",
    [[s * XE, yE, -ZE], [s * XE, yE, ZE], [s * XL, yL, ZL], [s * XL, yL, -ZL]],
    "conjecture", "Same 1975 restoration projection [QI1980]");
  roofPoly(`roof-lower-${t}`, "下架屋面（檐步）", "Lower roof slope",
    [[-XL, yL, s * ZL], [XL, yL, s * ZL], [XP, yP, s * ZP], [-XP, yP, s * ZP]],
    "rule_derived", "Geometry from purlin positions [ZHANG2022]");
  roofPoly(`roof-hip-${tg}`, "山面屋面", "Hip slope",
    [[s * XL, yL, -ZL], [s * XL, yL, ZL], [s * XP, yP, ZP], [s * XP, yP, -ZP]],
    "rule_derived", "Hip-gable side from 撩檐枋 to 收山 line [ZHANG2022 + YZFS]");
  roofPoly(`roof-upper-${t}`, "上架屋面（脊步）", "Upper roof slope",
    [[-XP, yP, s * ZP], [XP, yP, s * ZP], [XP, yR, 0], [-XP, yR, 0]],
    "conjecture", "Depends on conjectural rise 130 fen (propagated) [QI1980]");
  roofPoly(`gable-${tg}`, "山花", "Gable face",
    [[s * XP, yP, -ZP], [s * XP, yP, ZP], [s * XP, yR, 0]],
    "conjecture", "Form rule-typical; height depends on conjectural rise (propagated) [QI1980]");
}

// --- 檐椽 eave rafters ---------------------------------------------------------
const RAF_R = 4.5, RAF_SPACING = 18; // YZFS 卷五 用椽之制: 椽径≈9分, 一椽一档
L(`- 檐椽: YZFS 卷五 用椽之制 椽径≈${RAF_R * 2} 分, 一椽一档 (spacing ${RAF_SPACING} fen). The exposed eave portion embodies the 1975 conjectural projection → conjecture (propagated). Eave drop ${r1(eaveDrop)} fen with slight 檐口微翘.`);
let rafIdx = 0;
// front/rear rows (along z), then gable rows (along x)
for (const s of [-1, 1]) {
  // front/rear
  {
    const r1z = totalD / 2, y1 = niujiY;
    const r2z = liaoyanZ + EAVE * 0.97, y2 = liaoyanTopY - eaveDrop;
    const len = Math.hypot(r2z - r1z, y2 - y1);
    const rotX = Math.atan2(-(y2 - y1), s * (r2z - r1z)) * 180 / Math.PI;
    const half = liaoyanSpan / 2 + 35;
    const n = Math.floor((2 * half) / RAF_SPACING);
    for (let k = 0; k <= n; k++) {
      rafIdx++;
      comp({
        id: `chuan-${s > 0 ? "S" : "N"}-${k}`, name_zh: "檐椽", name_en: "Eave rafter", phase: "roof",
        role: "Round rafter carrying the deep eave — the exposed rafter row is the signature of 出檐深远.",
        geometry: { type: "cylinder", r: RAF_R, h: len, axis: "z" },
        position: [-half + k * RAF_SPACING, (y1 + y2) / 2, s * (r1z + r2z) / 2],
        rotation_deg: [rotX, 0, 0],
        provenance: "conjecture",
        source: "Eave projection = 1974–75 restoration estimate (QI1980, propagated); sizing YZFS 卷五 用椽之制",
      });
    }
  }
  // gables
  {
    const r1x = totalW / 2, y1 = niujiY;
    const r2x = totalW / 2 + liaoyanOff + EAVE * 0.97, y2 = liaoyanTopY - eaveDrop;
    const len = Math.hypot(r2x - r1x, y2 - y1);
    const rotZ = Math.atan2(y2 - y1, s * (r2x - r1x)) * 180 / Math.PI;
    const half = liaoyanSpan * 0.31;
    const n = Math.floor((2 * half) / RAF_SPACING);
    for (let k = 0; k <= n; k++) {
      rafIdx++;
      comp({
        id: `chuan-${s > 0 ? "E" : "W"}-${k}`, name_zh: "檐椽（山面）", name_en: "Eave rafter (gable side)", phase: "roof",
        role: "Round rafter carrying the deep eave on the hip-gable side.",
        geometry: { type: "cylinder", r: RAF_R, h: len, axis: "x" },
        position: [s * (r1x + r2x) / 2, (y1 + y2) / 2, -half + k * RAF_SPACING],
        rotation_deg: [0, 0, rotZ],
        provenance: "conjecture",
        source: "Eave projection = 1974–75 restoration estimate (QI1980, propagated); sizing YZFS 卷五 用椽之制",
      });
    }
  }
}
L(`- 檐椽 placed: ${rafIdx} rafters (front/rear + gable rows).`);

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

// --- Statues 彩塑 — stylized polychrome figures (体量示意，非雕塑复原) -----------
const CHI = C.modular_system.yingzao_chi_mm.value / FEN_MM; // 1 尺 in fen ≈ 18.18
const KH = A.key_heights_chi;
const yA = altarH; // statue heights measured in whole/half chi from the altar top
const H_FO = r1(KH.main_buddha_vairocana * CHI);   // 13.3 尺 ≈ 241.8
const H_BEI = r1(KH.main_buddha_mandorla * CHI);   // 17.3 尺 ≈ 314.5
const H_XS = r1(KH.attendant_bodhisattvas * CHI);  // 8 尺 ≈ 145.5
const H_QI = r1(KH.manjusri_samantabhadra * CHI);  // 10 尺 ≈ 181.8
const STATUE_SRC =
  "Heights: ZHANG2022 key_heights_chi (measured, whole/half-chi); arrangement: photographic record; form: stylized polychrome massing — the sculpture itself is not reconstructed";
L(`## 8b. Statues 彩塑 — stylized figures (五组主像)`);
L(`- Key heights are MEASURED and chi-based (corroborating the 300 mm 尺): 主佛 ${KH.main_buddha_vairocana} 尺 = ${H_FO} fen, 背光 ${KH.main_buddha_mandorla} 尺 = ${H_BEI} fen, 胁侍 ${KH.attendant_bodhisattvas} 尺 = ${H_XS} fen, 文殊/普贤 ${KH.manjusri_samantabhadra} 尺 = ${H_QI} fen [ZHANG2022]`);
L(`- Figures are stylized polychrome massing pegged to those heights (lathe thrones, flame mandorlas, ring halos); drapery and faces are NOT modeled → every statue component is CONJECTURE with the measured heights cited. ${A.statue_count.extant} of ${A.statue_count.original} statues extant; five principal groups modeled.`);
L(`- 新样文殊 hook: ${A.narrative_hook}`);
L(``);

function st(id, zh, en, role, geometry, position, material, extra = {}) {
  comp({
    id, name_zh: zh, name_en: en, phase: "statues", role,
    geometry, position, material,
    provenance: "conjecture", source: STATUE_SRC, ...extra,
  });
}

/**
 * Photo-derived model slot: if public/models/<slug>.glb exists (image-to-3D mesh
 * generated from photographs of the actual statue), emit it instead of the
 * procedural massing; otherwise run the fallback builder. Either way the height
 * is pinned to the measured chi value.
 */
const modelsUsed = [];
function modelOr(slug, zh, en, role, x, z, targetH, buildFallback, faceDeg = 0) {
  const rel = `models/${slug}.glb`;
  if (existsSync(join(ROOT, "public", rel))) {
    modelsUsed.push(slug);
    st(`${slug}-model`, zh, en, role,
      { type: "gltf", url: `/${rel}`, targetH, faceDeg }, [x, yA, z], undefined, {
        source:
          "Form: image-to-3D mesh derived from photographs of the actual statue (photo-derived, still conjecture — not survey geometry); height: ZHANG2022 key_heights_chi (measured)",
      });
  } else {
    buildFallback();
  }
}

/** Flame-mandorla outline (pointed top, flat-ish bottom), origin at bottom centre. */
function mandorlaPts(W, H) {
  const N = 18, side = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    side.push([r1((W / 2) * Math.pow(Math.sin(Math.PI * (0.08 + 0.92 * u)), 0.75)), r1(H * u)]);
  }
  return [...side.map(([px, py]) => [-px, py]), ...side.reverse()];
}

/** Seated figure (facing +z): wide crossed legs, robed torso, arms, gilt head, halo. */
function seatedFigure(idp, zh, en, role, x, z, baseY, H, opts = {}) {
  const M = opts.robeMat ?? "caisu";
  const P = (dy) => r1(baseY + dy * H);
  st(`${idp}-lap`, `${zh}·结跏趺坐`, `${en} — crossed legs`, role,
    { type: "capsule", r: r1(0.13 * H), h: r1(0.36 * H) }, [x, P(0.13), r1(z + 0.02 * H)], M,
    { rotation_deg: [0, 0, 90] });
  st(`${idp}-torso`, `${zh}·躯干`, `${en} — torso`, role,
    { type: "sphere", r: r1(0.165 * H), scale: [1.1, 1.55, 0.8] }, [x, P(0.46), z], M);
  st(`${idp}-shoulders`, `${zh}·肩`, `${en} — shoulders`, role,
    { type: "sphere", r: r1(0.155 * H), scale: [1.5, 0.62, 0.85] }, [x, P(0.68), z], M);
  for (const s of [-1, 1]) {
    st(`${idp}-arm${s > 0 ? "R" : "L"}`, `${zh}·臂`, `${en} — arm`, role,
      { type: "capsule", r: r1(0.05 * H), h: r1(0.30 * H) },
      [r1(x + s * 0.185 * H), P(0.48), r1(z + 0.02 * H)], M, { rotation_deg: [0, 0, -s * 12] });
    st(`${idp}-ear${s > 0 ? "R" : "L"}`, `${zh}·耳`, `${en} — ear`, role,
      { type: "capsule", r: r1(0.02 * H), h: r1(0.07 * H) }, [r1(x + s * 0.105 * H), P(0.85), z], "jin");
  }
  st(`${idp}-hands`, `${zh}·禅定印`, `${en} — hands (dhyana mudra)`, role,
    { type: "sphere", r: r1(0.065 * H), scale: [1.5, 0.7, 1] }, [x, P(0.30), r1(z + 0.115 * H)], "jin");
  st(`${idp}-neck`, `${zh}·颈`, `${en} — neck`, role,
    { type: "cylinder", r: r1(0.05 * H), h: r1(0.06 * H) }, [x, P(0.775), z], "jin");
  st(`${idp}-head`, `${zh}·头`, `${en} — head`, role,
    { type: "sphere", r: r1(0.105 * H) }, [x, P(0.865), z], "jin");
  st(`${idp}-hair`, `${zh}·发`, `${en} — hair`, role,
    { type: "sphere", r: r1(0.108 * H), scale: [1, 0.62, 1] }, [x, P(0.905), z], "qing");
  if (opts.crown) {
    st(`${idp}-crown`, `${zh}·宝冠`, `${en} — crown`, role,
      { type: "cylinder", r: r1(0.105 * H), h: r1(0.035 * H) }, [x, P(0.935), z], "jin");
    st(`${idp}-topknot`, `${zh}·发髻`, `${en} — topknot`, role,
      { type: "sphere", r: r1(0.045 * H) }, [x, P(0.985), z], "qing");
  } else {
    st(`${idp}-ushnisha`, `${zh}·肉髻`, `${en} — ushnisha`, role,
      { type: "sphere", r: r1(0.055 * H) }, [x, P(0.97), z], "qing");
  }
  st(`${idp}-halo`, `${zh}·头光`, `${en} — head halo`, role,
    { type: "torus", r: r1(0.17 * H), rt: r1(0.018 * H) }, [x, P(0.865), r1(z - 0.13 * H)], "jin");
}

/** Standing attendant (facing +z): lotus base, flared robe, joined hands, crowned head, halo. */
function standingFigure(idp, zh, en, role, x, z, H) {
  const P = (dy) => r1(yA + dy * H);
  st(`${idp}-lianzuo`, `${zh}·莲座`, `${en} — lotus base`, role,
    { type: "lathe", pts: [[0.10, 0], [0.135, 0.03], [0.115, 0.055], [0.085, 0.07]].map(([a, b]) => [r1(a * H), r1(b * H)]), seg: 10 },
    [x, yA, z], "lian");
  st(`${idp}-robe`, `${zh}·长裙`, `${en} — robe`, role,
    { type: "lathe", pts: [[0.115, 0], [0.13, 0.02], [0.07, 0.40], [0.062, 0.58], [0.085, 0.64], [0.05, 0.70]].map(([a, b]) => [r1(a * H), r1(b * H)]), seg: 14 },
    [x, P(0.06), z], "caisu");
  st(`${idp}-shoulders`, `${zh}·肩`, `${en} — shoulders`, role,
    { type: "sphere", r: r1(0.085 * H), scale: [1.5, 0.55, 0.8] }, [x, P(0.72), z], "caisu");
  for (const s of [-1, 1]) {
    st(`${idp}-arm${s > 0 ? "R" : "L"}`, `${zh}·臂`, `${en} — arm`, role,
      { type: "capsule", r: r1(0.03 * H), h: r1(0.24 * H) }, [r1(x + s * 0.10 * H), P(0.56), z], "caisu",
      { rotation_deg: [0, 0, -s * 10] });
  }
  st(`${idp}-hands`, `${zh}·合十`, `${en} — joined hands`, role,
    { type: "sphere", r: r1(0.04 * H), scale: [1.3, 0.9, 1] }, [x, P(0.44), r1(z + 0.06 * H)], "jin");
  st(`${idp}-head`, `${zh}·头`, `${en} — head`, role,
    { type: "sphere", r: r1(0.072 * H) }, [x, P(0.835), z], "jin");
  st(`${idp}-hair`, `${zh}·发`, `${en} — hair`, role,
    { type: "sphere", r: r1(0.074 * H), scale: [1, 0.6, 1] }, [x, P(0.865), z], "qing");
  st(`${idp}-crown`, `${zh}·宝冠`, `${en} — crown`, role,
    { type: "cylinder", r: r1(0.07 * H), h: r1(0.025 * H) }, [x, P(0.895), z], "jin");
  st(`${idp}-topknot`, `${zh}·发髻`, `${en} — topknot`, role,
    { type: "sphere", r: r1(0.032 * H) }, [x, P(0.945), z], "qing");
  st(`${idp}-halo`, `${zh}·头光`, `${en} — head halo`, role,
    { type: "torus", r: r1(0.115 * H), rt: r1(0.013 * H) }, [x, P(0.835), r1(z - 0.09 * H)], "jin");
}

// 主佛 — sumeru throne (octagonal lathe) + lotus + seated figure + flame mandorla
modelOr("fo", "主佛（照片建模）", "Main Buddha (photo-derived)",
  "Principal seated Buddha incl. throne; height pinned to the 13.3-chi figure value.", 0, -70, H_FO, () => {  // faceDeg set below
  const bz = -70;
  const role = `Principal seated Buddha; total height ${KH.main_buddha_vairocana} chi from the altar — about twice human height, per《祇洹寺图经》prescription.`;
  st("fo-xumizuo", "主佛·须弥座", "Main Buddha — sumeru throne", role,
    { type: "lathe", pts: [[58, 0], [58, 10], [46, 14], [40, 28], [46, 42], [56, 46], [54, 50]], seg: 8 },
    [0, yA, bz], "lian");
  st("fo-lianhua", "主佛·莲座", "Main Buddha — lotus seat", role,
    { type: "lathe", pts: [[28, 0], [50, 6], [54, 14], [44, 20], [38, 23]], seg: 12 },
    [0, yA + 48, bz], "lian");
  seatedFigure("fo", "主佛", "Main Buddha", role, 0, bz, yA + 66, r1(H_FO - 66));
  st("fo-beiguang-rim", "主佛·背光（绿缘）", "Main Buddha — mandorla rim",
    "Outer rim of the flame mandorla.",
    { type: "shape2d", pts: mandorlaPts(147, r1(H_BEI - 81 + 8)), d: 4 }, [0, yA + 81, bz - 39], "shilv");
  st("fo-beiguang", "主佛·举身背光", "Main Buddha — full-body flame mandorla",
    `Flame mandorla rising to ${KH.main_buddha_mandorla} chi — the tallest object in the hall, filling the open 彻上明造 interior between the transverse beams.`,
    { type: "shape2d", pts: mandorlaPts(133, r1(H_BEI - 85)), d: 4 }, [0, yA + 85, bz - 36], "caisu");
}, 270);

// 文殊骑狮 (west)
modelOr("wenshu", "文殊骑狮（照片建模）", "Manjusri on lion (photo-derived)",
  "Manjusri-on-lion group.", -175, -10, H_QI, () => {
  const x = -175, z = -10;
  const role = "Manjusri riding the lion — the earliest extant 新样文殊 group; the lion-tamer figure (lost) was the King of Khotan in Tang military dress.";
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    st(`wenshu-shi-leg${sx > 0 ? "R" : "L"}${sz > 0 ? "F" : "B"}`, "狮·腿", "Lion — leg", role,
      { type: "capsule", r: 6.5, h: 26 }, [x + sx * 14, yA + 13, z + sz * 26], "shou");
  }
  st("wenshu-shi-body", "狮·躯体", "Lion — body", role,
    { type: "capsule", r: 19, h: 56 }, [x, yA + 46, z - 2], "shou", { rotation_deg: [90, 0, 0] });
  st("wenshu-shi-chest", "狮·胸", "Lion — chest", role,
    { type: "sphere", r: 21 }, [x, yA + 44, z + 22], "shou");
  st("wenshu-shi-head", "狮·头", "Lion — head", role,
    { type: "sphere", r: 15 }, [x, yA + 72, z + 40], "shou");
  st("wenshu-shi-muzzle", "狮·吻", "Lion — muzzle", role,
    { type: "sphere", r: 8, scale: [1, 0.75, 1.3] }, [x, yA + 68, z + 52], "shou");
  st("wenshu-shi-mane", "狮·鬃圈", "Lion — mane ring", role,
    { type: "torus", r: 17, rt: 7 }, [x, yA + 72, z + 33], "shilv");
  for (const s of [-1, 1]) {
    st(`wenshu-shi-ear${s > 0 ? "R" : "L"}`, "狮·耳", "Lion — ear", role,
      { type: "sphere", r: 4.5 }, [x + s * 9, yA + 84, z + 36], "qing");
  }
  st("wenshu-shi-tail", "狮·尾", "Lion — tail", role,
    { type: "capsule", r: 3.5, h: 26 }, [x, yA + 58, z - 34], "shou", { rotation_deg: [-40, 0, 0] });
  st("wenshu-anzuo", "文殊·莲座鞍", "Manjusri — lotus saddle", role,
    { type: "lathe", pts: [[10, 0], [26, 6], [28, 12], [22, 16], [18, 18]], seg: 10 }, [x, yA + 62, z - 2], "lian");
  const base = yA + 78, Hr = r1(H_QI - 78);
  seatedFigure("wenshu", "文殊菩萨", "Manjusri", role, x, z - 2, base, Hr, { crown: true });
  st("wenshu-beiguang", "文殊·背光", "Manjusri — flame mandorla", role,
    { type: "shape2d", pts: mandorlaPts(70, r1(H_QI + 15 - 78)), d: 3 }, [x, base, z - 32], "caisu");
}, 180);

// 普贤骑象 (east)
modelOr("puxian", "普贤骑象（照片建模）", "Samantabhadra on elephant (photo-derived)",
  "Samantabhadra-on-elephant group.", 175, -10, H_QI, () => {
  const x = 175, z = -10;
  const role = "Samantabhadra riding the white elephant, mirroring Manjusri across the central Buddha.";
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    st(`puxian-xiang-leg${sx > 0 ? "R" : "L"}${sz > 0 ? "F" : "B"}`, "象·腿", "Elephant — leg", role,
      { type: "cylinder", r: 8.5, h: 32 }, [x + sx * 16, yA + 16, z + sz * 28], "shou");
  }
  st("puxian-xiang-body", "象·躯体", "Elephant — body", role,
    { type: "capsule", r: 23, h: 64 }, [x, yA + 50, z], "shou", { rotation_deg: [90, 0, 0] });
  st("puxian-xiang-head", "象·头", "Elephant — head", role,
    { type: "sphere", r: 17 }, [x, yA + 62, z + 46], "shou");
  for (const s of [-1, 1]) {
    st(`puxian-xiang-ear${s > 0 ? "R" : "L"}`, "象·耳", "Elephant — ear", role,
      { type: "sphere", r: 12, scale: [0.25, 1, 0.8] }, [x + s * 16, yA + 64, z + 42], "shou",
      { rotation_deg: [0, s * 25, 0] });
    st(`puxian-xiang-tusk${s > 0 ? "R" : "L"}`, "象·牙", "Elephant — tusk", role,
      { type: "cone", r: 2.5, rTop: 0.8, h: 16 }, [x + s * 7, yA + 48, z + 56], "ya",
      { rotation_deg: [70, 0, 0] });
  }
  st("puxian-xiang-trunk1", "象·鼻（上段）", "Elephant — trunk (upper)", role,
    { type: "capsule", r: 5, h: 22 }, [x, yA + 52, z + 60], "shou", { rotation_deg: [40, 0, 0] });
  st("puxian-xiang-trunk2", "象·鼻（下段）", "Elephant — trunk (lower)", role,
    { type: "capsule", r: 4, h: 20 }, [x, yA + 36, z + 68], "shou", { rotation_deg: [8, 0, 0] });
  st("puxian-xiang-tail", "象·尾", "Elephant — tail", role,
    { type: "capsule", r: 3, h: 22 }, [x, yA + 52, z - 36], "shou", { rotation_deg: [-30, 0, 0] });
  st("puxian-anzuo", "普贤·莲座鞍", "Samantabhadra — lotus saddle", role,
    { type: "lathe", pts: [[12, 0], [28, 6], [30, 12], [24, 16], [20, 18]], seg: 10 }, [x, yA + 72, z - 2], "lian");
  const base = yA + 88, Hr = r1(H_QI - 88);
  seatedFigure("puxian", "普贤菩萨", "Samantabhadra", role, x, z - 2, base, Hr, { crown: true });
  st("puxian-beiguang", "普贤·背光", "Samantabhadra — flame mandorla", role,
    { type: "shape2d", pts: mandorlaPts(70, r1(H_QI + 15 - 88)), d: 3 }, [x, base, z - 32], "caisu");
});

// 胁侍菩萨 ×2 — standing, 8 chi
for (const sx of [-1, 1]) {
  const slug = `xieshi-${sx > 0 ? "E" : "W"}`;
  modelOr(slug, "胁侍菩萨（照片建模）", "Attendant bodhisattva (photo-derived)",
    "Standing attendant bodhisattva flanking the main Buddha, 8 chi.", sx * 105, -40, H_XS, () =>
    standingFigure(slug, "胁侍菩萨", "Attendant bodhisattva",
      "Standing attendant bodhisattva flanking the main Buddha, 8 chi.", sx * 105, -40, H_XS));
}
if (modelsUsed.length) L(`- Photo-derived GLB models in use: ${modelsUsed.join(", ")} (public/models/) — replacing procedural massing.`);
L(`Statues placed: 主佛+火焰背光, 文殊骑狮, 普贤骑象, 胁侍×2 — all conjecture (form), heights pinned to measured chi values.`);
L(``);

// --- Secondary members: 阑额 / 柱础 / 斗 / 柱头枋 / 正脊·鸱尾 / 今貌围护 ----------
L(``);
L(`## 9. Secondary members 阑额 · 柱础 · 散斗 · 柱头枋 · 正脊 · 围护`);
const LANE_H = 30, LANE_W = 20; // YZFS 卷五: 阑额广加材一倍=30, 厚 2/3
L(`- 阑额: YZFS 卷五 「凡用阑额…广加材一倍」= ${LANE_H} fen, 厚 ${LANE_W} → rule_derived. Top flush with column top. NO 普拍枋 above — an early-period trait, kept.`);
let laneIdx = 0;
function lane(x, z, w, d) {
  laneIdx++;
  comp({
    id: `lane-${laneIdx}`, name_zh: "阑额", name_en: "Architrave (lan'e)", phase: "columns",
    role: "Tie beam linking the column tops into a ring; Nanchan has no pupai-fang above it — an early-period trait.",
    geometry: { type: "box", w, h: LANE_H, d },
    position: [x, Hcol - LANE_H / 2, z],
    provenance: "rule_derived",
    source: "YZFS 卷五 (member present in building; section unrecorded in corpus)",
    material: "zhu",
  });
}
for (let i = 0; i < 3; i++) {
  const cx = (XS[i] + XS[i + 1]) / 2, lenX = XS[i + 1] - XS[i];
  for (const sz of [-1, 1]) lane(cx, sz * totalD / 2, lenX, LANE_W);
  const cz = (ZS[i] + ZS[i + 1]) / 2, lenZ = ZS[i + 1] - ZS[i];
  for (const sx of [-1, 1]) lane(sx * totalW / 2, cz, LANE_W, lenZ);
}

// 柱础 plinths — YZFS 卷三 造柱础之制 「方倍柱之径」
L(`- 柱础: YZFS 卷三 「础方倍柱之径」 → 覆盆 plinth r≈17 fen, rule_derived (present but unrecorded in corpus).`);
let chuIdx = 0;
for (const key of Object.keys(columnTop)) {
  const [x, z] = key.split(",").map(Number);
  chuIdx++;
  comp({
    id: `zhuchu-${chuIdx}`, name_zh: "柱础（覆盆）", name_en: "Column plinth", phase: "platform",
    role: "Stone plinth isolating the column foot from ground moisture.",
    geometry: { type: "cylinder", r: 17, h: 9 },
    position: [x, 2.5, z],
    provenance: "rule_derived", source: "YZFS 卷三 造柱础之制 「方倍柱之径」",
    material: "stone",
  });
}

// 散斗 blocks on gong ends — articulates the bracket sets
L(`- 散斗: YZFS 卷四 造斗之制 (corpus lacks explicit dou dims) → rule_derived; placed on 泥道栱 and 令栱 ends.`);
const DOU = { w: 14, d: 16, h: 10 };
let douIdx = 0;
function dou(x, y, z, zh, en) {
  douIdx++;
  comp({
    id: `dou-${douIdx}`, name_zh: zh, name_en: en, phase: "puzuo",
    role: "Small bearing block transferring load between arm tiers.",
    geometry: { type: "box", w: DOU.w, h: DOU.h, d: DOU.d },
    position: [x, y + DOU.h / 2, z],
    provenance: "rule_derived", source: "YZFS 卷四 造斗之制 (corpus lacks explicit dou dims)",
    material: "zhu",
  });
}
for (const key of Object.keys(columnTop)) {
  const [x, z] = key.split(",").map(Number);
  const top = columnTop[key];
  const isCorner = Math.abs(x) === totalW / 2 && Math.abs(z) === totalD / 2;
  if (isCorner) continue;
  const onFrontRear = Math.abs(z) === totalD / 2;
  const dir = onFrontRear ? [0, Math.sign(z)] : [Math.sign(x), 0];
  const wall = [dir[1], dir[0]];
  const G = GONG_LEN / 2 - 7;
  for (const s of [-1, 1]) {
    dou(x + wall[0] * s * G, top + LIFT + CAI_H, z + wall[1] * s * G, "散斗", "San dou block");
    dou(x + dir[0] * (j1out + j2out) + wall[0] * s * G, top + LIFT + 2 * ZUCAI + CAI_H,
        z + dir[1] * (j1out + j2out) + wall[1] * s * G, "散斗（令栱头）", "San dou (ling-gong end)");
  }
}

// 柱头枋 — wall-plane ties above the nidao gongs
L(`- 柱头枋: continuous wall-plane ties above the 泥道栱 (the 牛脊枋 rides the 2nd tier) → rule_derived.`);
for (const [i, [w, d, px, pz]] of [
  [totalW + 20, ARM_W, 0, totalD / 2], [totalW + 20, ARM_W, 0, -totalD / 2],
  [ARM_W, totalD + 20, totalW / 2, 0], [ARM_W, totalD + 20, -totalW / 2, 0],
].entries()) {
  comp({
    id: `zhutoufang-${i + 1}`, name_zh: "柱头枋", name_en: "Column-top tie (zhutou fang)", phase: "puzuo",
    role: "Continuous tie running the wall plane atop the nidao gongs, stitching the bracket sets into a ring beam.",
    geometry: { type: "box", w, h: CAI_H, d },
    position: [px, Hcol + LIFT + ZUCAI + CAI_H / 2, pz],
    provenance: "rule_derived", source: "ZHANG2022 (member noted) + YZFS 卷四 (section)",
    material: "zhu",
  });
}

// 正脊 + 鸱尾 — silhouette; rise-dependent ⇒ conjecture; form cited to Dunhuang murals
L(`- 正脊/鸱尾: form from Tang-period Dunhuang mural evidence (color-evidence list) — CITED CONJECTURE; height rides the conjectural rise (propagated).`);
comp({
  id: "zhengji", name_zh: "正脊", name_en: "Main ridge", phase: "roof",
  role: "Tiled main ridge capping the roof.",
  geometry: { type: "box", w: ridgeLen + 24, h: 14, d: 16 },
  position: [0, ridgeTopY + 7, 0],
  provenance: "conjecture",
  source: "Form: Tang practice via Dunhuang murals; height depends on conjectural rise [QI1980]",
  material: "huiwa",
});
for (const sx of [-1, 1]) {
  comp({
    id: `chiwei-${sx > 0 ? "E" : "W"}`, name_zh: "鸱尾", name_en: "Chiwei (owl-tail finial)", phase: "roof",
    role: "Ridge-end finial; the Tang silhouette's signature stroke.",
    geometry: { type: "box", w: 10, h: 46, d: 22 },
    position: [sx * (ridgeLen / 2 + 7), ridgeTopY + 14 + 23, 0],
    provenance: "conjecture",
    source: "Form from Tang-dynasty Dunhuang murals + Tōshōdai-ji analogy — cited conjecture (PRD color-evidence list)",
    material: "huiwa",
  });
}

// 今貌围护 — non-structural enclosure (walls, door, lattice windows)
L(`- 围护 (today's fabric): white walls, central-bay double door, side-bay 直棂窗 — present in the building, dimensions NOT in corpus → conjecture (non-structural infill, labeled).`);
const WALL_T = 24, WALL_H = Hcol - LANE_H;
const encl = {
  provenance: "conjecture",
  source: "Present-day infill (photographic record); dimensions not in survey corpus",
  phase: "enclosure",
};
comp({ ...encl, id: "wall-N", name_zh: "后檐墙", name_en: "Rear wall", role: "Non-structural enclosure.",
  geometry: { type: "box", w: totalW, h: WALL_H, d: WALL_T }, position: [0, WALL_H / 2, -totalD / 2], material: "bai" });
for (const sx of [-1, 1]) {
  comp({ ...encl, id: `wall-${sx > 0 ? "E" : "W"}`, name_zh: "山墙", name_en: "Gable wall", role: "Non-structural enclosure.",
    geometry: { type: "box", w: WALL_T, h: WALL_H, d: totalD }, position: [sx * totalW / 2, WALL_H / 2, 0], material: "bai" });
  // front side-bay: sill wall + 直棂窗
  const cx = sx * (centralBay / 2 + sideBay / 2);
  comp({ ...encl, id: `sill-${sx > 0 ? "E" : "W"}`, name_zh: "槛墙", name_en: "Sill wall", role: "Low wall under the lattice window.",
    geometry: { type: "box", w: sideBay, h: 90, d: WALL_T }, position: [cx, 45, totalD / 2], material: "bai" });
  for (const [ri, ry] of [[0, 94], [1, WALL_H - 8]]) {
    comp({ ...encl, id: `rail-${sx > 0 ? "E" : "W"}${ri}`, name_zh: "窗额/腰串", name_en: "Window rail", role: "Lattice window frame rail.",
      geometry: { type: "box", w: sideBay, h: 8, d: 10 }, position: [cx, ry + 4, totalD / 2], material: "zhu" });
  }
  for (let k = 1; k <= 11; k++) {
    const bx = sx * (centralBay / 2) + sx * (k * sideBay / 12);
    comp({ ...encl, id: `ling-${sx > 0 ? "E" : "W"}${k}`, name_zh: "直棂窗棂条", name_en: "Lattice window bar", role: "Vertical bar of the 直棂窗 — the early straight-mullion window type.",
      geometry: { type: "box", w: 4, h: WALL_H - 90 - 12, d: 6 }, position: [bx, 90 + (WALL_H - 90 - 12) / 2 + 4, totalD / 2], material: "lv" });
  }
  // central-bay door leaves
  comp({ ...encl, id: `door-${sx > 0 ? "E" : "W"}`, name_zh: "板门", name_en: "Plank door leaf", role: "Double plank door of the central bay.",
    geometry: { type: "box", w: 138, h: 200, d: 8 }, position: [sx * 71, 100, totalD / 2], material: "door" });
}

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
  phases: ["platform", "columns", "puzuo", "frame", "roof", "enclosure", "statues"],
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
L(`## 10. Provenance audit`);
L(`- Components: ${components.length} total — ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
L(`- Audit gate: every component carries {provenance, source} — enforced at emit time; an unsourced component throws.`);
L(``);
L(`## 11. Deviations from the Yingzao Fashi (kept, never corrected)`);
for (const d of C.fashi_deviations_index.items) L(`- ${d}`);
L(``);
L(`*The 782 building outranks the 1103 rulebook.*`);

mkdirSync(join(ROOT, "artifacts"), { recursive: true });
writeFileSync(join(ROOT, "artifacts/structural-spec.json"), JSON.stringify(spec, null, 2));
writeFileSync(join(ROOT, "artifacts/derivation-log.md"), log.join("\n") + "\n");
console.log(`derive: ${components.length} components → artifacts/structural-spec.json`);
console.log(`provenance: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(" ")}`);
