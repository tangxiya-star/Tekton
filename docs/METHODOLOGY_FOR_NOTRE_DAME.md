> ⚠️ **STRUCTURE-ONLY DOCUMENT — DO NOT TRUST ANY DATA HERE (ticket ND-12).** This document's data layer was originally **FABRICATED**: it conflated Notre-Dame de **Reims** with the build target and cited a **non-existent "Nohesive 2019" survey**. Even where prose now reads "Paris," **none of the dimensions, sources, citations, or example values in this file may be used** — treat every number here as untrustworthy. This file is retained **ONLY** for pipeline / code structure (the five-layer method, the verifier-check pattern, the file layout). The **single source of truth for ALL Notre-Dame dimensions and sources is `docs/NOTRE_DAME_VERIFIED_CORPUS.md`** (the adversarially-verified, cited ND-1 corpus). When in doubt, use the corpus; never copy a value from here.

# 古建重建方法论 — 从南禅寺到圣母院

## 核心原则（不变）

这套方法论适用于任何有以下条件的古建重建：
1. **存在测量数据**（学术调查报告、激光扫描、历史测绘、公有领域实测图纸）
2. **存在构造规则文献**（建筑时代的工法书、现代考古解读、几何作图法）
3. **有参考图纸**（可用于验证）

> 本文以 **巴黎圣母院（Notre-Dame de Paris）的尖塔（la flèche，Viollet-le-Duc 1859）** 为贯穿示例。圣母院始建于约 1163 年；尖塔与屋顶于 2019 年 4 月 15 日焚毁；大教堂于 2024 年 12 月按原样（à l'identique）重新开放。**所有尺寸与出处均取自 `docs/NOTRE_DAME_VERIFIED_CORPUS.md`** —— 这是本项目唯一的圣母院数据真值源（经对抗式核验、逐条引用）。本文不复制长数据表；需要数值时直接查阅语料库。

### 优先级契约（Precedence Contract）

所有决策遵循严格的三层优先级，永不违反：

```
已测量数据 / 设计复原(reconstructed_design)  >  历史/几何规则(如 ad quadratum、Roriczer)  >  合理推测(标注红色)
```

**违反这个契约的后果：**
- 不能把现实"改正"成规则理想状态 → 这是 CRITICAL FAILURE
- 如果规则和现实矛盾，规则错了（或不适用）
- 任何偏差都是数据，值得保留和研究

> 圣母院的关键守则示例（语料库 V08，critical）：尖塔的实测 **96 m 总高 / ~30 m 基座高** 必须被保留，**不得**被任何 ad-triangulum / Roriczer 理想比例"改正"。一旦把尖塔归一化偏离 96 m 或 30 m，即为 CRITICAL FAILURE。

---

## 五层流程 — 逐层可独立验证

### 第1层：数据准备 (Data Ingester)

**产物:** `data/notre-dame-canonical.json` — 圣母院的标准化尺寸表（连字符文件名为权威拼写）

**每个尺寸必须有以下字段：**
```json
{
  "component": "spire_total_height",
  "value": 96,
  "unit": "m",
  "pied_du_roi": 295.6,
  "provenance": "measured",
  "source": "culture.gouv «Culminant à 96 mètres» + Friends of Notre-Dame（多源确认）",
  "url": "https://notre-dame-de-paris.culture.gouv.fr/fr/petite-histoire-de-la-fleche"
}
```

**模数单位：** 本建筑的模数是 **pied du roi（皇家尺）= 324.8 mm**，是法国哥特建筑里南禅寺"分"的对应物；开间模数（bay module）则对应"材分"。

**provenance 四类（与南禅寺一致）：**
1. `measured` —— 已发表的实测/激光/仪器值，或多源确认的尺寸（如 96 m、30 m、500 t）
2. `reconstructed_design` —— 从 Viollet-le-Duc / Lassus 公有领域图纸复原的 19 世纪设计意图（尖塔本身不是中世纪原构）
3. `rule_derived` —— 由我们的引擎从哥特规则（ad quadratum/triangulum、Roriczer、双心拱）推导得到，必须引用所用规则
4. `conjecture` —— 标注为不确定（争议估计、照片推断、已毁原构）→ 渲染成红色，**绝不可冒充实测**

