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
  geometry: { type: string; w?: number; h?: number; d?: number; r?: number; axis?: string };
};

const PROV_COLORS: Record<string, string> = {
  measured: "#dca83f",
  reconstructed_design: "#a87f2c",
  rule_derived: "#5b6cb8",
  conjecture: "#bb4434",
};

const MATERIAL_COLORS: Record<string, string> = {
  zhu: "#84432f",   // 朱 (weathered earth-vermilion)
  bai: "#ddd2b9",   // 白 (aged lime)
  huiwa: "#565b60", // 灰瓦
  sumu: "#97795a",  // 素木
  stone: "#9b9489",
  door: "#5d2a1e",
};

const PHASE_COLORS: Record<string, string> = {
  platform: "#9b9489",
  columns: "#84432f",
  puzuo: "#84432f",
  frame: "#97795a",
  roof: "#565b60",
  enclosure: "#ddd2b9",
};

/** Stable per-component tone offset so timber doesn't look injection-molded. */
function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h % 100) + 100) % 100 / 100 - 0.5) * 0.07;
}

function makeTileTexture(vertical: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#62666b";
  g.fillRect(0, 0, 128, 128);
  for (let p = 0; p < 128; p += 16) {
    g.fillStyle = "rgba(10,12,14,0.30)";
    vertical ? g.fillRect(p, 0, 3, 128) : g.fillRect(0, p, 128, 3);
    g.fillStyle = "rgba(255,255,255,0.06)";
    vertical ? g.fillRect(p + 8, 0, 6, 128) : g.fillRect(0, p + 8, 128, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(vertical ? 14 : 2, vertical ? 2 : 14);
  return t;
}

function Member({
  c,
  provMode,
  tileU,
  tileV,
}: {
  c: Component;
  provMode: boolean;
  tileU: THREE.Texture | null;
  tileV: THREE.Texture | null;
}) {
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

  // tiled roof planes get the ridge-line texture (今貌 only)
  const isRoofPlane = c.id.startsWith("roof-");
  const map = !provMode && isRoofPlane ? (rot[0] !== 0 ? tileU : tileV) : null;

  const mat = (
    <meshStandardMaterial
      color={map ? "#c8cbce" : color}
      map={map ?? undefined}
      roughness={provMode ? 1 : 0.85}
      emissive={provMode ? baseColor : "#000000"}
      emissiveIntensity={provMode ? 0.22 : 0}
    />
  );

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
  const tileU = useMemo(() => makeTileTexture(true), []);
  const tileV = useMemo(() => makeTileTexture(false), []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [16, 9, 19], fov: 42 }} shadows>
        <color attach="background" args={["#141416"]} />
        <fog attach="fog" args={["#141416", 36, 95]} />
        <hemisphereLight args={["#3d4250", "#2a241d", 0.7]} />
        <ambientLight intensity={0.32} />
        <directionalLight
          position={[16, 26, 12]}
          intensity={1.7}
          color="#ffe8c8"
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
            <Member key={c.id} c={c} provMode={provMode} tileU={tileU} tileV={tileV} />
          ))}
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.67, 0]} receiveShadow>
          <circleGeometry args={[60, 64]} />
          <meshStandardMaterial color="#191a1c" roughness={1} />
        </mesh>
        <OrbitControls
          target={[0, 3.2, 0]}
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
