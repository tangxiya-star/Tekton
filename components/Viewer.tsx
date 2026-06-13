"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import spec from "../artifacts/structural-spec.json";

const FEN = 0.0165; // 1 fen = 16.5 mm → scene meters

type Component = (typeof spec.components)[number] & {
  rotation_deg?: number[];
  material?: string;
  geometry: {
    type: string;
    w?: number;
    h?: number;
    d?: number;
    r?: number;
    axis?: string;
    pts?: number[][];
  };
};

/** Triangle or quad surface from derived corner points (roof planes). */
function polyGeometry(pts: number[][]) {
  const geo = new THREE.BufferGeometry();
  const tri =
    pts.length === 3
      ? [...pts[0], ...pts[1], ...pts[2]]
      : [...pts[0], ...pts[1], ...pts[2], ...pts[0], ...pts[2], ...pts[3]];
  const uvs =
    pts.length === 3
      ? [0, 0, 1, 0, 0.5, 1]
      : [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
  geo.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

const PROV_COLORS: Record<string, string> = {
  measured: "#d9a843",
  reconstructed_design: "#a3812f",
  rule_derived: "#5e6ca8",
  conjecture: "#b34a38",
};

const MATERIAL_COLORS: Record<string, string> = {
  zhu: "#a8402c",   // 朱 vermilion (Tang scheme)
  bai: "#ece7dc",   // 白 lime white
  huiwa: "#84878a", // 灰瓦 blue-grey tile
  sumu: "#a98a64",  // 素木 plain timber
  lv: "#2e6b4f",    // 绿 lattice-window green
  stone: "#b9b4a8",
  door: "#9c3a26",
};

const PHASE_COLORS: Record<string, string> = {
  platform: "#b9b4a8",
  columns: "#a8402c",
  puzuo: "#a8402c",
  frame: "#a8402c",
  roof: "#84878a",
  enclosure: "#ece7dc",
};

/** Stable per-component tone offset so timber doesn't look injection-molded. */
function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h % 100) + 100) % 100 / 100 - 0.5) * 0.07;
}

