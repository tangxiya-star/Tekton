"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import spec from "../artifacts/structural-spec.json";
import PlaybackControls, { PlaybackControlsProps } from "./PlaybackControls";
import { AnnotationPanel, AnnotationData } from "./AnnotationPanel";
import { ClickHandler } from "./ClickHandler";

/** First-person camera controller with WASD movement and mouse look. */
function FirstPersonController({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const keysPressed = useRef<Record<string, boolean>>({});
  const pitchRef = useRef(0);
  const yawRef = useRef(0);
  const velocity = useRef(new THREE.Vector3());
  const moveSpeed = 0.12;
  const mouseSpeed = 0.005;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!enabled) return;
      yawRef.current -= e.movementX * mouseSpeed;
      pitchRef.current -= e.movementY * mouseSpeed;
      pitchRef.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitchRef.current));

      const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRef.current);
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
      camera.quaternion.multiplyQuaternions(qy, qx);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [camera, enabled]);

  useFrame(() => {
    if (!enabled) return;

    velocity.current.set(0, 0, 0);
    if (keysPressed.current["w"]) velocity.current.z -= moveSpeed;
    if (keysPressed.current["s"]) velocity.current.z += moveSpeed;
    if (keysPressed.current["a"]) velocity.current.x -= moveSpeed;
    if (keysPressed.current["d"]) velocity.current.x += moveSpeed;
    if (keysPressed.current[" "]) velocity.current.y += moveSpeed;
    if (keysPressed.current["shift"]) velocity.current.y -= moveSpeed;

    velocity.current.applyQuaternion(camera.quaternion);
    camera.position.add(velocity.current);
  });

  return null;
}

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
    rTop?: number;
    rt?: number;
    axis?: string;
    pts?: number[][];
    scale?: number[];
    seg?: number;
    url?: string;
    targetH?: number;
    faceDeg?: number;
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
  // 彩塑 statue massing palette
  jin: "#c79a52",   // 金 gilt face/halo
  caisu: "#9d5f4b", // 彩塑 faded polychrome robe / mandorla field
  lian: "#c08a8c",  // 莲 lotus pink
  shou: "#c6c0b2",  // 兽 lion/elephant whitish clay
  qing: "#3c4654",  // 青 hair blue-black
  shilv: "#7f9b82", // 石绿 mineral-green mane / mandorla rim
  ya: "#e8e2d2",    // 牙 ivory white
};

const PHASE_COLORS: Record<string, string> = {
  platform: "#b9b4a8",
  columns: "#a8402c",
  puzuo: "#a8402c",
  frame: "#a8402c",
  roof: "#84878a",
  enclosure: "#ece7dc",
  statues: "#c6c0b2",
};

type ViewMode = "today" | "recon" | "prov";

/**
 * Tint applied (multiplicatively) OVER a photo-scanned albedo, so values are
 * brighter than the bare hex they encode. `k` is extra gain for dark scans.
 * Two palettes for the same components:
 *   RECON  — 复原: fresh 782 CE polychrome (vermilion, green, white, new tile)
 *   TODAY  — 现状: 1200 years of weathering, paint all but gone (matches photos)
 */
const RECON_TINTS: Record<string, { c: string; k: number }> = {
  zhu: { c: "#bf4429", k: 1.55 },   // bright vermilion column/frame
  door: { c: "#a8331d", k: 1.5 },   // deep cinnabar door leaf
  lv: { c: "#2f7049", k: 1.45 },    // green lattice window
  sumu: { c: "#cda06a", k: 1.5 },   // warm fresh-cut timber
  bai: { c: "#f3eee2", k: 1.1 },    // clean lime-white plaster
  stone: { c: "#d2ccbd", k: 1.55 },
  huiwa: { c: "#6f7d8c", k: 1.15 }, // fresh blue-grey tile, deep not washed-out
};
const TODAY_TINTS: Record<string, { c: string; k: number }> = {
  zhu: { c: "#8a755b", k: 1.3 },    // vermilion weathered to silvered grey-brown
  door: { c: "#7d6248", k: 1.3 },
  lv: { c: "#82846f", k: 1.25 },    // green greyed almost to bare wood
  sumu: { c: "#94815f", k: 1.3 },   // bare rafters/purlins, deep aged brown
  bai: { c: "#d6cdbb", k: 1.05 },   // soiled, water-streaked plaster
  stone: { c: "#bcb5a5", k: 1.5 },
  huiwa: { c: "#5e646b", k: 1.1 },  // lichen-greyed aged tile, dark
};
const TINTS_FOR = (m: ViewMode) => (m === "today" ? TODAY_TINTS : RECON_TINTS);

