#!/usr/bin/env node
/**
 * Generate playback states from structural-spec.json
 * Creates intermediate states as components are added, for replay in Viewer
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(readFileSync(join(ROOT, "artifacts/structural-spec.json"), "utf8"));

const outDir = join(ROOT, "artifacts/playback-states");
mkdirSync(outDir, { recursive: true });

// Group components by phase
const byPhase = {};
spec.phases.forEach((p) => {
  byPhase[p] = spec.components.filter((c) => c.phase === p);
});

// Generate states: empty → each phase added
const states = [];
let currentComponents = [];

// State 0: empty
states.push({
  index: 0,
  phase: "init",
  description: "初始化",
  components: [],
  timestamp: new Date().toISOString(),
});

let stateIndex = 1;
for (const phase of spec.phases) {
  const phaseComps = byPhase[phase] || [];

  // Add components from this phase one by one for visual effect
  for (const comp of phaseComps) {
    currentComponents.push(comp);
    states.push({
      index: stateIndex,
      phase,
      description: `${phase}: +${comp.name_zh || comp.id}`,
      components: JSON.parse(JSON.stringify(currentComponents)), // deep clone
      timestamp: new Date().toISOString(),
    });
    stateIndex++;
  }
}

// Write each state as a separate file
states.forEach((state) => {
  const filename = join(outDir, `state-${String(state.index).padStart(3, "0")}.json`);
  const data = {
    meta: spec.meta,
    units: spec.units,
    phases: spec.phases,
    key_dimensions: spec.key_dimensions,
    components: state.components,
    playback: {
      index: state.index,
      phase: state.phase,
      description: state.description,
      totalStates: states.length,
    },
  };
  writeFileSync(filename, JSON.stringify(data, null, 2));
});

// Also write a manifest
const manifest = {
  totalStates: states.length,
  phases: spec.phases,
  states: states.map((s) => ({
    index: s.index,
    phase: s.phase,
    description: s.description,
    componentCount: s.components.length,
  })),
};

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log(`✓ Generated ${states.length} playback states in ${outDir}`);
console.log(`  Phases: ${spec.phases.join(" → ")}`);
console.log(`  Total components: ${spec.components.length}`);
