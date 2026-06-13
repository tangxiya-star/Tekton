"use client";

/**
 * TowersViewer — procedural R3F reconstruction of the WEST TOWERS + FACADE of
 * Notre-Dame de Paris (tier v2). Mirrors SpireViewer.tsx.
 *
 * Renders ONLY from artifacts/structural-spec.notre-dame-towers.json (the rule-
 * engine output). No imported meshes or textures — every component is procedural
 * geometry, every surface a procedural CanvasTexture (components/proceduralTextures).
 * Reference photos are CITE-ONLY (canonical rights_excluded.MODERN-PHOTOS).
 *
 * Demo surface: provenance toggle · click-to-inspect Inspector (FR/EN name + role +
 * source + url + rights) · construction-sequence scrubber (Build Theater) · live
 * VerifierHUD (reads verifier-report.notre-dame-towers.json) · StageRail ·
 * camera stations default/front/detail + close-ups tympanum/rose/king/gargoyle ·
 * a MATERIAL-HYPOTHESIS toggle (as-built / today / sooted) re-tinting the limestone
 * per the canonical material_classes descriptors (all three are cited CONJECTURE for
 * exact colour; the exact RGB is a documented GAP — never invented).
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import spec from "../artifacts/structural-spec.notre-dame-towers.json";
import report from "../artifacts/verifier-report.notre-dame-towers.json";
import StageRail from "./StageRail";
import { makeMaterialTextures, MaterialTextures } from "./proceduralTextures";

const SCALE = (spec as any).units?.scene_scale ?? 1;

type Comp = (typeof spec.components)[number] & {
  rotation_deg?: number[];
  material?: string;
  category?: string;
  note?: string;
  geometry: {
    type: string;
    w?: number; h?: number; d?: number; r?: number; rTop?: number; rt?: number;
    axis?: string; pts?: number[][]; scale?: number[]; seg?: number;
  };
};

const PROV_COLORS: Record<string, string> =
  (spec as any).provenance_colors ?? {
    measured: "#d9a843",
    reconstructed_design: "#a3812f",
    rule_derived: "#5e6ca8",
    conjecture: "#b34a38",
  };

const PROV_LABEL: Record<string, [string, string]> = {
  measured: ["mesuré", "Measured"],
  reconstructed_design: ["dessin reconstitué", "Reconstructed design (VLD / PD plate)"],
  rule_derived: ["dérivé par règle", "Rule-derived (Gothic geometry)"],
  conjecture: ["conjecture", "Conjecture"],
};

// Material-hypothesis tints for the Lutetian limestone. The stone TYPE is MEASURED;
// its exact COLOUR is a documented GAP, so all three of these are cited CONJECTURE
// (descriptors verbatim from data/notre-dame-towers-canonical.json material_classes).
type Hypothesis = "as_built" | "today" | "sooted";
const HYPOTHESES: { key: Hypothesis; fr: string; en: string; tint: string; descriptor: string }[] = [
  { key: "as_built", fr: "à l'origine", en: "As-built", tint: "#e9e1cc", descriptor: "pale cream / ivory" },
  { key: "today", fr: "aujourd'hui", en: "Today", tint: "#d8cfb8", descriptor: "cleaned cream (post-restoration)" },
  { key: "sooted", fr: "encrassé", en: "Sooted", tint: "#5d5a55", descriptor: "soot-blackened grey (pre-1990s)" },
];
// other materials' descriptors (canonical) — limestone is hypothesis-driven above
const MAT_BASE: Record<string, string> = {
  lead: "#7d8590",
  oak: "#6e5535",
  copper_bronze: "#3f8f74",
};

function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((((h % 100) + 100) % 100) / 100 - 0.5) * 0.05;
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
  c, mode, hypothesis, tex, onSelect, selected,
}: {
  c: Comp; mode: Mode; hypothesis: Hypothesis; tex: MaterialTextures; onSelect: (c: Comp) => void; selected: boolean;
}) {
  const g = c.geometry;
  const prov = mode === "prov";
  const rot = (c.rotation_deg ?? [0, 0, 0]).map((d) => (d * Math.PI) / 180) as [number, number, number];
  const pos = c.position as [number, number, number];

  const color = useMemo(() => {
    if (prov) return new THREE.Color(PROV_COLORS[c.provenance] ?? "#888");
    let base: string;
    if (c.material === "limestone" || !c.material) {
      base = HYPOTHESES.find((h) => h.key === hypothesis)!.tint;
    } else {
      base = MAT_BASE[c.material!] ?? "#8a8f97";
    }
    const col = new THREE.Color(base);
    col.offsetHSL(0, 0, jitter(c.id));
    return col;
  }, [prov, c.material, c.provenance, c.id, hypothesis]);

  const map = useMemo(() => {
    if (prov) return null;
    if (c.material === "lead") return tex.lead;
    if (c.material === "oak") return tex.oak;
    return tex.limestone; // limestone + default
  }, [prov, c.material, tex]);

  const customGeo = useMemo(() => {
    if (g.type === "poly") return polyGeometry(g.pts!);
    if (g.type === "lathe")
      return new THREE.LatheGeometry(g.pts!.map((p) => new THREE.Vector2(p[0], p[1])), g.seg ?? 24);
    return null;
  }, [g]);

  const emissive = selected ? new THREE.Color("#fff2c0") : new THREE.Color("#000");
  const mat = prov ? (
    <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
  ) : (
    <meshStandardMaterial
      color={color}
      map={map ?? undefined}
      metalness={c.material === "copper_bronze" ? 0.5 : c.material === "lead" ? 0.3 : 0.04}
      roughness={c.material === "lead" ? 0.55 : c.material === "oak" ? 0.8 : 0.92}
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
    return <mesh position={pos} rotation={rot} castShadow receiveShadow {...handlers}><torusGeometry args={[g.r!, g.rt!, 12, 40]} />{mat}</mesh>;
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

// Facade faces +Z. Stations frame the 43.5 m × 69 m elevation; close-ups frame the
// tympanum, the 9.6 m rose, a Gallery-of-Kings figure, and a chimera/gargoyle.
const CAMS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [56, 50, 96], target: [0, 36, 0] },
  front: { pos: [0, 38, 116], target: [0, 38, 0] },
  detail: { pos: [2, 14, 32], target: [0, 16, 0] },
  provenance: { pos: [56, 50, 96], target: [0, 36, 0] },
  tympanum: { pos: [0, 6.5, 13], target: [0, 5.5, 0] },
  rose: { pos: [0, 30.3, 16], target: [0, 30.3, 0.5] },
  king: { pos: [-6, 23, 13], target: [-6, 22, 0.7] },
  gargoyle: { pos: [-18.75, 48, 9], target: [-18.75, 47, 0.9] },
};

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

function Scene({ mode, hypothesis, visible, onSelect, selectedId }: { mode: Mode; hypothesis: Hypothesis; visible: number; onSelect: (c: Comp) => void; selectedId: string | null; }) {
  const tex = useMemo(() => makeMaterialTextures(), []);
  const comps = useMemo(() => (spec.components as Comp[]).slice().sort((a, b) => (a as any).seq - (b as any).seq), []);
  const shown = comps.filter((c) => (c as any).seq < visible);
  return (
    <group>
      {shown.map((c) => (
        <Member key={c.id} c={c} mode={mode} hypothesis={hypothesis} tex={tex} onSelect={onSelect} selected={selectedId === c.id} />
      ))}
    </group>
  );
}

const MODES: { key: Mode; fr: string; en: string }[] = [
  { key: "built", fr: "reconstruite", en: "Built" },
  { key: "prov", fr: "provenance", en: "Provenance" },
];

export default function TowersViewer() {
  const comps = spec.components as Comp[];
  const total = comps.length;
  const [mode, setMode] = useState<Mode>("built");
  const [hypothesis, setHypothesis] = useState<Hypothesis>("today");
  // Build-theater starts from t=0 for a human landing (no ?cam=): the towers
  // assemble themselves from the first construction step. Automated capture (?cam=)
  // must render the COMPLETE model so the verifier grades the finished geometry.
  const isCam = () =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("cam");
  const [visible, setVisible] = useState(() => (isCam() ? total : 0));
  const [playing, setPlaying] = useState(() => !isCam());
  const [selected, setSelected] = useState<Comp | null>(null);
  const flyingRef = useRef(true);
  const cam = useMemo(() => {
    if (typeof window === "undefined") return CAMS.default;
    return CAMS[new URLSearchParams(window.location.search).get("cam") ?? "default"] ?? CAMS.default;
  }, []);
  const prov = mode === "prov";

  // construction-sequence playback (Build Theater)
  useEffect(() => {
    if (!playing) return;
    if (visible >= total) { setPlaying(false); return; }
    const t = setTimeout(() => setVisible((v) => Math.min(total, v + Math.max(1, Math.round(total / 90)))), 60);
    return () => clearTimeout(t);
  }, [playing, visible, total]);

  // provenance bloom tally (live, over the currently-visible components)
  const tally = useMemo(() => {
    const t: Record<string, number> = { measured: 0, reconstructed_design: 0, rule_derived: 0, conjecture: 0 };
    comps.filter((c) => (c as any).seq < visible).forEach((c) => { t[c.provenance] = (t[c.provenance] ?? 0) + 1; });
    return t;
  }, [comps, visible]);

  // last few revealed components → streaming reasoning trace
  const trace = useMemo(() => {
    const sorted = comps.slice().sort((a, b) => (a as any).seq - (b as any).seq);
    return sorted.filter((c) => (c as any).seq < visible).slice(-6).reverse();
  }, [comps, visible]);

  const phaseNow = trace[0]?.phase ?? "—";
  const goal = cam;
  const hyp = HYPOTHESES.find((h) => h.key === hypothesis)!;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#141416", color: "var(--ink, #e8e2d4)", fontFamily: "var(--font, system-ui)" }}>
      <Canvas camera={{ position: cam.pos, fov: 42 }} shadows>
        <color attach="background" args={["#141416"]} />
        <fog attach="fog" args={["#141416", 90, 280]} />
        <hemisphereLight args={["#7c8aa8", "#2a2620", prov ? 0.4 : 0.55]} />
        <ambientLight intensity={prov ? 1.6 : 0.3} />
        <directionalLight
          position={[40, 110, 90]} intensity={prov ? 0.4 : 1.45} color={prov ? "#ffffff" : "#fff2dc"}
          castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-60} shadow-camera-right={60} shadow-camera-top={90} shadow-camera-bottom={-10} shadow-bias={-0.0004}
        />
        <directionalLight position={[-60, 50, 40]} intensity={0.4} color="#9db4d8" />
        <Suspense fallback={null}>
          {!prov && <Environment files="/hdri/kloofendal_overcast_puresky_1k.hdr" environmentIntensity={0.8} />}
          <Scene mode={mode} hypothesis={hypothesis} visible={visible} onSelect={setSelected} selectedId={selected?.id ?? null} />
        </Suspense>
        {/* ground plane (scene chrome, not data) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[400, 48]} />
          <meshStandardMaterial color="#161719" roughness={1} />
        </mesh>
        <OrbitControls makeDefault onStart={() => { flyingRef.current = false; }} target={[0, 36, 0]} maxDistance={300} minDistance={4} maxPolarAngle={Math.PI / 1.9} />
        <CameraRig goal={goal} flyingRef={flyingRef} />
      </Canvas>

      {/* header */}
      <div style={{ position: "absolute", top: 58, left: 26, pointerEvents: "none", textShadow: "0 1px 8px #000" }}>
        <div style={{ fontSize: 26, letterSpacing: 2.5, fontWeight: 600 }}>Façade occidentale et tours · Notre-Dame de Paris</div>
        <div style={{ fontSize: 12, color: "#b9b2a2", marginTop: 4, maxWidth: 560 }}>
          West facade &amp; towers · the harmonic facade (c.1200–1250), restored by Viollet-le-Duc &amp; Lassus · 43.5&nbsp;m wide · towers 69&nbsp;m · rose 9.6&nbsp;m · derived from the verified corpus + Gothic rules
        </div>
      </div>

      {/* mode toggle + provenance legend / bloom */}
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
          {prov ? "Nothing renders without a source — colour = evidence class. Click any element to see its citation." : "Procedural surfaces only — no imported textures. Reference photos are cite-only."}
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

      {/* material-hypothesis toggle (CONJECTURE — exact colour is a GAP) */}
      {!prov && (
        <div style={{ position: "absolute", top: 140, left: 26, width: 260, background: "#1c1d20cc", border: "1px solid #3a3833", padding: 12, backdropFilter: "blur(4px)" }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#cfc8b8", marginBottom: 7 }}>STONE COLOUR · HYPOTHESIS</div>
          <div style={{ display: "inline-flex", border: "1px solid #4a4640", marginBottom: 8 }}>
            {HYPOTHESES.map((h, i) => (
              <button key={h.key} onClick={() => setHypothesis(h.key)}
                style={{ background: h.key === hypothesis ? "#e8e2d4" : "transparent", color: h.key === hypothesis ? "#141416" : "#e8e2d4", border: "none", borderLeft: i ? "1px solid #4a4640" : "none", padding: "6px 11px", fontSize: 11.5, cursor: "pointer" }}>
                {h.en}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "#9a948a", lineHeight: 1.5 }}>
            <span style={{ color: "#cfc8b8" }}>{hyp.descriptor}</span>. Lutetian limestone TYPE is <span style={{ color: PROV_COLORS.measured }}>measured</span>; exact colour is a documented <b>GAP</b> — all three tints are flagged <span style={{ color: PROV_COLORS.conjecture }}>CONJECTURE</span>, never invented as fact.
          </div>
        </div>
      )}

      {/* construction-sequence scrubber + reasoning trace (Build Theater) */}
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

      {/* pipeline stage rail */}
      <StageRail active={visible < total ? "derive" : "verify"} />

      {/* live verifier HUD */}
      <VerifierHUD />

      {/* click-to-inspect panel */}
      {selected && <Inspector c={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function VerifierHUD() {
  const checks = (report as any).checks?.filter((c: any) => c.method === "spec-geometry") ?? [];
  const summary = (report as any).summary ?? { pass: 0, total: 0 };
  return (
    <div style={{ position: "absolute", top: 22, right: 26, width: 256, background: "#1c1d20cc", border: "1px solid #3a3833", padding: 12, fontSize: 11, backdropFilter: "blur(4px)" }}>
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
  const [, en] = PROV_LABEL[c.provenance] ?? [c.provenance, c.provenance];
  return (
    <div style={{ position: "absolute", top: "50%", left: 26, transform: "translateY(-50%)", width: 320, background: "#1c1d20ee", border: "1px solid #3a3833", padding: 18, backdropFilter: "blur(6px)" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#8c867a", fontSize: 16, cursor: "pointer" }}>×</button>
      <div style={{ fontSize: 16, color: "#e8e2d4", fontWeight: 600 }}>{(c as any).name_fr}</div>
      <div style={{ fontSize: 12, color: "#b9b2a2" }}>{(c as any).name_en}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11 }}>
        <span style={{ width: 11, height: 11, background: PROV_COLORS[c.provenance], display: "inline-block" }} />
        <span style={{ color: "#cfc8b8" }}>{en}</span>
        {c.material && <span style={{ color: "#8c867a", marginLeft: 4 }}>· {c.material}</span>}
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
