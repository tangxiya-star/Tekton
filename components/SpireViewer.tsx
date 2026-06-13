"use client";

/**
 * SpireViewer — procedural R3F reconstruction of the Notre-Dame spire (la flèche).
 *
 * Renders ONLY from artifacts/structural-spec.notre-dame.json (the rule-engine
 * output). No imported meshes — every component is procedural geometry. Each mesh
 * carries userData {componentId, provenance, source, citation} for inspection.
 *
 * Demo surface: provenance toggle (ND-10) · click-to-inspect (ND-17) ·
 * construction-sequence scrubber + reasoning trace (ND-16/23) · live verifier HUD
 * (ND-24) · pipeline stage rail (ND-26). Provenance bloom tally (ND-25).
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import spec from "../artifacts/structural-spec.notre-dame.json";
import report from "../artifacts/verifier-report.notre-dame.json";
import DrawingReveal from "./DrawingReveal";
import StageRail from "./StageRail";

const SCALE = (spec as any).units?.scene_scale ?? 1;

type Comp = (typeof spec.components)[number] & {
  rotation_deg?: number[];
  material?: string;
  category?: string;
  statue_kind?: string;
  faces_inward?: boolean;
  note?: string;
  geometry: {
    type: string;
    w?: number; h?: number; d?: number; r?: number; rTop?: number; rt?: number;
    axis?: string; pts?: number[][]; scale?: number[]; seg?: number;
    arc?: number; arcStart?: number; // optional lathe sweep (radians) — a hemicycle apse, not a full revolve
  };
};

const PROV_COLORS: Record<string, string> =
  (spec as any).provenance_colors ?? {
    measured: "#d9a843",
    reconstructed_design: "#a3812f",
    rule_derived: "#5e6ca8",
    conjecture: "#b34a38",
  };

// "Built" palette — the 2024 reconstruction à l'identique: lead-grey cladding over
// an oak armature, oxidised-copper statuary, gilt summit.
const MAT_COLORS: Record<string, string> = {
  lead: "#7d8590",   // dark blue-grey lead sheet
  oak: "#6e5535",    // oak armature
  copper: "#3f8f74", // verdigris copper statues
  gilt: "#d8b24a",   // gilded coq + orb
  stone: "#c9bda0",  // Lutetian limestone — the cathedral masonry massing
};

// Whole-cathedral massing categories that are MASONRY (rendered as limestone) vs.
// lead-clad (roof/apse keep the spec's lead). This is a render-side material
// treatment of the massing categories; the data stays as authored (lead). It lets
// the masonry body read as a cathedral and separates it from the lead spire/roof.
const MASONRY_CATEGORIES = new Set([
  "massing-westfront", "massing-tower", "massing-nave", "massing-aisle",
  "massing-crossing", "massing-transept", "massing-choir",
]);
// Built-mode material for a component: massing masonry → limestone; everything
// else uses its authored material (lead spire/roof/apse, oak, copper, gilt).
function builtMaterial(c: Comp): string {
  if (c.fidelity === "massing" && c.category && MASONRY_CATEGORIES.has(c.category)) return "stone";
  return c.material ?? "lead";
}
const PROV_LABEL: Record<string, [string, string]> = {
  measured: ["mesuré", "Measured"],
  reconstructed_design: ["dessin reconstitué", "Reconstructed design (VLD plate)"],
  rule_derived: ["dérivé par règle", "Rule-derived (Gothic geometry)"],
  conjecture: ["conjecture", "Conjecture"],
};

function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((((h % 100) + 100) % 100) / 100 - 0.5) * 0.06;
}

function polyGeometry(pts: number[][]) {
  const geo = new THREE.BufferGeometry();
  const tri = pts.length === 3
    ? [...pts[0], ...pts[1], ...pts[2]]
    : [...pts[0], ...pts[1], ...pts[2], ...pts[0], ...pts[2], ...pts[3]];
  geo.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  geo.computeVertexNormals();
  return geo;
}

type Mode = "built" | "prov";

function Member({
  c, mode, onSelect, selected,
}: {
  c: Comp; mode: Mode; onSelect: (c: Comp) => void; selected: boolean;
}) {
  const g = c.geometry;
  const prov = mode === "prov";
  const rot = (c.rotation_deg ?? [0, 0, 0]).map((d) => (d * Math.PI) / 180) as [number, number, number];
  const pos = c.position as [number, number, number];

  const builtMat = builtMaterial(c);
  const color = useMemo(() => {
    if (prov) return new THREE.Color(PROV_COLORS[c.provenance] ?? "#888");
    const base = MAT_COLORS[builtMat] || "#8a8f97";
    const col = new THREE.Color(base);
    // gentler tonal variation on the broad massing shells, full jitter on detail
    col.offsetHSL(0, 0, jitter(c.id) * (c.fidelity === "massing" ? 0.4 : 1));
    return col;
  }, [prov, builtMat, c.provenance, c.id, c.fidelity]);

  const customGeo = useMemo(() => {
    if (g.type === "poly") return polyGeometry(g.pts!);
    if (g.type === "lathe")
      return new THREE.LatheGeometry(
        g.pts!.map((p) => new THREE.Vector2(p[0], p[1])),
        g.seg ?? 24,
        g.arcStart ?? 0,
        g.arc ?? Math.PI * 2, // a hemicycle apse passes arc=π so it reads as a chevet, not a full dome
      );
    return null;
  }, [g]);

  const emissive = selected ? new THREE.Color("#fff2c0") : new THREE.Color("#000");
  const mat = prov ? (
    <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
  ) : (
    <meshStandardMaterial
      color={color}
      metalness={builtMat === "gilt" || builtMat === "copper" ? 0.55 : builtMat === "lead" ? 0.35 : 0.04}
      roughness={builtMat === "gilt" ? 0.3 : builtMat === "lead" ? 0.55 : builtMat === "stone" ? 0.95 : 0.85}
      emissive={emissive}
      emissiveIntensity={selected ? 0.35 : 0}
      side={g.type === "poly" || g.type === "lathe" ? THREE.DoubleSide : THREE.FrontSide}
      envMapIntensity={0.5}
    />
  );

  const handlers = {
    onClick: (e: any) => { e.stopPropagation(); onSelect(c); },
    onPointerOver: (e: any) => { e.stopPropagation(); document.body.style.cursor = "pointer"; },
    onPointerOut: () => { document.body.style.cursor = "auto"; },
  };

  if (g.type === "lathe")
    return <mesh position={pos} rotation={rot} geometry={customGeo!} castShadow receiveShadow {...handlers}>{mat}</mesh>;
  if (g.type === "poly")
    return <mesh geometry={customGeo!} castShadow receiveShadow {...handlers}>{mat}</mesh>;
  if (g.type === "capsule")
    return <mesh position={pos} rotation={rot} castShadow receiveShadow {...handlers}><capsuleGeometry args={[g.r!, g.h!, 6, 14]} />{mat}</mesh>;
  if (g.type === "torus")
    return <mesh position={pos} rotation={rot} castShadow receiveShadow {...handlers}><torusGeometry args={[g.r!, g.rt!, 12, 28]} />{mat}</mesh>;
  if (g.type === "sphere")
    return <mesh position={pos} rotation={rot} scale={(g.scale ?? [1, 1, 1]) as [number, number, number]} castShadow receiveShadow {...handlers}><sphereGeometry args={[g.r!, 20, 16]} />{mat}</mesh>;
  if (g.type === "cone")
    return <mesh position={pos} rotation={rot} scale={(g.scale ?? [1, 1, 1]) as [number, number, number]} castShadow receiveShadow {...handlers}><cylinderGeometry args={[g.rTop ?? 0.01, g.r!, g.h!, 18]} />{mat}</mesh>;
  if (g.type === "cylinder") {
    const axisRot: [number, number, number] = g.axis === "x" ? [0, 0, Math.PI / 2] : g.axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    return <group position={pos} rotation={rot}><mesh rotation={axisRot} castShadow receiveShadow {...handlers}><cylinderGeometry args={[g.r!, g.r!, g.h!, 16]} />{mat}</mesh></group>;
  }
  return <mesh position={pos} rotation={rot} castShadow receiveShadow {...handlers}><boxGeometry args={[g.w!, g.h!, g.d!]} />{mat}</mesh>;
}

// Whether the spec carries whole-cathedral massing (PASS 1) or is spire-only.
// When massing is present we frame the WHOLE silhouette (128 m nave, west front +
// twin towers, transept, the flèche on the crossing, apse); otherwise we keep the
// original spire stations. Both render from the same flat components[].
const HAS_MASSING = (spec.components as Comp[]).some((c) => c.fidelity === "massing");

// Camera stations.
//  - WHOLE cathedral: default = a 3/4 view down the south flank showing the full
//    silhouette with the spire on the crossing; front = west façade head-on (twin
//    towers, spire rising behind); aerial = high oblique reading the cruciform plan;
//    detail = the spire close-up (the full-fidelity hero); provenance = default view.
//  - Spire-only fallback keeps the original spire framing.
const CATHEDRAL_CAMS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [128, 96, 150], target: [-2, 36, 0] },
  front: { pos: [-176, 58, 2], target: [-8, 40, 0] },
  aerial: { pos: [60, 205, 150], target: [4, 18, 0] },
  // the full-fidelity spire hero, framed rising above the crossing roof (its
  // lower souche sits inside the crossing massing, top at 43 m; summit at 96 m)
  detail: { pos: [46, 72, 70], target: [0, 70, 0] },
  provenance: { pos: [128, 96, 150], target: [-2, 36, 0] },
};
const SPIRE_CAMS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [62, 58, 104], target: [0, 60, 0] },
  front: { pos: [0, 60, 138], target: [0, 60, 0] },
  detail: { pos: [11, 47, 17], target: [0, 44, 0] },
  provenance: { pos: [62, 58, 104], target: [0, 60, 0] },
};
const CAMS = HAS_MASSING ? CATHEDRAL_CAMS : SPIRE_CAMS;

function CameraRig({ goal, flyingRef }: { goal: { pos: [number, number, number]; target: [number, number, number] }; flyingRef: React.MutableRefObject<boolean>; }) {
  const { camera, controls } = useThree();
  const gp = useMemo(() => new THREE.Vector3(...goal.pos), [goal]);
  const gt = useMemo(() => new THREE.Vector3(...goal.target), [goal]);
  useEffect(() => { flyingRef.current = true; }, [goal, flyingRef]);
  useFrame(() => {
    if (!flyingRef.current) return;
    const ctl = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    camera.position.lerp(gp, 0.07);
    if (ctl?.target) { ctl.target.lerp(gt, 0.07); ctl.update(); }
    if (camera.position.distanceTo(gp) < 0.4) flyingRef.current = false;
  });
  return null;
}

function Scene({ mode, visible, onSelect, selectedId }: { mode: Mode; visible: number; onSelect: (c: Comp) => void; selectedId: string | null; }) {
  const comps = useMemo(() => (spec.components as Comp[]).slice().sort((a, b) => (a as any).seq - (b as any).seq), []);
  const shown = comps.filter((c) => (c as any).seq < visible);
  return (
    <group>
      {shown.map((c) => (
        <Member key={c.id} c={c} mode={mode} onSelect={onSelect} selected={selectedId === c.id} />
      ))}
    </group>
  );
}

const MODES: { key: Mode; fr: string; en: string }[] = [
  { key: "built", fr: "reconstruite", en: "Built" },
  { key: "prov", fr: "provenance", en: "Provenance" },
];

export default function SpireViewer() {
  const comps = spec.components as Comp[];
  const total = comps.length;
  const [mode, setMode] = useState<Mode>("built");
  const [visible, setVisible] = useState(total);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<Comp | null>(null);
  // Drawing→3D reveal (ND-11): a human landing (no ?cam=) opens on Viollet-le-Duc's
  // PD elevation; automated capture (?cam=) skips it so the verifier grades the 3D scene.
  const [revealed, setRevealed] = useState(() =>
    typeof window === "undefined" ? true : new URLSearchParams(window.location.search).has("cam")
  );
  const flyingRef = useRef(true);
  const cam = useMemo(() => {
    if (typeof window === "undefined") return CAMS.default;
    return CAMS[new URLSearchParams(window.location.search).get("cam") ?? "default"] ?? CAMS.default;
  }, []);
  const prov = mode === "prov";

  // construction-sequence playback (ND-16 / Build Theater backbone)
  useEffect(() => {
    if (!playing) return;
    if (visible >= total) { setPlaying(false); return; }
    const t = setTimeout(() => setVisible((v) => Math.min(total, v + Math.max(1, Math.round(total / 90)))), 60);
    return () => clearTimeout(t);
  }, [playing, visible, total]);

  // provenance bloom tally (live, over the currently-visible components) — ND-25
  const tally = useMemo(() => {
    const t: Record<string, number> = { measured: 0, reconstructed_design: 0, rule_derived: 0, conjecture: 0 };
    comps.filter((c) => (c as any).seq < visible).forEach((c) => { t[c.provenance] = (t[c.provenance] ?? 0) + 1; });
    return t;
  }, [comps, visible]);

  // the last few revealed components → streaming reasoning trace (ND-23)
  const trace = useMemo(() => {
    const sorted = comps.slice().sort((a, b) => (a as any).seq - (b as any).seq);
    return sorted.filter((c) => (c as any).seq < visible).slice(-6).reverse();
  }, [comps, visible]);

  const phaseNow = trace[0]?.phase ?? "—";
  const goal = cam;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#141416", color: "var(--ink, #e8e2d4)", fontFamily: "var(--font, system-ui)" }}>
      <Canvas camera={{ position: cam.pos, fov: 40, far: HAS_MASSING ? 1200 : 600 }} shadows>
        <color attach="background" args={["#141416"]} />
        {/* push fog back for the 128 m whole-cathedral framing; keep the tighter
            spire fog when massing is absent */}
        <fog attach="fog" args={["#141416", HAS_MASSING ? 180 : 80, HAS_MASSING ? 460 : 230]} />
        <hemisphereLight args={["#7c8aa8", "#2a2620", prov ? 0.4 : 0.55]} />
        <ambientLight intensity={prov ? 1.6 : 0.25} />
        <directionalLight
          position={HAS_MASSING ? [120, 170, 90] : [60, 120, 50]} intensity={prov ? 0.4 : 1.5} color={prov ? "#ffffff" : "#fff2dc"}
          castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-left={HAS_MASSING ? -90 : -60} shadow-camera-right={HAS_MASSING ? 90 : 60}
          shadow-camera-top={HAS_MASSING ? 160 : 120} shadow-camera-bottom={-10}
          shadow-camera-near={1} shadow-camera-far={HAS_MASSING ? 420 : 300} shadow-bias={-0.0004}
        />
        <directionalLight position={[-50, 60, -60]} intensity={0.4} color="#9db4d8" />
        <Suspense fallback={null}>
          {!prov && <Environment files="/hdri/kloofendal_overcast_puresky_1k.hdr" environmentIntensity={0.8} />}
          <Scene mode={mode} visible={visible} onSelect={setSelected} selectedId={selected?.id ?? null} />
        </Suspense>
        {/* faint crossing platform the flèche is anchored on (scene chrome, not data) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 29.4, 0]} receiveShadow>
          <circleGeometry args={[11, 8]} />
          <meshStandardMaterial color="#24252a" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[400, 48]} />
          <meshStandardMaterial color="#161719" roughness={1} />
        </mesh>
        <OrbitControls makeDefault onStart={() => { flyingRef.current = false; }} target={HAS_MASSING ? [-2, 36, 0] : [0, 60, 0]} maxDistance={HAS_MASSING ? 520 : 260} minDistance={6} maxPolarAngle={Math.PI / 1.9} />
        <CameraRig goal={goal} flyingRef={flyingRef} />
      </Canvas>

      {/* header */}
      <div style={{ position: "absolute", top: 22, left: 26, pointerEvents: "none", textShadow: "0 1px 8px #000" }}>
        <div style={{ fontSize: 28, letterSpacing: 3, fontWeight: 600 }}>
          {HAS_MASSING ? "Notre-Dame de Paris" : "Flèche de Notre-Dame de Paris"}
        </div>
        <div style={{ fontSize: 12, color: "#b9b2a2", marginTop: 4, maxWidth: 540 }}>
          {HAS_MASSING
            ? "Whole-cathedral massing (PASS 1) · 128 m long · west front + twin towers (69 m) · transept (48 m) · the full-fidelity flèche on the crossing (96 m) · apse — derived from the verified corpus; the toggle shows the fidelity gradient"
            : "Spire of Notre-Dame · Viollet-le-Duc 1859, rebuilt à l'identique 2024 · 96 m · derived from the verified corpus + Gothic rules"}
        </div>
      </div>

      {/* mode toggle + provenance legend / bloom (ND-10, ND-25) */}
      <div style={{ position: "absolute", bottom: 26, left: 26 }}>
        <div style={{ display: "inline-flex", border: "1px solid #4a4640" }}>
          {MODES.map((m, i) => (
            <button key={m.key} onClick={() => setMode(m.key)}
              style={{ background: m.key === mode ? "#e8e2d4" : "transparent", color: m.key === mode ? "#141416" : "#e8e2d4", border: "none", borderLeft: i ? "1px solid #4a4640" : "none", padding: "8px 16px", fontSize: 13, letterSpacing: 1.5, cursor: "pointer" }}>
              {m.en}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: "#b9b2a2", maxWidth: 360 }}>
          {prov
            ? (HAS_MASSING
                ? "Nothing renders without a source — colour = evidence class. Massing is measured / rule-derived; the spire is full fidelity. Click any element for its citation."
                : "Nothing renders without a source — colour = evidence class. Click any element to see its citation.")
            : (HAS_MASSING
                ? "Limestone masonry massing carries the lead-clad spire à l'identique — measured volumes, recognizable silhouette. Switch to Provenance for the fidelity gradient."
                : "The reconstruction à l'identique: lead over an oak armature, oxidised-copper statuary, gilt coq.")}
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5 }}>
          {Object.entries(PROV_LABEL).map(([k, [, en]]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ width: 12, height: 12, background: PROV_COLORS[k], display: "inline-block", border: "1px solid #0006" }} />
              <span style={{ color: "#cfc8b8" }}>{en} · {tally[k] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* construction-sequence scrubber + reasoning trace (ND-16, ND-22, ND-23) */}
      <div style={{ position: "absolute", bottom: 26, right: 26, width: 320, background: "#1c1d20cc", border: "1px solid #3a3833", padding: 14, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, letterSpacing: 1 }}>
          <span style={{ color: "#cfc8b8" }}>BUILD THEATER · {phaseNow}</span>
          <span style={{ color: "#8c867a" }}>{Math.min(visible, total)}/{total}</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => { if (visible >= total) setVisible(0); setPlaying((p) => !p); }}
            style={{ background: "#e8e2d4", color: "#141416", border: "none", padding: "5px 14px", fontSize: 12, cursor: "pointer" }}>
            {playing ? "❚❚ Pause" : visible >= total ? "↻ Replay build" : "▶ Play build"}
          </button>
          <button onClick={() => { setPlaying(false); setVisible(total); }}
            style={{ background: "transparent", color: "#e8e2d4", border: "1px solid #4a4640", padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
            Full
          </button>
        </div>
        <input type="range" min={0} max={total} value={visible}
          onChange={(e) => { setPlaying(false); setVisible(Number(e.target.value)); }}
          style={{ width: "100%", marginTop: 10, accentColor: "#d9a843" }} />
        <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.5, color: "#9a948a", height: 92, overflow: "hidden" }}>
          {trace.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, marginTop: 3, flexShrink: 0, background: PROV_COLORS[c.provenance], display: "inline-block" }} />
              <span><span style={{ color: "#cfc8b8" }}>{(c as any).name_en}</span> · {c.source}</span>
            </div>
          ))}
        </div>
      </div>

      {/* pipeline stage rail (ND-26) */}
      <StageRail active={visible < total ? "derive" : "verify"} />

      {/* live verifier HUD (ND-24) */}
      <VerifierHUD />

      {/* click-to-inspect panel (ND-17) */}
      {selected && <Inspector c={selected} onClose={() => setSelected(null)} />}

      {/* drawing → 3D reveal (ND-11) — opens on Viollet-le-Duc's PD elevation */}
      {!revealed && <DrawingReveal onReveal={() => setRevealed(true)} />}
    </div>
  );
}

