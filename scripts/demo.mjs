#!/usr/bin/env node
/**
 * Demo stunt — the measured-reality guard.
 *
 *   npm run demo:corrupt   — "idealize" the spire toward a Gothic geometric rule
 *   npm run demo:restore   — put Viollet-le-Duc's measured 96 m back
 *
 * For the spire (default), corrupt applies the Roriczer ~7× pinnacle-height rule to
 * the octagon base width and rescales the whole flèche to that "ideal" — overriding
 * the MEASURED 96 m. The verifier's V08 (critical) then REFUSES to ship it (exit 1),
 * because a sourced value is never overridden by a rule. Restore reverts.
 *
 * For --building nanchan, corrupt raises the ridge purlin to the Fashi 1:3 ideal
 * (the original V09 stunt).
 *
 * The backup guard means corrupt cannot run twice in a row, so the backup always
 * holds the genuine spec.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync, rmSync } from "node:fs";

const mode = process.argv[2];
function argBuilding() {
  const av = process.argv.slice(2);
  const eq = av.find((a) => a.startsWith("--building="));
  if (eq) return eq.split("=")[1];
  const i = av.indexOf("--building");
  if (i >= 0 && av[i + 1]) return av[i + 1];
  return "notre-dame";
}
const BUILDING = argBuilding();

if (BUILDING === "nanchan") {
  const SPEC = "artifacts/structural-spec.json";
  const BACKUP = "artifacts/.spec-demo-backup.json";
  if (mode === "corrupt") {
    if (existsSync(BACKUP)) { console.error("already corrupted (backup exists). run demo:restore first."); process.exit(1); }
    copyFileSync(SPEC, BACKUP);
    const spec = JSON.parse(readFileSync(SPEC, "utf8"));
    const ji = spec.components.find((c) => c.id === "tuan-ji");
    ji.position[1] = 331.4 + 347 / 3 - ji.geometry.r; // Fashi 1:3 "ideal"
    writeFileSync(SPEC, JSON.stringify(spec, null, 2));
    console.log("脊檩已按《营造法式》1:3 之制「纠正」。run: npm run verify");
  } else if (mode === "restore") {
    if (!existsSync(BACKUP)) { console.error("no backup — current spec is the real building."); process.exit(1); }
    copyFileSync(BACKUP, SPEC); rmSync(BACKUP);
    console.log("restored the measured 782 roof (1:2.67).");
  } else { console.error("usage: node scripts/demo.mjs corrupt|restore [--building nanchan]"); process.exit(1); }
  process.exit(0);
}

// ---- spire (default) ----
const SPEC = "artifacts/structural-spec.notre-dame.json";
const BACKUP = "artifacts/.spec-demo-backup.notre-dame.json";
const COSF = Math.cos(Math.PI / 8);

if (mode === "corrupt") {
  if (existsSync(BACKUP)) { console.error("already corrupted (backup exists). run `npm run demo:restore` first."); process.exit(1); }
  copyFileSync(SPEC, BACKUP);
  const spec = JSON.parse(readFileSync(SPEC, "utf8"));
  const comps = spec.components;
  const base = 30; // measured anchor (stays)
  // octagon base width (souche bottom across-flats)
  const souche = comps.find((c) => c.id === "spire-souche");
  const baseR = Math.min(...souche.geometry.pts.map((p) => p[0]));
  const baseWidth = 2 * baseR * COSF;
  // Roriczer "spire ≈ 7× base width" — the rulebook IDEAL the corrupt engine trusts
  const idealVisible = baseWidth * 7; // ≈ 59.5 m, NOT the measured 66 m
  const f = idealVisible / 66; // ≈ 0.90 — compress the whole flèche to the ideal

  const scaleY = (y) => base + (y - base) * f;
  for (const c of comps) {
    c.position[1] = Math.round(scaleY(c.position[1]) * 1000) / 1000;
    const g = c.geometry;
    if (typeof g.h === "number") g.h = Math.round(g.h * f * 1000) / 1000;
    if (Array.isArray(g.pts)) {
      g.pts = g.pts.map((p) => (p.length === 2 ? [p[0], Math.round(p[1] * f * 1000) / 1000] : [p[0], Math.round(scaleY(p[1]) * 1000) / 1000, p[2]]));
    }
  }
  writeFileSync(SPEC, JSON.stringify(spec, null, 2));
  console.log(`Spire "corrected" to the Roriczer 7× ideal: ${idealVisible.toFixed(1)} m visible (total ≈ ${(base + idealVisible).toFixed(1)} m), overriding the MEASURED 96 m.`);
  console.log("Now run: npm run verify -- --building notre-dame  → V08 (critical) must REFUSE it (exit 1).");
} else if (mode === "restore") {
  if (!existsSync(BACKUP)) { console.error("no backup — current spec is the real measured flèche."); process.exit(1); }
  copyFileSync(BACKUP, SPEC); rmSync(BACKUP);
  console.log("Restored Viollet-le-Duc's MEASURED 96 m flèche. The measured value outranks the rule (V08).");
} else {
  console.error("usage: node scripts/demo.mjs corrupt|restore [--building notre-dame|nanchan]");
  process.exit(1);
}
