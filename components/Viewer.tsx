"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import spec from "../artifacts/structural-spec.json";

const FEN = 0.0165; // 1 fen = 16.5 mm → scene meters

type Component = (typeof spec.components)[number] & {
  rotation_deg?: number[];
  geometry: { type: string; w?: number; h?: number; d?: number; r?: number; axis?: string };
};

const PROV_COLORS: Record<string, string> = {
  measured: "#d9a441",
  reconstructed_design: "#b07c2e",
  rule_derived: "#5566b8",
  conjecture: "#c0392b",
};

const PHASE_COLORS: Record<string, string> = {
  platform: "#a8a294", // stone
  columns: "#8e3b2f",  // 朱
  puzuo: "#8e3b2f",    // 朱
  frame: "#a9845e",    // 素木
  roof: "#686c70",     // 灰瓦
};

function Member({ c, provMode }: { c: Component; provMode: boolean }) {
  const g = c.geometry;
  const rot = (c.rotation_deg ?? [0, 0, 0]).map((d) => (d * Math.PI) / 180) as [
    number, number, number,
  ];
  const color = provMode ? PROV_COLORS[c.provenance] : PHASE_COLORS[c.phase] ?? "#888";
  const pos = c.position as [number, number, number];

  if (g.type === "cylinder") {
    return (
      <group position={pos} rotation={rot}>
        <mesh rotation={g.axis === "x" ? [0, 0, Math.PI / 2] : [0, 0, 0]}>
          <cylinderGeometry args={[g.r!, g.r!, g.h!, 16]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={[g.w!, g.h!, g.d!]} />
      <meshStandardMaterial color={color} roughness={0.85} />
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

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: [16, 9, 19], fov: 42 }} shadows={false}>
        <color attach="background" args={["#141416"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[14, 22, 10]} intensity={1.4} />
        <directionalLight position={[-10, 8, -14]} intensity={0.35} />
        <group scale={FEN}>
          {components.map((c) => (
            <Member key={c.id} c={c} provMode={provMode} />
          ))}
        </group>
        {/* ground reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.67, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#1c1c1e" roughness={1} />
        </mesh>
        <OrbitControls target={[0, 3.2, 0]} maxPolarAngle={Math.PI / 2.02} />
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
                  {zh} {en} ·{" "}
                  {components.filter((c) => c.provenance === key).length}
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
