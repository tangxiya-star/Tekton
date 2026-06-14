"use client";

/**
 * DrawingReveal — ND-11: drawing → 3D interactive reveal.
 *
 * A full-screen overlay that opens on a PROCEDURAL line-drawing of Viollet-le-Duc's
 * elevation of the flèche (an ink/sepia silhouette on parchment), then on scroll-down
 * OR a "Reveal in 3D" button lifts and fades away — exposing the live 3D scene behind
 * it — calling onReveal() exactly once.
 *
 * RIGHTS NOTE: we deliberately do NOT fetch or embed the BnF raster of the original
 * engraving. The drawing here is an entirely procedural inline SVG re-drawing of the
 * elevation — the caption credits VLD / BnF / domaine public for the *referenced* plate,
 * not the pixels (which are ours). The strokes draw themselves on mount via
 * stroke-dasharray animation.
 *
 * Self-contained: React + inline styles/SVG only. No external deps.
 *
 *   export default function DrawingReveal({ onReveal }: { onReveal: () => void })
 */

import { useEffect, useRef, useState } from "react";

// ── palette ─────────────────────────────────────────────────────────────────
const PARCHMENT = "#ece3cf";
const PARCHMENT_EDGE = "#ddd0b3";
const INK = "#3a2f22"; // dark sepia ink for the principal line
const INK_DIM = "#7c6b52"; // lighter sepia for section / dimension lines
const INK_FAINT = "#9c8a6e";

// SVG geometry is authored in a 360 × 760 viewBox. The flèche reads vertically:
// a wide souche base tapering up a slender fût through two galleries to a fine
// aiguille capped by the coq. cx is the centre axis.
const VB_W = 360;
const VB_H = 760;
const CX = 158; // axis pushed left of centre to leave room for the 96 m rule