**数据来源（圣母院的真实出处，全部见语料库）：**
1. 公有领域实测图纸 —— Viollet-le-Duc《Dictionnaire raisonné》"Flèche" 立面+平面图版（作者卒于 1879，全球 PD；BnF Passerelles，ARK `mm320202712p`）
2. 公有领域尺寸集 —— Bell's Handbook（Hiatt，*Notre Dame de Paris*，Gutenberg #60213）
3. 事实型尺寸数据 —— Friends of Notre-Dame de Paris、culture.gouv、官方 notredamedeparis.fr
4. "la forêt"（已毁 13 世纪橡木屋架）—— Fromont & Trentesaux 2014–15 relevé（经 culture.gouv）+ Vannucci 等 arXiv:2005.12584
5. 几何规则 —— Roriczer 1486《Büchlein von der Fialen Gerechtigkeit》（1847 年 PD 译本）

> ⚠️ **不可填的空缺（GAP）：** 中殿独立柱直径、尖塔各分段高度、拱肋断面宽度、chevet 同心半径等，公开文献中**没有**可信发表值。语料库明确列为 GAP/conjecture —— **绝不填入臆造数字，绝不归于某次激光测量**。最大风险是"出处泄漏"：诸如 1.948 m 柱径、6.65/12.42/18.18/23.94 m 半径、148 pied-du-roi 这些"看起来最精确"的数，全部只见于一个自出版博客，且被它错误地归到 Bork/Tallon 激光测量名下。

**问题会在第4层暴露，所以这一层务必详尽。**

---

### 第2层：规则推导引擎 (Rule Engine)

**输入：** `data/notre-dame-canonical.json` + 哥特建筑规则文献

**输出：** `artifacts/structural-spec.json` (每个组件的精确位置、尺寸) + `artifacts/derivation-log.md` (每个决策的推理)

**对于 Notre-Dame，规则来自：**

| 文献 | 内容 | 用途 |
|------|------|------|
| Viollet-le-Duc《Dictionnaire raisonné》t.5 "Flèche"（PD，卒于 1879） | 尖塔六段轮廓（tabouret → souche → 八边形 fût → 两层镂空回廊 → aiguille + coq）、八角配置、构架体系 | 推导尖塔锥形剖面（`reconstructed_design` + `rule_derived`） |
| Roriczer 1486 / Archaeological Journal v.4 (1847)，均 PD | 小尖塔（pinnacle）作图法：底方 → 45° 内接方（边比 1/√2）→ 柱身/嵌板，竖向 Auszug | 推导尖塔上 16 个 pinnacle（`rule_derived`） |
| 双心拱（Brick Development Association "Gothic Arch"，逐字引用） | equilateral：半径=跨度、圆心在两起拱点、矢高=跨度×0.866；lancet：半径>跨度；drop：半径<跨度 | 推导所有尖拱曲线（`rule_derived`，曲线一律计算得出） |
| ad quadratum / ad triangulum（纯几何） | 相邻方边比 1/√2≈0.7071；三角高=底×√3/2≈0.8660 | 由平面宽度设定立面高度等 |
| Fromont & Trentesaux relevé（经 culture.gouv）+ Vannucci arXiv | "la forêt" 屋架的实测榀数、间距、跨度、定年 | 测量真值（构件断面为照片推断，标 `reconstructed_design`） |

**推导步骤示例（尖塔锥形剖面）：**
```
derive spire_profile:
  - measured anchor (hard): total_height = 96 m
      source: culture.gouv «Culminant à 96 mètres»（多源确认）
  - measured anchor (hard): base_level = 30 m（croisée du transept 上方）
      source: constructionbtp + culture.gouv（一处给 33 m，记为 cited-uncertain）
  - derived: height_above_base = 96 − 30 = 66 m  → provenance: reconstructed_design
  - rule (六段轮廓): tabouret → souche → 八边形 fût → 两层镂空回廊 → aiguille + coq
      source: culture.gouv «Petite histoire de la flèche» + VLD «Flèche»

  各分段高度 = GAP（公开文献无发表数字）
  decision: 各分段高度由 rule engine 从 PD VLD «Flèche» 图版（ARK mm320202712p）
            按比例量取，标 provenance: rule_derived（"scaled from PD plate, ratio×96 m"）；
            无法量取处标 conjecture。绝不臆造。
```

