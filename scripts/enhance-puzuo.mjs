#!/usr/bin/env node
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const specPath = join(ROOT, 'artifacts/structural-spec.json');

try {
  // Read existing spec
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  } catch (err) {
    console.error(`✗ Failed to read or parse ${specPath}:`, err.message);
    process.exit(1);
  }

  // Validate spec structure
  if (!Array.isArray(spec.components)) {
    console.error('✗ spec.components is not an array');
    process.exit(1);
  }

  // Check idempotency: skip if already enhanced
  if (spec.components.some(c => c.id === 'pz-2-center-zhuzhu')) {
    console.log('✓ Puzuo enhancement already applied, skipping');
    process.exit(0);
  }

  // Column-top puzuo positions and IDs
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

  // Create central support posts for each column-top puzuo
  const newComponents = columnTopPuzuoSets.map((puzuo) => ({
    id: `${puzuo.id}-center-zhuzhu`,
    name_zh: `${puzuo.id}中央支撑柱`,
    name_en: `Central support post for ${puzuo.id}`,
    phase: 'puzuo',
    role: 'Vertical post threading through bracket layers, concentrating load to column',
    geometry: {
      type: 'cylinder',
      r: 12,
      h: 100,
    },
    position: [puzuo.x, 280, puzuo.z],
    provenance: 'reference_enhanced',
    source: 'dougong-detail reference drawing analysis',
    note: 'Central vertical post concentrating multi-layer bracket load; added from reference detail analysis',
  }));

  // Find last puzuo component index
  let lastPuzuoIndex = -1;
  for (let i = spec.components.length - 1; i >= 0; i--) {
    if (spec.components[i].phase === 'puzuo') {
      lastPuzuoIndex = i;
      break;
    }
  }

  // Insert new central posts after all puzuo components
  if (lastPuzuoIndex >= 0) {
    spec.components.splice(lastPuzuoIndex + 1, 0, ...newComponents);
    console.log(`✓ Added ${newComponents.length} central support posts`);
  } else {
    console.error('✗ No puzuo components found');
    process.exit(1);
  }

  // Adjust bracket width gradients (only for column-top puzuo, not corner sets)
  const cornerPuzuoIds = new Set(['pz-1', 'pz-4', 'pz-9', 'pz-12']);
  const adjustedComponents = spec.components.map((comp) => {
    if (!comp.id || !comp.geometry?.w) return comp;

    // Use regex to match: pz-2-hg1, pz-3-hg1, etc. (avoid substring collision)
    const hg1Match = comp.id.match(/^(pz-\d+)-hg1$/);
    const hg2Match = comp.id.match(/^(pz-\d+)-hg2$/);

    if (hg1Match) {
      const puzuoId = hg1Match[1];
      if (!cornerPuzuoIds.has(puzuoId)) {
        comp.geometry.w = Math.max(comp.geometry.w, 80);
      }
    } else if (hg2Match) {
      const puzuoId = hg2Match[1];
      if (!cornerPuzuoIds.has(puzuoId)) {
        comp.geometry.w = Math.min(comp.geometry.w, 70);
      }
    }

    return comp;
  });

  spec.components = adjustedComponents;

  // Add enhancement record to meta
  if (!spec.meta.enhancements) {
    spec.meta.enhancements = [];
  }
  spec.meta.enhancements.push({
    date: new Date().toISOString(),
    description: 'Enhanced bracket (puzuo) detail based on reference drawing analysis',
    changes: [
      'Added 8 central support posts (center-zhuzhu) to column-top bracket sets',
      'Adjusted hg1/hg2 width gradients for visual hierarchy',
      'Central posts thread through bracket layers concentrating load to columns',
    ],
    reference: 'references/dougong-analysis.md',
  });

  // Write back to file
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log('✓ structural-spec.json updated successfully');
  console.log(`✓ Total components: ${spec.components.length}`);
} catch (err) {
  console.error('✗ Unexpected error:', err.message);
  process.exit(1);
}
