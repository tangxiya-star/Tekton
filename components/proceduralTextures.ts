"use client";

/**
 * proceduralTextures — procedurally generated THREE.CanvasTexture surfaces for the
 * Notre-Dame west-towers tier. NO imported image/texture assets exist anywhere in
 * this pipeline; reference photographs of the facade are CITE-ONLY (see the
 * canonical rights_excluded.MODERN-PHOTOS). Every surface here is drawn at runtime
 * onto an offscreen <canvas> and wrapped as a CanvasTexture (a data-backed THREE
 * texture), so the demo carries zero downloaded pixels.
 *
 * Three materials, matching the canonical material_classes:
 *   limestone — mottled cream/ivory Lutetian limestone (canvas value-noise).
 *               The stone TYPE is measured; its exact COLOUR is conjecture/GAP, so
 *               the limestone tint is supplied by the material-hypothesis toggle
 *               (as-built / today / sooted) and multiplied over a neutral noise map.
 *   lead      — dull blue-grey lead sheet (banded roll-cap streaking).
 *   oak       — aged oak grain (longitudinal grain lines + knots).
 *
 * The textures are deterministic (seeded) so renders are reproducible.
 */
import * as THREE from "three";

// small seeded PRNG so the noise is stable across renders (reproducible captures)
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(size: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  return cv;
}

function finalize(cv: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Limestone — neutral mottled value-noise in greys, so the per-hypothesis tint
 * (as-built cream / cleaned cream / sooted grey) can be applied as the mesh
 * material colour and MULTIPLIED over this map. Keeping the map near-neutral is
 * deliberate: the exact stone colour is a documented GAP, never baked in.
 */
export function makeLimestoneTexture(size = 512): THREE.CanvasTexture {
  const cv = makeCanvas(size);
  const g = cv.getContext("2d")!;
  const rnd = mulberry32(0xa17e_57);

  // base neutral fill
  g.fillStyle = "#cfcabf";
  g.fillRect(0, 0, size, size);

  // multi-octave value-noise blotches (mottling) — neutral lightness variation
  const blotch = (count: number, rMin: number, rMax: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const r = rMin + rnd() * (rMax - rMin);
      const v = 175 + Math.floor(rnd() * 70); // neutral grey blotch
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(${v},${v - 4},${v - 12},${alpha})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  };
  blotch(70, size * 0.06, size * 0.16, 0.18);
  blotch(180, size * 0.015, size * 0.05, 0.12);

  // fine speckle / weathering grain
  for (let i = 0; i < size * size * 0.06; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const d = (rnd() - 0.5) * 50;
    const v = 200 + d;
    g.fillStyle = `rgba(${v},${v},${v - 6},0.10)`;
    g.fillRect(x, y, 1, 1);
  }

  // faint ashlar joint lines (cut-stone courses), low contrast
  g.strokeStyle = "rgba(90,86,78,0.16)";
  g.lineWidth = 1;
  const course = size / 6;
  for (let r = 1; r < 6; r++) {
    g.beginPath();
    g.moveTo(0, r * course);
    g.lineTo(size, r * course);
    g.stroke();
    // staggered vertical joints
    const off = r % 2 ? course / 2 : 0;
    for (let cX = off; cX < size; cX += course * 1.6) {
      g.beginPath();
      g.moveTo(cX, r * course);
      g.lineTo(cX, (r + 1) * course);
      g.stroke();
    }
  }

  return finalize(cv, 1);
}

/** Lead — dull blue-grey sheet with vertical roll-cap streaks (the spire cladding). */
export function makeLeadTexture(size = 512): THREE.CanvasTexture {
  const cv = makeCanvas(size);
  const g = cv.getContext("2d")!;
  const rnd = mulberry32(0x1ead_b5);

  g.fillStyle = "#7d8590";
  g.fillRect(0, 0, size, size);

  // mottled oxidation patches
  for (let i = 0; i < 120; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.02 + rnd() * 0.08);
    const v = 110 + Math.floor(rnd() * 50);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${v},${v + 6},${v + 16},0.16)`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  // vertical roll-cap streaks (lead sheet seams)
  const bay = size / 8;
  for (let b = 0; b <= 8; b++) {
    const x = b * bay + (rnd() - 0.5) * 4;
    g.strokeStyle = "rgba(60,66,74,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, size);
    g.stroke();
    g.strokeStyle = "rgba(150,160,172,0.25)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + 2, 0);
    g.lineTo(x + 2, size);
    g.stroke();
  }
  return finalize(cv, 1);
}

/** Oak — aged brown longitudinal grain with occasional knots (belfry framing). */
export function makeOakTexture(size = 512): THREE.CanvasTexture {
  const cv = makeCanvas(size);
  const g = cv.getContext("2d")!;
  const rnd = mulberry32(0x0a_c057);

  g.fillStyle = "#6e5535";
  g.fillRect(0, 0, size, size);

  // longitudinal grain lines (slightly wavy)
  for (let i = 0; i < 90; i++) {
    const y0 = rnd() * size;
    const amp = 2 + rnd() * 10;
    const shade = 40 + Math.floor(rnd() * 50);
    g.strokeStyle = `rgba(${shade},${shade - 14},${shade - 26},0.28)`;
    g.lineWidth = 0.6 + rnd() * 1.4;
    g.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const y = y0 + Math.sin((x / size) * Math.PI * 2 * (1 + rnd() * 0.2)) * amp;
      x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }

  // a few knots
  for (let i = 0; i < 5; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.01 + rnd() * 0.025);
    for (let k = 3; k >= 1; k--) {
      g.strokeStyle = `rgba(48,34,20,${0.18 * k})`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(x, y, r * k, r * k * 1.4, rnd() * Math.PI, 0, Math.PI * 2);
      g.stroke();
    }
  }
  return finalize(cv, 1);
}

export type MaterialTextures = {
  limestone: THREE.CanvasTexture;
  lead: THREE.CanvasTexture;
  oak: THREE.CanvasTexture;
};

/** Build all three procedural material textures once (memoised by the caller). */
export function makeMaterialTextures(): MaterialTextures {
  return {
    limestone: makeLimestoneTexture(),
    lead: makeLeadTexture(),
    oak: makeOakTexture(),
  };
}
