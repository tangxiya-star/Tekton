import fs from 'fs';

const specPath = '/Users/touyuumiyabi/Desktop/yingzao/artifacts/structural-spec.json';

// 读取现有的 spec
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

// 柱头铺作的位置和ID映射
const columnTopPuzuoSets = [
  { id: 'pz-2', x: -350, z: -100 },
  { id: 'pz-3', x: -350, z: 100 },
  { id: 'pz-5', x: -150, z: -300 },
  { id: 'pz-6', x: -150, z: 300 },
  { id: 'pz-7', x: 150, z: -300 },
  { id: 'pz-8', x: 150, z: 300 },
  { id: 'pz-10', x: 350, z: -100 },
  { id: 'pz-11', x: 350, z: 100 },
];

// 为每个柱头铺作创建中央支撑柱
const newComponents = columnTopPuzuoSets.map((puzuo) => ({
  id: `${puzuo.id}-center-zhuzhu`,
  name_zh: `${puzuo.id}中央支撑柱`,
  name_en: `Central support post for ${puzuo.id}`,
  phase: 'puzuo',
  role: 'Vertical post threading through bracket layers, concentrating load to column',
  geometry: {
    type: 'cylinder',
    r: 12,           // 约24mm直径（类似柱径）
    h: 100           // 跨越多层，约6 fen
  },
  position: [puzuo.x, 280, puzuo.z],  // 从 ludou 顶部（~247 fen）向上延伸
  provenance: 'reference_enhanced',
  source: 'dougong-detail reference drawing analysis',
  note: 'Central vertical post concentrating multi-layer bracket load; added from reference detail analysis'
}));

// 找到最后一个 puzuo 组件的索引
let lastPuzuoIndex = -1;
for (let i = spec.components.length - 1; i >= 0; i--) {
  if (spec.components[i].phase === 'puzuo') {
    lastPuzuoIndex = i;
    break;
  }
}

// 在所有 puzuo 组件之后插入新的中央柱
if (lastPuzuoIndex >= 0) {
  spec.components.splice(lastPuzuoIndex + 1, 0, ...newComponents);
  console.log(`✓ Added ${newComponents.length} central support posts`);
} else {
  console.log('✗ No puzuo components found');
  process.exit(1);
}

// 现在调整斗拱的宽度梯度
// hg1 应该比 hg2 窄（当前可能相反或相等）
// 让我们为每个柱头铺作调整 hg1/hg2 的尺寸

const adjustedComponents = spec.components.map((comp) => {
  // 调整 hg1 (第一跳) 的宽度
  if (comp.id && comp.id.includes('-hg1') && comp.id.includes('pz-') &&
      !comp.id.includes('pz-1') && !comp.id.includes('pz-4') &&
      !comp.id.includes('pz-9') && !comp.id.includes('pz-12')) {
    // 这是柱头铺作的 hg1（不是角铺作）
    // 增加其宽度以显示扩展
    if (comp.geometry && comp.geometry.w) {
      // 如果原来是 74，改为 80
      comp.geometry.w = Math.max(comp.geometry.w, 80);
    }
  }

  // 调整 hg2 (第二跳) 的宽度——应该比 hg1 更窄
  if (comp.id && comp.id.includes('-hg2') && comp.id.includes('pz-') &&
      !comp.id.includes('pz-1') && !comp.id.includes('pz-4') &&
      !comp.id.includes('pz-9') && !comp.id.includes('pz-12')) {
    // 这是柱头铺作的 hg2（不是角铺作）
    // 减少其宽度以显示收缩
    if (comp.geometry && comp.geometry.w) {
      // 如果原来是 81，改为 70
      comp.geometry.w = Math.min(comp.geometry.w, 70);
    }
  }

  return comp;
});

spec.components = adjustedComponents;

// 添加说明注释到 meta
if (!spec.meta.enhancements) {
  spec.meta.enhancements = [];
}
spec.meta.enhancements.push({
  date: new Date().toISOString(),
  description: 'Enhanced bracket (puzuo) detail based on reference drawing analysis',
  changes: [
    'Added 8 central support posts (center-zhuzhu) to column-top bracket sets',
    'Adjusted hg1/hg2 width gradients for visual hierarchy',
    'Central posts thread through bracket layers concentrating load to columns'
  ],
  reference: 'references/dougong-analysis.md'
});

// 写回文件
fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
console.log('✓ structural-spec.json updated successfully');
console.log(`✓ Total components: ${spec.components.length}`);
