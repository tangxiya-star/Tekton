#!/usr/bin/env node
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const specPath = join(ROOT, 'artifacts/structural-spec.json');

let spec;
try {
  spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
} catch (err) {
  console.error(`✗ Failed to read or parse ${specPath}:`, err.message);
  process.exit(1);
}

if (!Array.isArray(spec.components)) {
  console.error('✗ spec.components is not an array');
  process.exit(1);
}

// 标注数据定义
const annotations = {
  // 中央支撑柱
  'center-zhuzhu': {
    title_zh: '中央支撑柱',
    title_en: 'Central Support Post',
    desc_zh: '竖向贯穿各层斗拱，将荷载集中于柱头。参考图中最显著的特征。',
    desc_en: 'Vertical post threading through bracket layers, concentrating load to column. Key feature from reference detail analysis.',
    reference_image: 'references/details/dougong-bracket-detail.svg',
    reference_label: '斗拱细部图'
  },

  // 栌斗（首层基座）
  '-ludou': {
    title_zh: '栌斗',
    title_en: 'Ludou Capital Block',
    desc_zh: '位于柱头的方形垫块，是斗拱体系的基座，用来将上层斗拱的荷载均匀分散到柱子上。',
    desc_en: 'Square capital block at the column head. Distributes bracket loads uniformly to the column.',
    reference_image: 'references/details/dougong-bracket-detail.svg',
    reference_label: '底层栌斗（第1层）'
  },

  // 第一跳华栱
  '-hg1': {
    title_zh: '华栱（第一跳）',
    title_en: 'Hua-gong Arm, Jump 1',
    desc_zh: '水平向外伸出的构件，承载上层斗拱。加宽至11分以增加强度，说明工匠为结构力学做出的主动调整。',
    desc_en: 'Horizontal projecting arm. Widened to 11 fen for structural strength—builders adapted the modular system for mechanics.',
    reference_image: 'references/details/dougong-bracket-detail.svg',
    reference_label: '第二层华栱'
  },

  // 第二跳华栱
  '-hg2': {
    title_zh: '华栱（第二跳）',
    title_en: 'Hua-gong Arm, Jump 2',
    desc_zh: '继续向外扩展，逐级阶跃式地延伸斗拱的支撑范围。宽度收窄，形成层级递进的视觉效果。',
    desc_en: 'Upper projecting arm continuing the outward extension. Width reduces to create visual hierarchy.',
    reference_image: 'references/details/dougong-bracket-detail.svg',
    reference_label: '第三层华栱'
  },

  // 泥道栱（墙面臂）
  '-nidao': {
    title_zh: '泥道栱',
    title_en: 'Nidao Gong (Wall-plane Arm)',
    desc_zh: '垂直于前后方向，位于墙面平面内。与华栱垂直交叉，形成网格式结构，增强横向稳定性。',
    desc_en: 'Transverse arm in the wall plane. Perpendicular to hua-gong, creating grid-like bracing.',
    reference_image: 'references/details/dougong-bracket-detail.svg',
    reference_label: '泥道栱细部'
  },

  // 令栱（最外层臂）
  '-ling': {
    title_zh: '令栱',
    title_en: 'Ling Gong (Eave-purlin Arm)',
    desc_zh: '最外层的斗拱臂，直接支撑檐角。在唐代，令栱与泥道栱同等长度，打破了后来规则的严格比例关系。',
    desc_en: 'Outermost bracket arm supporting the eave edge. In Tang dynasty, ling-gong and nidao-gong were equal length.',
    reference_image: 'references/details/dougong-bracket-detail.svg',
    reference_label: '令栱与出檐'
  }
};

// 需要添加注释的部件类型
const componentTypes = [
  'center-zhuzhu',  // 中央柱
  'ludou',          // 栌斗
  'hg1',            // 华栱第一跳
  'hg2',            // 华栱第二跳
  'nidao',          // 泥道栱
  'ling'            // 令栱
];

let addedCount = 0;

try {
  // Add annotations to each component
  spec.components = spec.components.map(comp => {
    if (!comp.id) return comp;

    // Check if component matches any annotation pattern
    for (const [pattern, annData] of Object.entries(annotations)) {
      if (comp.id.includes(pattern)) {
        comp.annotation = annData;
        addedCount++;
        break;
      }
    }

    return comp;
  });

  // Write back to file
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log(`✓ Added annotations to ${addedCount} components`);
  console.log(`✓ Annotation types: ${Object.keys(annotations).join(', ')}`);
} catch (err) {
  console.error('✗ Failed to add annotations:', err.message);
  process.exit(1);
}