function VerifierHUD() {
  const checks = (report as any).checks?.filter((c: any) => c.method === "spec-geometry") ?? [];
  const summary = (report as any).summary ?? { pass: 0, total: 0 };
  return (
    <div style={{ position: "absolute", top: 22, right: 26, width: 252, background: "#1c1d20cc", border: "1px solid #3a3833", padding: 12, fontSize: 11, backdropFilter: "blur(4px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#cfc8b8", letterSpacing: 1, marginBottom: 6 }}>
        <span>VERIFIER</span>
        <span style={{ color: summary.fail ? "#b34a38" : "#7bbf7b" }}>{summary.pass}/{summary.total} ✓</span>
      </div>
      {checks.map((c: any) => (
        <div key={c.id} style={{ display: "flex", gap: 6, marginBottom: 2, color: c.pass ? "#9a948a" : "#d98a78" }}>
          <span style={{ color: c.pass ? "#7bbf7b" : "#b34a38", width: 14 }}>{c.pass ? "✓" : "✗"}</span>
          <span style={{ width: 30, color: c.critical ? "#d9a843" : "#8c867a" }}>{c.id}</span>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.assert.split(/[—:.]/)[0]}</span>
        </div>
      ))}
    </div>
  );
}

function Inspector({ c, onClose }: { c: Comp; onClose: () => void }) {
  const [fr, en] = PROV_LABEL[c.provenance] ?? [c.provenance, c.provenance];
  return (
    <div style={{ position: "absolute", top: "50%", left: 26, transform: "translateY(-50%)", width: 320, background: "#1c1d20ee", border: "1px solid #3a3833", padding: 18, backdropFilter: "blur(6px)" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#8c867a", fontSize: 16, cursor: "pointer" }}>×</button>
      <div style={{ fontSize: 16, color: "#e8e2d4", fontWeight: 600 }}>{(c as any).name_fr}</div>
      <div style={{ fontSize: 12, color: "#b9b2a2" }}>{(c as any).name_en}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11 }}>
        <span style={{ width: 11, height: 11, background: PROV_COLORS[c.provenance], display: "inline-block" }} />
        <span style={{ color: "#cfc8b8" }}>{en}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "#9a948a", marginTop: 10, lineHeight: 1.5 }}>{(c as any).role}</div>
      <div style={{ marginTop: 12, fontSize: 11, color: "#cfc8b8" }}>
        Source · <span style={{ color: "#d9a843" }}>{c.source}</span> · <span style={{ color: "#8c867a" }}>{(c as any).rights}</span>
      </div>
      <a href={(c as any).url} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: "#7c8aa8", wordBreak: "break-all", display: "block", marginTop: 3 }}>
        {(c as any).url}
      </a>
      {(c as any).note && <div style={{ fontSize: 10.5, color: "#7d776c", marginTop: 10, lineHeight: 1.45, fontStyle: "italic" }}>{(c as any).note}</div>}
    </div>
  );
}