**关键约束：**
- 永远不能覆盖已测量的值（96 m / 30 m 等是硬锚点）
- 偏差必须在 derivation-log 中解释
- 如果规则不适用（不同时代、不同材料），明说"此规则不适用"
- 不确定输入会向下传染：构件断面是 `reconstructed_design`，依赖它的几何最高也只能是 `reconstructed_design`；树木数量/木材体积是 `conjecture`，依赖它的全部 `conjecture`

**输出示例：**
```json
{
  "id": "spire-statue-apostle-01",
  "name_en": "Apostle statue (spire), group 1",
  "name_fr": "Statue d'apôtre (flèche), groupe 1",
  "geometry": {
    "type": "figure",
    "height": 3.40
  },
  "position": [/* 四组三尊，沿八角基部错落 */],
  "provenance": "measured",
  "source": "EN/FR Wikipedia + Persée Bulletin Monumental 2009 + mediachimie.org",
  "url": "https://www.persee.fr/doc/bulmo_0007-473x_2009_num_167_2_7284",
  "derivation_rule": null,
  "annotation": "16 件铜像 = 12 使徒（4 组各 3 尊，错落）+ 4 福音象征；圣多默面朝塔内，带 VLD 面容。2019-04-11 火灾前四天移走 → 原件幸存。"
}
```

---

### 第3层：几何构建 (Geometry Builder)

**产物：** React Three Fiber 场景（procedural，无 GLB 导入）

**关键原则：**
- 从 `artifacts/structural-spec.json` **100%** 程序化生成
- 没有任何导入的网格
  - ✓ 为什么：证明模型真的推导出了建筑（不是下载了）
  - ✓ 技术上：BoxGeometry/CylinderGeometry/LatheGeometry 组合
- 场景图顺序 = 真实施工顺序
  ```
  tabouret（基座）→ 木构桅杆/构架 → 八角 fût → 镂空回廊 → 铅皮覆面 → 雕像群 → aiguille + 公鸡(coq)
  ```

**每个网格必须携带 metadata：**
```jsx
<mesh userData={{
  componentId: "spire-mast-01",
  provenance: "reconstructed_design",   // 用来切换材质颜色
  citation: "VLD «Flèche» plate, BnF ARK mm320202712p",  // 点击检查时显示
}}>
```

**材质规则（provenance 颜色，取自 `components/Viewer.tsx`）：**
- `measured`: 黄金色 `#d9a843`
- `reconstructed_design`: 棕色 `#a3812f`
- `rule_derived`: 蓝色 `#5e6ca8`
- `conjecture`: 红色 `#b34a38` ← 警告用户

---

### 第4层：独立视觉验证器 (Vision Verifier) ✅ MOST IMPORTANT

**为什么独立？**
模型自己不会给自己打低分。所以验证器运行在 **全新的 context window**，从未见过 builder 的推理，只看：
1. 渲染的图片
2. 参考图纸（Viollet-le-Duc "Flèche" 立面）
3. 验证清单

**验证清单 —— 几何检查（Notre-Dame 版，每项从 structural-spec.json 的组件坐标重新计算，绝不读引擎自报的 key_dimensions）**

#### 几何验证

**V08（critical）：尖塔总高 = 96 m，基座锚定在 ~30 m（接受 30–33），可见高度 ≈ 66 m**
- 测量：从尖塔组件的最高点与基座组件计算
- 预期：96 m（±1%），base 30–33 m
- **测量现实守则：** 引擎**不得**把尖塔向任何 ad-triangulum/Roriczer 理想归一化而偏离 96 m / 30 m —— 偏离即 CRITICAL FAILURE

**V09：尖塔为八角形，落在 ~15×13 m 的十字交叉脚印上，六段轮廓齐全**
- 测量：基座脚印、面数、各段是否存在
- 预期：8 个面（exact）；脚印 ±5%；tabouret / souche / fût / 两层镂空回廊 / aiguille+coq 六段齐全；角落在屋脊 + 4 条斜沟上