/** Stable per-component tone offset so timber doesn't look injection-molded. */
function jitter(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h % 100) + 100) % 100 / 100 - 0.5) * 0.07;
}

type PbrSet = {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  arm: THREE.Texture; // R=AO, G=roughness, B=metalness
};

/** Load a Poly Haven (CC0) PBR set: albedo + GL normal + ARM. */
function usePbr(id: string, repeat: [number, number], rotate = false): PbrSet {
  const [diff, nor, arm] = useTexture([
    `/textures/${id}/${id}_diff_2k.jpg`,
    `/textures/${id}/${id}_nor_gl_2k.jpg`,
    `/textures/${id}/${id}_arm_2k.jpg`,
  ]);
  const [ru, rv] = repeat;
  return useMemo(() => {
    // clone so each set carries its own UV transform; the GPU image is shared
    const set = { map: diff.clone(), normalMap: nor.clone(), arm: arm.clone() };
    for (const t of Object.values(set)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      t.repeat.set(ru, rv);
      if (rotate) {
        t.center.set(0.5, 0.5);
        t.rotation = Math.PI / 2;
      }
      t.needsUpdate = true;
    }
    set.map.colorSpace = THREE.SRGBColorSpace;
    return set;
  }, [diff, nor, arm, ru, rv, rotate]);
}

/** Canonical camera stations (also used by the headless verifier renders). */
const CAMS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [16, 9, 19], target: [0, 3.2, 0] },
  front: { pos: [0, 5, 27], target: [0, 4.2, 0] },
  bracket: { pos: [5.2, 5.8, 9.8], target: [2.5, 5.0, 4.9] },
  eave: { pos: [10.5, 5.5, 11], target: [6.2, 5.2, 5.6] },
  altar: { pos: [4.7, 1.6, 4.5], target: [-0.3, 2.7, -1.0] },
  altarfront: { pos: [0, 3.9, 3.1], target: [0, 4.5, -1.2] },
  wsfront: { pos: [-2.9, 3.3, 5.0], target: [-2.9, 2.6, -0.2] },
};

type TexKit = {
  wood: PbrSet;   // grain along V — cylinders, lathes, vertical members
  woodR: PbrSet;  // rotated 90° — grain along U for horizontal box members
  roof: PbrSet;
  plaster: PbrSet;
  stone: PbrSet;
};

const TIMBER_MATS = new Set(["zhu", "sumu", "door", "lv"]);
const TIMBER_PHASES = new Set(["columns", "puzuo", "frame"]);

/** Photo-derived statue mesh: scaled so its height equals the measured chi value. */
function GltfMember({ c, mode }: { c: Component; mode: ViewMode }) {
  const provMode = mode === "prov";
  const { scene } = useGLTF(c.geometry.url!);
  const obj = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const h = Math.max(box.max.y - box.min.y, 1e-6);
    const s = (c.geometry.targetH ?? 100) / h;
    root.scale.setScalar(s);
    // drop to local origin: feet at y=0, centred in x/z
    root.position.set(
      -((box.min.x + box.max.x) / 2) * s,
      -box.min.y * s,
      -((box.min.z + box.max.z) / 2) * s,
    );
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.userData.componentId = c.id;
        if (provMode) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: PROV_COLORS[c.provenance],
            roughness: 1,
            side: THREE.DoubleSide,
          });
        } else {
          // single-image meshes are open/hollow at the back; render inner faces
          // so the shell never looks see-through (the back faces the rear wall anyway)
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            (m as THREE.Material).side = THREE.DoubleSide;
          }
        }
      }
    });
    return root;
  }, [scene, c, provMode]);
  const pos = c.position as [number, number, number];
  let faceDeg = c.geometry.faceDeg ?? 0;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    // ?wenshuface=NNN etc. — debug only, per-model facing probe
    const key = c.id.replace("-model", "") + "face";
    const ov = params.get(key);
    if (ov != null) faceDeg = Number(ov);
  }
  const yaw = (faceDeg * Math.PI) / 180;
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <primitive object={obj} />
    </group>
  );
}

