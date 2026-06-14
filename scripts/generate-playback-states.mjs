#!/usr/bin/env node
// ND-32 — deterministic playback backbone.
//
// Reads artifacts/structural-spec.notre-dame.json (and, if present,
// artifacts/derivation-stream.notre-dame.jsonl as a cross-check) and emits
// progressive playback states into artifacts/playback/:
//   state-000.json … state-NNN.json   (one per build step)
//   index.json                        (manifest)
//
// A "state" is the cumulative set of components visible after step K has been
// added. Components are sorted by seq. Steps are grouped by phase boundaries,
// then any phase that is too large is split into even chunks so the total
// lands in the ~12–20 range.
//
// Fully deterministic + byte-stable: no Date, no random, stable JSON key order,
// fixed 2-space indentation, trailing newline. Re-running produces identical
// bytes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SPEC_PATH = path.join(ROOT, "artifacts", "structural-spec.notre-dame.json");
const STREAM_PATH = path.join(ROOT, "artifacts", "derivation-stream.notre-dame.jsonl");
const OUT_DIR = path.join(ROOT, "artifacts", "playback");

const PROVENANCE_CLASSES = [
  "measured",
  "reconstructed_design",
  "rule_derived",
  "conjecture",
];

// Target window for the number of steps. We never exceed MAX; we try to reach
// at least MIN by chunking oversized phases.
const MIN_STEPS = 12;
const MAX_STEPS = 20;

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function emptyCounts() {
  const c = {};
  for (const k of PROVENANCE_CLASSES) c[k] = 0;
  return c;
}

function main() {
  const spec = readJson(SPEC_PATH);
  const components = Array.isArray(spec.components) ? spec.components.slice() : [];

  // Sort strictly by seq (stable, deterministic). Fall back to id for any
  // ties / missing seq so ordering is never ambiguous.
  components.sort((a, b) => {
    const sa = typeof a.seq === "number" ? a.seq : Number.MAX_SAFE_INTEGER;
    const sb = typeof b.seq === "number" ? b.seq : Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return String(a.id).localeCompare(String(b.id));
  });

  // Optional cross-check against the derivation stream: if it exists and the
  // ordered id sequence disagrees, warn (but the spec remains the source of
  // truth so output stays deterministic).
  if (fs.existsSync(STREAM_PATH)) {
    const streamIds = fs
      .readFileSync(STREAM_PATH, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l))
      .sort((a, b) => a.seq - b.seq)
      .map((e) => e.id);
    const specIds = components.map((c) => c.id);
    const mismatch =
      streamIds.length !== specIds.length ||
      streamIds.some((id, i) => id !== specIds[i]);
    if (mismatch) {
      console.warn(
        "[generate-playback-states] WARN: derivation stream order differs from spec seq order; using spec."
      );
    }
  }

  // Build the ordered phase list as it actually appears walking seq order.
  // A phase can appear, be interrupted by another phase, and reappear (the ND
  // spec does this: gallery2 / ornament interleave). Each contiguous run is a
  // "segment" and is treated as an independent build group.
  const segments = []; // { phase, items: component[] }
  for (const comp of components) {
    const last = segments[segments.length - 1];
    if (last && last.phase === comp.phase) {
      last.items.push(comp);
    } else {
      segments.push({ phase: comp.phase, items: [comp] });
    }
  }

  // Each segment becomes >=1 step. If the total number of segments is below
  // MIN_STEPS, split the largest segments into even chunks until we reach the
  // target window (capped so we never blow past MAX_STEPS).
  let groups = segments.map((s) => ({ phase: s.phase, items: s.items.slice() }));

  while (groups.length < MIN_STEPS) {
    // Find the splittable group (>=2 items) with the most items. Deterministic
    // tie-break: earliest index wins.
    let target = -1;
    let best = 1;
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].items.length > best) {
        best = groups[i].items.length;
        target = i;
      }
    }
    if (target === -1) break; // nothing left to split
    if (groups.length + 1 > MAX_STEPS) break; // would exceed the cap

    const g = groups[target];
    const mid = Math.ceil(g.items.length / 2);
    const first = { phase: g.phase, items: g.items.slice(0, mid) };
    const second = { phase: g.phase, items: g.items.slice(mid) };
    groups.splice(target, 1, first, second);
  }

  const total = groups.length;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Clear any stale state-*.json so re-runs with fewer steps don't leave
  // orphans behind (keeps the directory byte-stable for a given input).
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (/^state-\d+\.json$/.test(f)) fs.rmSync(path.join(OUT_DIR, f));
  }

  const pad = String(total - 1).length >= 3 ? String(total - 1).length : 3;

  const visible = [];
  const counts = emptyCounts();
  let written = 0;

  for (let step = 0; step < total; step++) {
    const group = groups[step];
    const addedIds = [];
    for (const comp of group.items) {
      visible.push(comp);
      addedIds.push(comp.id);
      const cls = comp.provenance;
      if (Object.prototype.hasOwnProperty.call(counts, cls)) counts[cls] += 1;
    }

    const state = {
      step,
      total,
      phase: group.phase,
      visible_component_ids: visible.map((c) => c.id),
      added_ids: addedIds,
      counts: { ...counts },
    };

    const name = `state-${String(step).padStart(pad, "0")}.json`;
    fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(state, null, 2) + "\n");
    written += 1;
  }

  const index = {
    steps: total,
    phases: groups.map((g) => g.phase),
    generated_from: "structural-spec.notre-dame.json",
  };
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");

  console.log(
    `[generate-playback-states] wrote ${written} state file(s) + index.json to artifacts/playback/ (${components.length} components, ${total} steps).`
  );
}

main();