**V10：尖塔雕像 = 16 件铜像 = 12 使徒（4 组各 3 尊，错落）+ 4 福音象征**
- 测量：雕像数量与高度
- 预期：count exact；使徒 ≈ 3.40 m，福音象征 ≈ 2.0 m（±5%）；圣多默面朝塔内

**V03/V04：中殿剖面（STRETCH 范围）—— 中殿净宽 13 m，每侧侧廊 5.9 m；10 个连拱间距，单跨 ≈ 6 m，两两并成 5 个 sexpartite 双开间 ≈ 12 m**
- 测量：从所有中殿柱轴 position 计算相邻间距
- 预期：vessel 13 m（±3%）；间距 ±5%
- **实际偏差是 OK 的** —— 如果能解释（如各开间本就略有不同，6 m 取平均模数）

**V05：高拱顶顶点（keystone）高度 = 33 m（接受 32.5–33）**
- 测量：拱顶顶点高度
- **守则（如 V08）：必须不等于 35 m**（已被否定的"概略内部高度"）**，也不等于 43 m**（那是屋顶下高度）—— 不能"改正"成理想值

**V06：屋顶下高度（hauteur sous toit）= 43 m**，与 V05 的拱顶顶高 33 m 区分

**V07：尖拱为双心拱，从两起拱点作出**
- 测量：每个拱的两圆心是否落在起拱线上；equilateral 类 `矢高 ≈ 跨度×0.866`（±2%）
- 拱顶为 **sexpartite**：每个双开间 6 cell、2 对角肋 + 3 横肋（拓扑 exact）

#### 渲染验证 (像素级检查)

**P01：所有标准视图都已渲染**
- 检查文件存在：`artifacts/preview-{front,side,axon,section,detail,provenance}.png`

**P02：每个视图都不是空白**
- 像素化：非背景像素 > 3% of canvas
- 失败表现：场景没有渲染，或几何太小

**P03（=P08 轮廓对比）：对比参考图纸**
- 自动检查：尖塔轮廓 vs Viollet-le-Duc "Flèche" 立面（边界检测 + 模板匹配）
- Provenance 视图中**四种**证据类颜色都应出现 —— 若全是蓝色(rule_derived)，说明没有任何实测锚点

#### 完整性审计

**V12：零无源组件**
- 检查：comps.filter(c => !c.provenance || !c.source).length === 0
- 失败 = 某个组件没有标注来源；每个 `measured`/`reconstructed_design` 值都要能追溯到语料库里的 URL

**V13（无臆造守则，hard-fail）：任何被否定/不确定的值不得标 `measured`**
- 例：中殿柱径(1.948/1.377/0.974 m)、chevet 半径(6.65/12.42/18.18/23.94 m)、拱肋宽(0.48/0.36–0.38 m)
- 检查：这些必须是 `conjecture`/`GAP`，**绝不可** `measured`，**绝不可**归于"Bork/Tallon 激光测量"

**V14（"la forêt" 不确定性传染）：树木数量同时渲染 ~1,000（Épaud）与 2,000–3,400（Corvol）两个估计，均为 conjecture**
- 依赖木材体积的几何 = conjecture 色；依赖构件断面的几何 ≤ `reconstructed_design`，绝不 `measured`

---

### 验证脚本 (verify.mjs)

**核心逻辑（伪代码）：**