type DoorRegistry = { E: THREE.Group | null; W: THREE.Group | null };

function Member({
  c,
  mode,
  tex,
  doorRefs,
  onEnter,
}: {
  c: Component;
  mode: ViewMode;
  tex: TexKit;
  doorRefs: React.MutableRefObject<DoorRegistry>;
  onEnter: () => void;
}) {
  const g = c.geometry;
  if (g.type === "gltf") return <GltfMember c={c} mode={mode} />;
  const provMode = mode === "prov";
  const rot = (c.rotation_deg ?? [0, 0, 0]).map((d) => (d * Math.PI) / 180) as [
    number, number, number,
  ];
  const pos = c.position as [number, number, number];
  const customGeo = useMemo(() => {
    if (g.type === "poly") return polyGeometry(g.pts!);
    if (g.type === "lathe")
      return new THREE.LatheGeometry(
        g.pts!.map((p) => new THREE.Vector2(p[0], p[1])),
        g.seg ?? 20,
      );
    if (g.type === "shape2d") {
      const s = new THREE.Shape();
      g.pts!.forEach(([px, py], i) => (i === 0 ? s.moveTo(px, py) : s.lineTo(px, py)));
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: g.d ?? 4, bevelEnabled: false });
      geo.translate(0, 0, -(g.d ?? 4) / 2);
      // ExtrudeGeometry UVs are in fen units — rescale so one texture tile ≈ 80 fen (1.3 m)
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 80, uv.getY(i) / 80);
      return geo;
    }
    return null;
  }, [g]);

  // texture pick (今貌 only): tiled surfaces (planes, ridge, owl-tails, gables) get
  // tile; all bare timber — including exposed rafters/purlins of the roof frame —
  // gets cracked old wood; walls get worn lime plaster; the platform gets stone.
  const isTile = c.id.startsWith("roof-") || c.material === "huiwa";
  const isRoofPlane = isTile;
  const isTimber =
    (c.material && TIMBER_MATS.has(c.material)) ||
    (!c.material && (TIMBER_PHASES.has(c.phase) || c.phase === "roof"));
  let set: PbrSet | null = null;
  let tintKey: string | null = null;
  if (!provMode) {
    if (isRoofPlane) {
      set = tex.roof;
      tintKey = "huiwa";
    } else if (isTimber) {
      set = g.type === "cylinder" || g.type === "lathe" ? tex.wood : tex.woodR;
      tintKey = c.material && RECON_TINTS[c.material] ? c.material : "sumu";
    } else if (c.material === "bai") {
      set = tex.plaster;
      tintKey = "bai";
    } else if (c.material === "stone" || c.phase === "platform") {
      set = tex.stone;
      tintKey = "stone";
    }
  }

  const color = useMemo(() => {
    if (provMode) return new THREE.Color(PROV_COLORS[c.provenance]);
    if (tintKey) {
      const { c: hex, k } = TINTS_FOR(mode)[tintKey];
      const col = new THREE.Color(hex).multiplyScalar(k);
      col.offsetHSL(0, 0, jitter(c.id));
      return col;
    }
    const base =
      (c.material && MATERIAL_COLORS[c.material]) || PHASE_COLORS[c.phase] || "#888";
    const col = new THREE.Color(base);
    col.offsetHSL(0, 0, jitter(c.id));
    return col;
  }, [provMode, mode, c.provenance, c.material, c.phase, c.id, tintKey]);

  const mat = (
    <meshStandardMaterial
      color={color}
      map={set?.map}
      normalMap={set?.normalMap}
      normalScale={set ? new THREE.Vector2(0.9, 0.9) : undefined}
      aoMap={set?.arm}
      roughnessMap={set?.arm}
      metalness={0}
      roughness={provMode ? 1 : 0.97}
      envMapIntensity={0.35}
      side={g.type === "poly" ? THREE.DoubleSide : THREE.FrontSide}
    />
  );

  // Front door leaves: hinge at the outer edge so they can swing open on click.
  if (c.id === "door-E" || c.id === "door-W") {
    const east = c.id === "door-E";
    const hingeX = (east ? 1 : -1) * 140; // outer jamb, fen
    return (
      <group
        ref={(grp) => {
          doorRefs.current[east ? "E" : "W"] = grp;
        }}
        position={[hingeX, pos[1], pos[2]]}
      >
        <mesh
          position={[pos[0] - hingeX, 0, 0]}
          castShadow
          receiveShadow
          userData={{ componentId: c.id }}
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <boxGeometry args={[g.w!, g.h!, g.d!]} />
          {mat}
        </mesh>
      </group>
    );
  }

  if (g.type === "lathe" || g.type === "shape2d") {
    return (
      <mesh
        position={pos}
        rotation={rot}
        scale={(g.scale ?? [1, 1, 1]) as [number, number, number]}
        geometry={customGeo!}
        castShadow
        receiveShadow
        userData={{ componentId: c.id }}
      >
        {mat}
      </mesh>
    );
  }

  if (g.type === "capsule") {
    return (
      <mesh position={pos} rotation={rot} castShadow receiveShadow userData={{ componentId: c.id }}>
        <capsuleGeometry args={[g.r!, g.h!, 6, 14]} />
        {mat}
      </mesh>
    );
  }

  if (g.type === "torus") {
    return (
      <mesh position={pos} rotation={rot} castShadow receiveShadow userData={{ componentId: c.id }}>
        <torusGeometry args={[g.r!, g.rt!, 12, 28]} />
        {mat}
      </mesh>
    );
  }

  if (g.type === "poly") {
    return (
      <mesh geometry={customGeo!} castShadow receiveShadow userData={{ componentId: c.id }}>
        {mat}
      </mesh>
    );
  }

  if (g.type === "sphere") {
    return (
      <mesh
        position={pos}
        rotation={rot}
        scale={(g.scale ?? [1, 1, 1]) as [number, number, number]}
        castShadow
        receiveShadow
        userData={{ componentId: c.id }}
      >
        <sphereGeometry args={[g.r!, 24, 18]} />
        {mat}
      </mesh>
    );
  }

  if (g.type === "cone") {
    return (
      <mesh position={pos} rotation={rot} castShadow receiveShadow userData={{ componentId: c.id }}>
        <cylinderGeometry args={[g.rTop ?? 0.01, g.r!, g.h!, 18]} />
        {mat}
      </mesh>
    );
  }

  if (g.type === "cylinder") {
    const taper = c.phase === "columns" ? 0.88 : 1;
    const axisRot: [number, number, number] =
      g.axis === "x" ? [0, 0, Math.PI / 2] : g.axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    return (
      <group position={pos} rotation={rot}>
        <mesh rotation={axisRot} castShadow receiveShadow userData={{ componentId: c.id }}>
          <cylinderGeometry args={[g.r! * taper, g.r!, g.h!, 14]} />
          {mat}
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow userData={{ componentId: c.id }}>
      <boxGeometry args={[g.w!, g.h!, g.d!]} />
      {mat}
    </mesh>
  );
}