export default function DrawingReveal({ onReveal }: { onReveal: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const [drawn, setDrawn] = useState(false); // strokes finished drawing-on
  const firedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Kick off the stroke draw-on shortly after mount so the dash transition runs.
  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Single-fire reveal: fade/lift the overlay, drop pointer events, call onReveal once.
  const lift = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setRevealing(true);
    onReveal();
  };

  // Scroll-down (wheel) lifts the drawing. Bound on the overlay itself.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (firedRef.current) return;
      if (e.deltaY > 0) lift();
    };
    const onKey = (e: KeyboardEvent) => {
      if (firedRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Enter") {
        lift();
      }
    };
    const node = rootRef.current;
    node?.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      node?.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to give each stroke a draw-on transition. The dash length is generous
  // so any path of reasonable length animates fully; staggered by `delay`.
  const drawStyle = (delay: number, dash = 1400): React.CSSProperties => ({
    strokeDasharray: dash,
    strokeDashoffset: drawn ? 0 : dash,
    transition: `stroke-dashoffset 1100ms cubic-bezier(.6,.02,.2,1) ${delay}ms`,
  });
  // Labels & fills fade in after the line work has begun.
  const fadeStyle = (delay: number): React.CSSProperties => ({
    opacity: drawn ? 1 : 0,
    transition: `opacity 700ms ease ${delay}ms`,
  });

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label="Élévation de la flèche — Viollet-le-Duc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // a soft parchment-lit field over the dark #141416 scene
        background:
          "radial-gradient(120% 90% at 50% 38%, rgba(236,227,207,0.10), rgba(20,20,22,0) 60%), #141416",
        color: "#e8e2d4",
        fontFamily: "var(--font, system-ui)",
        opacity: revealing ? 0 : 1,
        transform: revealing ? "translateY(-26px) scale(1.012)" : "translateY(0) scale(1)",
        transition: "opacity 900ms ease, transform 900ms cubic-bezier(.6,.02,.2,1)",
        pointerEvents: revealing ? "none" : "auto",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onClick={lift}
    >
      {/* The parchment leaf holding the elevation */}
      <div
        style={{
          position: "relative",
          background: `linear-gradient(155deg, ${PARCHMENT} 0%, ${PARCHMENT_EDGE} 100%)`,
          borderRadius: 2,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.25) inset, 0 40px 120px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.4)",
          padding: "22px 30px 14px",
          maxHeight: "80vh",
          // subtle aged-paper speckle
          backgroundBlendMode: "multiply",
        }}
      >
        {/* faint plate border, hand-ruled */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          style={{
            display: "block",
            height: "min(72vh, 720px)",
            width: "auto",
            overflow: "visible",
          }}
        >
          {/* plate frame */}
          <rect
            x={6}
            y={6}
            width={VB_W - 12}
            height={VB_H - 12}
            fill="none"
            stroke={INK_FAINT}
            strokeWidth={1}
            style={drawStyle(0, 2600)}
          />

          {/* ── the flèche silhouette (left + right profile, mirrored) ───────── */}
          {/* Authored as two mirrored tapering profiles from souche → needle.   */}
          {(() => {
            // Profile half-widths (from axis) at successive heights, top→bottom.
            // y grows downward in SVG; the tip is high (small y), base low (large y).
            const TIP_Y = 70; // coq sits just above
            const BASE_Y = 690; // top of the souche masonry
            // key stations along the shaft (y, halfWidth)
            const stations: [number, number][] = [
              [TIP_Y, 2], // needle point
              [120, 6], // aiguille
              [220, 14], // upper fût
              [300, 20], // gallery 2 line
              [400, 30], // mid fût
              [500, 42], // gallery 1 line
              [600, 58], // lower fût flare
              [BASE_Y, 78], // souche top
            ];
            const right = stations.map(([y, w]) => `${CX + w},${y}`);
            const left = [...stations].reverse().map(([y, w]) => `${CX - w},${y}`);
            const dShaft = `M ${left.join(" L ")} L ${right.join(" L ")} Z`;

            return (
              <>
                {/* light interior wash on the shaft */}
                <path
                  d={dShaft}
                  fill="rgba(124,107,82,0.07)"
                  stroke="none"
                  style={fadeStyle(500)}
                />
                {/* the principal contour — drawn on */}
                <path
                  d={dShaft}
                  fill="none"
                  stroke={INK}
                  strokeWidth={1.7}
                  strokeLinejoin="round"
                  style={drawStyle(150, 2400)}
                />
                {/* central axis ledger line */}
                <line
                  x1={CX}
                  y1={TIP_Y - 28}
                  x2={CX}
                  y2={BASE_Y + 60}
                  stroke={INK_FAINT}
                  strokeWidth={0.6}
                  strokeDasharray="2 5"
                  style={fadeStyle(900)}
                />
              </>
            );
          })()}

          {/* ── horizontal section / ledge lines: souche, fût, two galleries ── */}
          {[
            { y: 690, half: 86, label: "souche", strong: true },
            { y: 600, half: 64 },
            { y: 500, half: 50, label: "galerie I" },
            { y: 300, half: 26, label: "galerie II" },
          ].map((s, i) => (
            <g key={i}>
              <line
                x1={CX - s.half}
                y1={s.y}
                x2={CX + s.half}
                y2={s.y}
                stroke={INK_DIM}
                strokeWidth={s.strong ? 1.2 : 0.8}
                style={drawStyle(300 + i * 120, 360)}
              />
              {/* small repeated dentils above a gallery to suggest the balustrade */}
              {s.label && s.label.startsWith("galerie") &&
                Array.from({ length: 9 }).map((_, k) => {
                  const x = CX - s.half + (k * (s.half * 2)) / 8;
                  return (
                    <line
                      key={k}
                      x1={x}
                      y1={s.y}
                      x2={x}
                      y2={s.y - 6}
                      stroke={INK_DIM}
                      strokeWidth={0.6}
                      style={fadeStyle(900 + i * 60)}
                    />
                  );
                })}
            </g>
          ))}

          {/* ── souche masonry: the square stone base below the octagon ──────── */}
          <g style={fadeStyle(700)}>
            <line x1={CX - 86} y1={690} x2={CX - 86} y2={748} stroke={INK} strokeWidth={1.4} />
            <line x1={CX + 86} y1={690} x2={CX + 86} y2={748} stroke={INK} strokeWidth={1.4} />
            {/* coursing */}
            {[706, 722, 738].map((y) => (
              <line key={y} x1={CX - 86} y1={y} x2={CX + 86} y2={y} stroke={INK_DIM} strokeWidth={0.6} />
            ))}
          </g>

          {/* ── statue ticks at the base of the flèche (the 16 apostles/evangelists) ─ */}
          <g style={fadeStyle(1050)}>
            {Array.from({ length: 8 }).map((_, k) => {
              // four to a side, stepping down the souche corners
              const side = k < 4 ? -1 : 1;
              const idx = k % 4;
              const x = CX + side * (60 + idx * 7);
              const y = 660 - idx * 13;
              return (
                <g key={k}>
                  <line x1={x} y1={y} x2={x} y2={y - 16} stroke={INK} strokeWidth={1.1} />
                  <circle cx={x} cy={y - 19} r={2.1} fill="none" stroke={INK} strokeWidth={1} />
                </g>
              );
            })}
          </g>

          {/* ── crockets / barbs climbing the needle ─────────────────────────── */}
          <g style={fadeStyle(950)}>
            {[150, 185, 220, 260].map((y, k) => {
              const w = 7 + k * 3;
              return (
                <g key={y}>
                  <path d={`M ${CX - 3} ${y} q -${w} -3 -${w} -9`} fill="none" stroke={INK_DIM} strokeWidth={0.9} />
                  <path d={`M ${CX + 3} ${y} q ${w} -3 ${w} -9`} fill="none" stroke={INK_DIM} strokeWidth={0.9} />
                </g>
              );
            })}
          </g>

          {/* ── coq (the rooster) at the very tip ────────────────────────────── */}
          <g style={fadeStyle(1200)}>
            {/* finial stem + orb */}
            <line x1={CX} y1={70} x2={CX} y2={48} stroke={INK} strokeWidth={1.2} />
            <circle cx={CX} cy={44} r={3} fill="none" stroke={INK} strokeWidth={1.1} />
            {/* stylised cockerel */}
            <path
              d={`M ${CX} 40
                  c 5 -3 11 -3 13 -9
                  c -3 1 -6 1 -8 -1
                  c 5 -2 7 -6 6 -11
                  c -3 4 -7 5 -11 4
                  c 2 -3 1 -7 -3 -8
                  c 1 4 -2 7 -6 8
                  c -4 1 -6 4 -5 8
                  c 1 4 6 7 14 9 Z`}
              fill="rgba(58,47,34,0.10)"
              stroke={INK}
              strokeWidth={1.1}
              strokeLinejoin="round"
            />
            {/* tail feathers */}
            <path d={`M ${CX - 6} 30 q -10 -6 -14 -16`} fill="none" stroke={INK} strokeWidth={1} />
            <path d={`M ${CX - 5} 33 q -12 -3 -18 -11`} fill="none" stroke={INK} strokeWidth={0.8} />
          </g>

          {/* ── section labels (hand-drawn italic), set against the right flank ─ */}
          {[
            { y: 50, t: "coq" },
            { y: 175, t: "aiguille" },
            { y: 360, t: "galeries" },
            { y: 555, t: "fût" },
            { y: 700, t: "souche" },
          ].map((l, i) => (
            <g key={l.t} style={fadeStyle(1100 + i * 70)}>
              {/* leader from label to the axis */}
              <line
                x1={CX + 92}
                y1={l.y}
                x2={CX + (l.t === "coq" ? 12 : l.t === "aiguille" ? 9 : 70)}
                y2={l.y}
                stroke={INK_FAINT}
                strokeWidth={0.6}
              />
              <text
                x={CX + 96}
                y={l.y + 4}
                fill={INK}
                fontSize={15}
                fontStyle="italic"
                fontFamily="Georgia, 'Times New Roman', serif"
                letterSpacing={0.4}
              >
                {l.t}
              </text>
            </g>
          ))}

          {/* ── 96 m measured dimension line down the far left side ──────────── */}
          <g style={fadeStyle(1250)}>
            {(() => {
              const dx = 36; // x of the dimension rule
              const top = 70;
              const bot = 748;
              const cap = 7;
              return (
                <>
                  <line x1={dx} y1={top} x2={dx} y2={bot} stroke={INK_DIM} strokeWidth={0.9} />
                  {/* arrow caps */}
                  <path d={`M ${dx} ${top} l -3 8 l 6 0 Z`} fill={INK_DIM} />
                  <path d={`M ${dx} ${bot} l -3 -8 l 6 0 Z`} fill={INK_DIM} />
                  {/* extension witness lines to the structure */}
                  <line x1={dx} y1={top} x2={CX - 2} y2={top} stroke={INK_FAINT} strokeWidth={0.5} strokeDasharray="2 4" />
                  <line x1={dx} y1={bot} x2={CX - 86} y2={bot} stroke={INK_FAINT} strokeWidth={0.5} strokeDasharray="2 4" />
                  {/* the number, rotated up the rule */}
                  <text
                    x={dx - 8}
                    y={(top + bot) / 2}
                    fill={INK}
                    fontSize={16}
                    fontFamily="Georgia, 'Times New Roman', serif"
                    textAnchor="middle"
                    transform={`rotate(-90 ${dx - 8} ${(top + bot) / 2})`}
                  >
                    96 m
                  </text>
                </>
              );
            })()}
          </g>

          {/* ── 30 m at the base (height of the masonry crossing / base level) ─ */}
          <g style={fadeStyle(1320)}>
            {(() => {
              const dx = 72;
              const top = 640;
              const bot = 748;
              return (
                <>
                  <line x1={dx} y1={top} x2={dx} y2={bot} stroke={INK_DIM} strokeWidth={0.8} />
                  <path d={`M ${dx} ${top} l -2.5 7 l 5 0 Z`} fill={INK_DIM} />
                  <path d={`M ${dx} ${bot} l -2.5 -7 l 5 0 Z`} fill={INK_DIM} />
                  <line x1={dx} y1={bot} x2={CX - 86} y2={bot} stroke={INK_FAINT} strokeWidth={0.5} strokeDasharray="2 4" />
                  <text
                    x={dx - 7}
                    y={(top + bot) / 2}
                    fill={INK}
                    fontSize={13}
                    fontFamily="Georgia, 'Times New Roman', serif"
                    textAnchor="middle"
                    transform={`rotate(-90 ${dx - 7} ${(top + bot) / 2})`}
                  >
                    30 m
                  </text>
                </>
              );
            })()}
          </g>

          {/* plate title, engraver's hand */}
          <text
            x={CX + 30}
            y={26}
            fill={INK_DIM}
            fontSize={12}
            fontStyle="italic"
            fontFamily="Georgia, 'Times New Roman', serif"
            textAnchor="middle"
            style={fadeStyle(1300)}
          >
            Élévation de la flèche
          </text>
        </svg>
      </div>

      {/* caption (provenance credit for the referenced plate) */}
      <div
        style={{
          marginTop: 16,
          maxWidth: 560,
          textAlign: "center",
          fontSize: 11.5,
          lineHeight: 1.5,
          color: "#b9b2a2",
          letterSpacing: 0.2,
          padding: "0 18px",
          ...fadeStyle(1400),
        }}
      >
        Élévation de la flèche — Eugène Viollet-le-Duc, <i>Dictionnaire raisonné de
        l’architecture française</i>, t.5 «&nbsp;Flèche&nbsp;» · BnF · domaine public
      </div>

      {/* reveal control + scroll hint, pinned to the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          ...fadeStyle(1500),
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            lift();
          }}
          style={{
            background: "#e8e2d4",
            color: "#141416",
            border: "none",
            padding: "10px 22px",
            fontSize: 13,
            letterSpacing: 1.5,
            fontFamily: "var(--font, system-ui)",
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
          }}
        >
          Reveal in 3D ↓
        </button>
        <div
          style={{
            fontSize: 11,
            color: "#8b8475",
            letterSpacing: 1,
            animation: "dreveal-pulse 2.4s ease-in-out infinite",
          }}
        >
          ↓ scroll / click to lift the drawing into three dimensions
        </div>
      </div>

      <style>{`
        @keyframes dreveal-pulse {
          0%, 100% { opacity: 0.55; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(2px); }
        }
      `}</style>
    </div>
  );
}