```javascript
// 从structural-spec.json读取所有组件
const spec = JSON.parse(readFileSync('artifacts/structural-spec.json'))
const comps = spec.components

// V08（critical）: 尖塔总高 96 m，基座 ~30 m，不得理想化
const spireTop = maxY(comps.filter(c => /^spire-/.test(c.id)))
const spireBase = baseLevel(comps.filter(c => /^spire-tabouret/.test(c.id)))
checks.push({
  id: 'V08',
  assert: 'spire total height = 96 m (±1%); base anchored 30–33 m; NO idealization',
  pass: within(spireTop, 96, 1) && spireBase >= 30 && spireBase <= 33,
  critical: true,
  measured: { spireTop, spireBase },
  expected: { height: 96, base: '30–33' }
})

// V05: 拱顶顶高 33 m，守则：不得等于 35 m（已否定）或 43 m（屋顶下）
checks.push({
  id: 'V05',
  assert: 'high-vault crown = 33 m (accept 32.5–33); reject 35 m & 43 m',
  pass: within(crownHeight, 33, 3) && !within(crownHeight, 35, 1) && !within(crownHeight, 43, 1),
  measured: crownHeight,
  expected: 33
})

// V13（hard-fail）: 无臆造 —— 被否定/不确定值不得标 measured
const forbidden = [1.948, 1.377, 0.974, 6.65, 12.42, 18.18, 23.94, 0.48]
checks.push({
  id: 'V13',
  assert: 'no refuted/uncertain value carries provenance=measured',
  pass: comps.every(c =>
    !(c.provenance === 'measured' && forbidden.some(v => citesValue(c, v)))),
})

// P01: 截图存在
checks.push({
  id: 'P01',
  assert: 'all canonical views rendered',
  pass: VIEWS.every(v => existsSync(`artifacts/preview-${v}.png`)),
  measured: { missing: missingViews }
})

// 写出report
writeFileSync('artifacts/verifier-report.json', JSON.stringify({
  summary: { total, pass, fail, critical_failures },
  checks
}))

// 失败return exit(1) → build cannot ship
process.exit(failures.length ? 1 : 0)
```

**失败循环：**
```
Rule Engine 推导 →
Geometry Builder 渲染 →
Vision Verifier 检查 →
❌ 检查失败 →  re-derive/re-build 修复 →
✅ 检查通过 →  冻结artifacts
```

**失败报告被保留**（作为不可变的 `verifier-report.*.failed.json`）—— fail→revise→pass 的周期本身就是证据。

---

## 实施检查清单

### 数据层 (Week 1)
- [ ] 把语料库（`docs/NOTRE_DAME_VERIFIED_CORPUS.md`）的尺寸搬入 `data/notre-dame-canonical.json`，每项都带 `{provenance, source, url, rights}`
- [ ] 锚定尖塔实测值：96 m 总高、~30 m 基座、66 m 可见高、500 t 橡木/~1000 件、250 t 铅、16 铜像、公鸡 ~30 kg
- [ ] 标注 PD 图版来源（VLD "Flèche" 图版 BnF ARK `mm320202712p`、Bell's Handbook Gutenberg #60213）
- [ ] 把不可填的空缺（中殿柱径、各分段高度、拱肋宽、chevet 半径）显式标为 `GAP`，**绝不臆造**

### 规则文献 (Week 1)
- [ ] 提取 Viollet-le-Duc 对尖塔六段轮廓与八角配置的描述
- [ ] 提取 Roriczer 1486 小尖塔作图法（6×/7× 竖向倍数标为 cited-uncertain，硬编码前须按 1847 PD 原文复核）
- [ ] 提取双心拱作图法（BDA 逐字）；标注适用范围（时代、地区、材料）
- [ ] 标记哪些规则被实际偏差覆盖（如 96 m/30 m 不被理想化）

### 规则引擎 (Week 2)
- [ ] 编写 `derive.mjs`：从 canonical JSON + 规则文献推导 `structural-spec.json`
- [ ] 每个推导步骤在 `derivation-log.md` 中说明理由
- [ ] 偏离规则的地方 = 历史/设计实情，不是 bug；硬锚点优先于规则

### 几何构建 (Week 2)
- [ ] 编写 R3F 场景：从 `structural-spec.json` 程序化构建，无导入网格
- [ ] 每个网格附加 metadata: {componentId, provenance, citation}
- [ ] 实现 provenance 颜色切换（material 基于 userData：`#d9a843`/`#a3812f`/`#5e6ca8`/`#b34a38`）

### 验证器 (Week 3)
- [ ] 落地语料库的 V01–V14 检查项（含 V08 critical 测量现实守则、V13 无臆造守则）
- [ ] 编写 `verify.mjs`：几何检查 + 渲染检查 + 完整性审计（全部从组件坐标重算）
- [ ] 配置 headless rendering（Playwright）
- [ ] 第一次运行必然失败 → 这是正常的