function Scene({
  mode,
  doorRefs,
  onEnter,
  spec: specOverride,
  raycaster,
  mouse,
  onComponentClick,
}: {
  mode: ViewMode;
  doorRefs: React.MutableRefObject<DoorRegistry>;
  onEnter: () => void;
  spec?: typeof spec;
  raycaster: React.MutableRefObject<THREE.Raycaster>;
  mouse: React.MutableRefObject<THREE.Vector2>;
  onComponentClick: (componentId: string, screenPos: { x: number; y: number }) => void;
}) {
  const currentSpec = specOverride || spec;
  const components = useMemo(() => currentSpec.components as Component[], [currentSpec]);
  const tex: TexKit = {
    wood: usePbr("rough_wood", [1, 1]),
    woodR: usePbr("rough_wood", [1, 1], true),
    roof: usePbr("roof_tiles_14", [6, 3]),
    plaster: usePbr("worn_plaster_wall", [2, 1]),
    stone: usePbr("granite_tile", [4, 1]),
  };
  return (
    <>
      <ClickHandler raycaster={raycaster} mouse={mouse} onComponentClick={onComponentClick} />
      <group scale={FEN}>
        {components.map((c) => (
          <Member key={c.id} c={c} mode={mode} tex={tex} doorRefs={doorRefs} onEnter={onEnter} />
        ))}
      </group>
    </>
  );
}