function makeWoodTexture(alongV: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d6d0c6";
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 170; i++) {
    const p = rnd() * 256, w = 0.6 + rnd() * 1.8, a = 0.05 + rnd() * 0.14;
    const tone = rnd() < 0.5 ? "94,66,46" : "70,52,38";
    g.fillStyle = `rgba(${tone},${a})`;
    alongV ? g.fillRect(p, 0, w, 256) : g.fillRect(0, p, 256, w);
  }
  for (let i = 0; i < 6; i++) {
    const x = rnd() * 256, y = rnd() * 256, r = 2 + rnd() * 4;
    g.fillStyle = "rgba(60,42,30,0.22)";
    g.beginPath();
    g.ellipse(x, y, alongV ? r : r * 2.4, alongV ? r * 2.4 : r, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function makePlasterTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e9e5dc";
  g.fillRect(0, 0, 128, 128);
  let seed = 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? "120,110,95" : "255,255,255"},${0.03 + rnd() * 0.07})`;
    g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

function makeTileTexture(vertical: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8b8e92";
  g.fillRect(0, 0, 128, 128);
  for (let p = 0; p < 128; p += 16) {
    g.fillStyle = "rgba(20,24,28,0.28)";
    vertical ? g.fillRect(p, 0, 3, 128) : g.fillRect(0, p, 128, 3);
    g.fillStyle = "rgba(255,255,255,0.10)";
    vertical ? g.fillRect(p + 8, 0, 6, 128) : g.fillRect(0, p + 8, 128, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(vertical ? 48 : 3, vertical ? 3 : 48);
  t.anisotropy = 4;
  return t;
}

/** Canonical camera stations (also used by the headless verifier renders). */
const CAMS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [16, 9, 19], target: [0, 3.2, 0] },
  front: { pos: [0, 5, 27], target: [0, 4.2, 0] },
  bracket: { pos: [5.2, 5.8, 9.8], target: [2.5, 5.0, 4.9] },
  eave: { pos: [10.5, 5.5, 11], target: [6.2, 5.2, 5.6] },
};

type TexKit = {
  tileU: THREE.Texture;
  tileV: THREE.Texture;
  woodU: THREE.Texture;
  woodV: THREE.Texture;
  plaster: THREE.Texture;
};

const TIMBER_MATS = new Set(["zhu", "sumu", "door", "lv"]);
const TIMBER_PHASES = new Set(["columns", "puzuo", "frame"]);

function Member({ c, provMode, tex }: { c: Component; provMode: boolean; tex: TexKit }) {
  const g = c.geometry;
  const rot = (c.rotation_deg ?? [0, 0, 0]).map((d) => (d * Math.PI) / 180) as [
    number, number, number,
  ];
  const baseColor = provMode
    ? PROV_COLORS[c.provenance]
    : (c.material && MATERIAL_COLORS[c.material]) || PHASE_COLORS[c.phase] || "#888";
  const color = useMemo(() => {
    const col = new THREE.Color(baseColor);
    if (!provMode) col.offsetHSL(0, 0, jitter(c.id));
    return col;
  }, [baseColor, provMode, c.id]);
  const pos = c.position as [number, number, number];
  const polyGeo = useMemo(
    () => (g.type === "poly" ? polyGeometry(g.pts!) : null),
    [g],
  );

  // texture pick (今貌 only): roof planes get tile ridges, timber gets grain, walls get plaster
  const isRoofPlane = c.id.startsWith("roof-");
  const isTimber =
    (c.material && TIMBER_MATS.has(c.material)) || (!c.material && TIMBER_PHASES.has(c.phase));
  let map: THREE.Texture | null = null;
  if (!provMode) {
    if (isRoofPlane) map = g.type === "poly" ? tex.tileU : rot[0] !== 0 ? tex.tileU : tex.tileV;
    else if (isTimber) map = g.type === "cylinder" ? tex.woodV : tex.woodU;
    else if (c.material === "bai" || c.material === "stone") map = tex.plaster;
  }

  const mat = (
    <meshStandardMaterial
      color={isRoofPlane && map ? "#dadcde" : color}
      map={map ?? undefined}
      bumpMap={map && isTimber ? map : undefined}
      bumpScale={0.35}
      roughnessMap={map ?? undefined}
      roughness={provMode ? 1 : 0.9}
    />
  );

  if (g.type === "poly") {
    return (
      <mesh geometry={polyGeo!} castShadow receiveShadow>
        <meshStandardMaterial
          color={map ? "#dadcde" : color}
          map={map ?? undefined}
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  if (g.type === "cylinder") {
    const taper = c.phase === "columns" ? 0.88 : 1;
    const axisRot: [number, number, number] =
      g.axis === "x" ? [0, 0, Math.PI / 2] : g.axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    return (
      <group position={pos} rotation={rot}>
        <mesh rotation={axisRot} castShadow receiveShadow>
          <cylinderGeometry args={[g.r! * taper, g.r!, g.h!, 14]} />
          {mat}
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={[g.w!, g.h!, g.d!]} />
      {mat}
    </mesh>
  );
}

const LEGEND: [string, string, string][] = [
  ["measured", "实测", "Measured"],
  ["reconstructed_design", "复原设计值", "Reconstructed design"],
  ["rule_derived", "法式推导", "Rule-derived (YZFS)"],
  ["conjecture", "推测", "Conjecture"],
];

export default function Viewer() {
  const [provMode, setProvMode] = useState(false);
  const components = useMemo(() => spec.components as Component[], []);
  const cam = useMemo(() => {
    const key = new URLSearchParams(window.location.search).get("cam") ?? "default";
    return CAMS[key] ?? CAMS.default;
  }, []);
  const tex = useMemo<TexKit>(
    () => ({
      tileU: makeTileTexture(true),
      tileV: makeTileTexture(false),
      woodU: makeWoodTexture(false),
      woodV: makeWoodTexture(true),
      plaster: makePlasterTexture(),
    }),
    [],
  );

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: cam.pos, fov: 42 }} shadows>
        <color attach="background" args={["#141416"]} />
        <fog attach="fog" args={["#141416", 36, 95]} />
        <hemisphereLight args={["#56688a", "#3a3026", provMode ? 0.3 : 1.0]} />
        <ambientLight intensity={provMode ? 1.5 : 0.6} />
        <directionalLight
          position={[14, 24, 16]}
          intensity={provMode ? 0.55 : 2.1}
          color={provMode ? "#ffffff" : "#fff0dc"}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-12, 9, -16]} intensity={0.35} color="#9db4d8" />
        <group scale={FEN}>
          {components.map((c) => (
            <Member key={c.id} c={c} provMode={provMode} tex={tex} />
          ))}
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.67, 0]} receiveShadow>
          <circleGeometry args={[60, 64]} />
          <meshStandardMaterial color="#191a1c" roughness={1} />
        </mesh>
        <OrbitControls
          target={cam.target}
          maxPolarAngle={Math.PI / 2.02}
          minDistance={4}
          maxDistance={45}
        />
      </Canvas>

      {/* header */}
      <div style={{ position: "absolute", top: 24, left: 28, pointerEvents: "none" }}>
        <div style={{ fontSize: 30, letterSpacing: 6 }}>南禅寺大殿</div>
        <div style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 4 }}>
          Nanchan Temple Main Hall · 唐建中三年 (782 CE) · derived from ZHANG2022 + 营造法式
        </div>
      </div>

      {/* provenance toggle */}
      <div style={{ position: "absolute", bottom: 28, left: 28 }}>
        <button
          onClick={() => setProvMode(!provMode)}
          style={{
            background: provMode ? "var(--ink)" : "transparent",
            color: provMode ? "#141416" : "var(--ink)",
            border: "1px solid var(--ink-dim)",
            padding: "8px 18px",
            fontSize: 14,
            fontFamily: "inherit",
            letterSpacing: 2,
            cursor: "pointer",
          }}
        >
          溯源图层 Provenance
        </button>
        {provMode && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-dim)" }}>
            {LEGEND.map(([key, zh, en]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ width: 12, height: 12, background: PROV_COLORS[key], display: "inline-block" }} />
                <span>
                  {zh} {en} · {components.filter((c) => c.provenance === key).length}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 6, maxWidth: 300 }}>
              凡无出处者不得渲染 — nothing renders without a source.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