### 修订循环 (Week 3-4)
- [ ] 让验证器暴露第一批问题
- [ ] 根据问题回溯：是规则引擎问题？还是 geometry builder 问题？
- [ ] 修复+重新运行直到全过 check（含 ≥1 次有记录的 fail→revise→pass 循环）

---

## 为什么这个流程适合 Notre-Dame

| 优势 | 说明 |
|------|------|
| **数据干净** | 单一最佳 PD 实测图版（VLD "Flèche" 立面+平面）+ 多源确认的头条尺寸（96 m / 30 m） |
| **规则明确** | 哥特设计有文献：双心拱、ad quadratum/triangulum、Roriczer 小尖塔法 |
| **验证硬** | 有参考图纸可对标轮廓，有几何学规律可检验 |
| **诚实示范** | "la forêt" 屋架里 conjecture 占主导（树木数量争议、断面照片推断）→ 正好展示管线对不确定性的诚实 |
| **受众广** | 世人目睹其 2019 焚毁、2024 重开 → 更大舞台验证可靠性 |

---

## 预期的第一轮检查失败案例

你会遇到这些情况，都不是 bug：

1. **P02 失败：某个视图是空白**
   → 几何 builder 中位置计算有偏差 → 回到 `structural-spec.json` 检查坐标

2. **V08 失败：尖塔被"理想化"偏离 96 m / 30 m**
   → 规则引擎错误地用 ad-triangulum/Roriczer 理想覆盖了实测锚点
   → 这是 CRITICAL → 恢复 96 m / 30 m，规则只用于无发表值的分段

3. **V12/V13 失败：某个组件无 source，或把不确定值标成了 measured**
   → 在 builder 中补上真实 source（如 VLD "Flèche" 图版）；把柱径/chevet 半径/拱肋宽降级为 `conjecture`/`GAP`

4. **P03（轮廓）失败：与 Viollet-le-Duc "Flèche" 立面不匹配**
   → 要么 `structural-spec` 有系统偏差，要么分段比例需重新按 PD 图版量取
   → 调整后重新 verify

---

## 命令行工作流

```bash
# 推导
node scripts/derive.mjs

# 校验几何 + 渲染
npm run verify

# 失败？编辑 structural-spec.json 或 derive.mjs
# 重新验证
npm run verify

# 通过后部署
npm run build && npm run deploy
```

---

## 向你的队友说什么

> 核心不是"复现南禅寺"，是"证明这套方法能重建任何有数据的古建"。
>
> **选择 Notre-Dame（巴黎圣母院）尖塔是因为：**
> 1. 数据干净且 PD：Viollet-le-Duc "Flèche" 实测图版 + 多源确认的 96 m / 30 m
> 2. 规则文献明确（双心拱、ad quadratum/triangulum、Roriczer 小尖塔法）
> 3. 全球关注度（2019 焚毁、2024 重开）= 更大舞台验证可靠性
>
> **方法论完全通用：**
> - canonical.json 结构不变，只改数据源
> - 规则引擎逻辑不变，只改规则文献的引用（Yingzao Fashi → 哥特几何法）
> - 验证器清单不变，只改检查参数（96 m 尖塔 vs 南禅寺的开间值）
> - 验证失败→修复的循环不变

---

## 文件结构参考

```
notre-dame/
├── data/
│   ├── notre-dame-canonical.json     # 标准化尺寸表（连字符为权威拼写）
│   ├── gothic-rules.txt              # 提取的规则（双心拱、ad quadratum、Roriczer）
│   └── reference-drawings/           # Viollet-le-Duc "Flèche" 图版（PD，BnF）
├── scripts/
│   ├── derive.mjs                    # 规则引擎
│   ├── verify.mjs                    # 验证器
│   └── screenshot.mjs                # 截图工具
├── artifacts/
│   ├── structural-spec.json          # 推导结果
│   ├── derivation-log.md             # 推理过程
│   ├── verifier-report.json          # 验证结果（失败报告保留为 *.failed.json）
│   └── preview-*.png                 # 标准视图
├── components/                       # React Three Fiber 场景
│   ├── Scene.tsx                     # main entry
│   └── Viewer.tsx                    # provenance 颜色切换
└── verifier-report-viewer/           # (optional) 报告可视化
```