/** Smoothly flies the camera + orbit target to the goal station and swings the
 *  front doors open/shut as `entered` toggles. */
function CameraRig({
  goal,
  entered,
  doorRefs,
  flyingRef,
}: {
  goal: { pos: [number, number, number]; target: [number, number, number] };
  entered: boolean;
  doorRefs: React.MutableRefObject<DoorRegistry>;
  flyingRef: React.MutableRefObject<boolean>;
}) {
  const { camera, controls } = useThree();
  const gp = useMemo(() => new THREE.Vector3(...goal.pos), [goal]);
  const gt = useMemo(() => new THREE.Vector3(...goal.target), [goal]);
  // The rig flies the camera to a NEW goal (Enter/Exit). Controls are NEVER
  // disabled — the moment the user touches the mouse, OrbitControls.onStart
  // flips flyingRef false and the rig yields instantly. So you can always grab
  // the view freely, even mid-flight.
  useEffect(() => {
    flyingRef.current = true;
  }, [goal, flyingRef]);
  useFrame(() => {
    // doors always seek their open/closed pose — cheap and idempotent
    for (const key of ["E", "W"] as const) {
      const d = doorRefs.current[key];
      if (d) {
        const open = entered ? (key === "E" ? -1.85 : 1.85) : 0; // swing inward
        d.rotation.y += (open - d.rotation.y) * 0.05;
      }
    }

    if (!flyingRef.current) return;
    const ctl = controls as unknown as { target: THREE.Vector3; update: () => void } | null;
    camera.position.lerp(gp, 0.06);
    if (ctl?.target) {
      ctl.target.lerp(gt, 0.06);
      ctl.update();
    }
    if (
      camera.position.distanceTo(gp) < 0.05 &&
      (!ctl?.target || ctl.target.distanceTo(gt) < 0.05)
    ) {
      flyingRef.current = false;
    }
  });
  return null;
}

const LEGEND: [string, string, string][] = [
  ["measured", "实测", "Measured"],
  ["reconstructed_design", "复原设计值", "Reconstructed design"],
  ["rule_derived", "法式推导", "Rule-derived (YZFS)"],
  ["conjecture", "推测", "Conjecture"],
];

const MODES: { key: ViewMode; zh: string; en: string }[] = [
  { key: "today", zh: "现状", en: "As it stands" },
  { key: "recon", zh: "复原", en: "Reconstructed" },
  { key: "prov", zh: "出处", en: "Provenance" },
];

const MODE_BLURB: Record<ViewMode, string> = {
  today: "今貌 — 历经一千二百年风化，彩绘剥尽，唯余素木灰瓦。",
  recon: "复原 — 唐建中三年（782）新建之貌：朱柱、绿棂、白壁、青瓦。",
  prov: "凡无出处者不得渲染 — nothing renders without a source.",
};

export default function Viewer() {
  const [mode, setMode] = useState<ViewMode>("today");
  const [firstPerson, setFirstPerson] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loadedSpec, setLoadedSpec] = useState<typeof spec>(spec);
  const [playbackMeta, setPlaybackMeta] = useState<any>(null);
  const [selectedComponent, setSelectedComponent] = useState<(Component & { annotation?: AnnotationData }) | null>(null);
  const [annotationPos, setAnnotationPos] = useState({ x: 0, y: 0 });
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Load playback state when index changes in playback mode
  useEffect(() => {
    if (!playbackMode) return;
    const abortController = new AbortController();
    const filename = `state-${String(playbackIndex).padStart(3, "0")}.json`;
    fetch(`/playback-states/${filename}`, { signal: abortController.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Validate fetched data structure
        if (!data.playback || !data.components || !Array.isArray(data.components)) {
          throw new Error("Invalid playback state structure: missing playback or components");
        }
        // Force state update to trigger re-renders
        setLoadedSpec(data);
        setPlaybackMeta(data.playback);
        console.log(`[Playback] Loaded state ${playbackIndex}: ${data.playback.description} (${data.components.length} components)`);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(`[Playback] Failed to load state-${String(playbackIndex).padStart(3, "0")}.json:`, err);
        }
      });
    return () => abortController.abort();
  }, [playbackIndex, playbackMode]);

  const prov = mode === "prov";
  const currentSpec = playbackMode ? loadedSpec : spec;
  const components = useMemo(() => currentSpec.components as Component[], [currentSpec]);
  const cam = useMemo(() => {
    const key = new URLSearchParams(window.location.search).get("cam") ?? "default";
    return CAMS[key] ?? CAMS.default;
  }, []);
  const doorRefs = useRef<DoorRegistry>({ E: null, W: null });
  const flyingRef = useRef(true);
  const [entered, setEntered] = useState(false);
  const goal = entered ? CAMS.altarfront : cam;

  const handleComponentClick = (componentId: string, screenPos: { x: number; y: number }) => {
    const comp = components.find((c) => c.id === componentId);
    if (comp && comp.annotation) {
      setSelectedComponent(comp as Component & { annotation: AnnotationData });
      setAnnotationPos(screenPos);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas camera={{ position: cam.pos, fov: 42 }} shadows>
        <color attach="background" args={["#141416"]} />
        <fog attach="fog" args={["#141416", 36, 95]} />
        <hemisphereLight args={["#56688a", "#3a3026", prov ? 0.3 : 0.3]} />
        <ambientLight intensity={prov ? 1.5 : 0.12} />
        <directionalLight
          position={[14, 24, 16]}
          intensity={prov ? 0.55 : 1.35}
          color={prov ? "#ffffff" : "#fff0dc"}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-12, 9, -16]} intensity={0.35} color="#9db4d8" />
        {/* interior fill so the altar group reads — off in provenance mode (flat) */}
        {!prov && (
          <pointLight position={[0, 4.6, 2.0]} intensity={42} color="#ffdcb0" distance={14} decay={2} />
        )}
        <Suspense fallback={null}>
          {/* image-based sky light: soft diffuse + believable reflections (lighting only, backdrop stays dark) */}
          {!prov && (
            <Environment files="/hdri/kloofendal_overcast_puresky_1k.hdr" environmentIntensity={1.0} />
          )}
          <Scene
            mode={mode}
            doorRefs={doorRefs}
            onEnter={() => setEntered(true)}
            spec={currentSpec}
            raycaster={raycasterRef}
            mouse={mouseRef}
            onComponentClick={handleComponentClick}
          />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.67, 0]} receiveShadow>
          <circleGeometry args={[60, 64]} />
          <meshStandardMaterial color="#191a1c" roughness={1} />
        </mesh>
        {!firstPerson && (
          <OrbitControls
            makeDefault
            onStart={() => {
              flyingRef.current = false; // any user input instantly cancels the fly-in
            }}
            maxPolarAngle={Math.PI / 2.02}
            minDistance={2.4}
            maxDistance={45}
          />
        )}
        {firstPerson && <FirstPersonController enabled={firstPerson} />}
        <CameraRig goal={goal} entered={entered} doorRefs={doorRefs} flyingRef={flyingRef} />
        <ClickHandler raycaster={raycasterRef} mouse={mouseRef} onComponentClick={handleComponentClick} />
      </Canvas>

      {/* enter / exit the hall + first-person toggle + playback mode */}
      <div style={{ position: "absolute", top: 24, right: 28, display: "flex", gap: 12, flexDirection: "column", alignItems: "flex-end" }}>
        <button
          onClick={() => setEntered((v) => !v)}
          style={{
            background: entered ? "transparent" : "var(--ink)",
            color: entered ? "var(--ink)" : "#141416",
            border: "1px solid var(--ink-dim)",
            padding: "9px 18px",
            fontSize: 14,
            fontFamily: "inherit",
            letterSpacing: 2,
            cursor: "pointer",
          }}
        >
          {entered ? "← 退出 Exit" : "入殿礼佛 Enter ⊙"}
        </button>
        <button
          onClick={() => setFirstPerson((v) => !v)}
          style={{
            background: firstPerson ? "var(--ink)" : "transparent",
            color: firstPerson ? "#141416" : "var(--ink)",
            border: "1px solid var(--ink-dim)",
            padding: "9px 18px",
            fontSize: 14,
            fontFamily: "inherit",
            letterSpacing: 2,
            cursor: "pointer",
          }}
        >
          {firstPerson ? "↔ 轨道视角 Orbit" : "⊕ 第一视角 FPS"}
        </button>
        <button
          onClick={() => {
            setPlaybackMode((v) => !v);
            setIsPlaying(false);
            setPlaybackIndex(0);
          }}
          style={{
            background: playbackMode ? "var(--ink)" : "transparent",
            color: playbackMode ? "#141416" : "var(--ink)",
            border: "1px solid var(--ink-dim)",
            padding: "9px 18px",
            fontSize: 14,
            fontFamily: "inherit",
            letterSpacing: 2,
            cursor: "pointer",
          }}
        >
          {playbackMode ? "🔴 回放中 Playback" : "⏺ 回放模式 Playback"}
        </button>
      </div>

      {/* header */}
      <div style={{ position: "absolute", top: 24, left: 28, pointerEvents: "none" }}>
        <div style={{ fontSize: 30, letterSpacing: 6 }}>南禅寺大殿</div>
        <div style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 4 }}>
          Nanchan Temple Main Hall · 唐建中三年 (782 CE) · derived from ZHANG2022 + 营造法式
        </div>
      </div>

      {/* mode switch: 现状 / 复原 / 出处 */}
      <div style={{ position: "absolute", bottom: 28, left: 28 }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--ink-dim)" }}>
          {MODES.map((m, i) => {
            const active = m.key === mode;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "#141416" : "var(--ink)",
                  border: "none",
                  borderLeft: i === 0 ? "none" : "1px solid var(--ink-dim)",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  letterSpacing: 2,
                  cursor: "pointer",
                }}
              >
                {m.zh}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-dim)", maxWidth: 320 }}>
          {MODE_BLURB[mode]}
        </div>
        {prov && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-dim)" }}>
            {LEGEND.map(([key, zh, en]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ width: 12, height: 12, background: PROV_COLORS[key], display: "inline-block" }} />
                <span>
                  {zh} {en} · {components.filter((c) => c.provenance === key).length}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playback controls */}
      {playbackMode && playbackMeta && (
        <PlaybackControls
          currentState={{
            index: playbackIndex,
            phase: playbackMeta.phase,
            description: playbackMeta.description,
            totalStates: playbackMeta.totalStates,
          }}
          onStateChange={setPlaybackIndex}
          isPlaying={isPlaying}
          onPlayPauseChange={setIsPlaying}
          speed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />
      )}

      {/* Annotation panel */}
      {selectedComponent && selectedComponent.annotation && (
        <AnnotationPanel
          title_zh={selectedComponent.annotation.title_zh}
          title_en={selectedComponent.annotation.title_en}
          desc_zh={selectedComponent.annotation.desc_zh}
          desc_en={selectedComponent.annotation.desc_en}
          reference_image={selectedComponent.annotation.reference_image}
          reference_label={selectedComponent.annotation.reference_label}
          position={annotationPos}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
}
