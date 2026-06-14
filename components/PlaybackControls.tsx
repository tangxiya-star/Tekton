// ND-32 — deterministic playback backbone (presentational control bar).
//
// Self-contained, default-exported control bar matching SpireViewer's dark
// panel aesthetic. State lives entirely in the parent; this component only
// renders and emits callbacks. No three, no spec, no external deps.

import React from "react";

const SPEEDS = [0.25, 0.5, 1, 2, 4];

export default function PlaybackControls({
  total,
  step,
  playing,
  speed,
  phase,
  onStep,
  onPlayToggle,
  onSpeed,
  onReset,
}: {
  total: number;
  step: number;
  playing: boolean;
  speed: number;
  phase: string;
  onStep: (s: number) => void;
  onPlayToggle: () => void;
  onSpeed: (x: number) => void;
  onReset: () => void;
}) {
  const atEnd = step >= total;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx === -1 ? 0 : idx + 1) % SPEEDS.length];
    onSpeed(next);
  };

  const fmtSpeed = (x: number) => (Number.isInteger(x) ? `${x}×` : `${x}×`);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#1c1d20cc",
        border: "1px solid #3a3833",
        padding: "10px 16px",
        backdropFilter: "blur(4px)",
        color: "#e8e2d4",
        fontFamily: "var(--font, system-ui)",
        fontSize: 12,
        letterSpacing: 0.4,
        userSelect: "none",
      }}
    >
      {/* play / pause */}
      <button
        onClick={onPlayToggle}
        title={playing ? "Pause" : atEnd ? "Replay" : "Play"}
        style={{
          background: "#e8e2d4",
          color: "#141416",
          border: "none",
          padding: "5px 14px",
          fontSize: 12,
          cursor: "pointer",
          minWidth: 78,
        }}
      >
        {playing ? "❚❚ Pause" : atEnd ? "↻ Replay" : "▶ Play"}
      </button>

      {/* reset */}
      <button
        onClick={onReset}
        title="Reset to start"
        style={{
          background: "transparent",
          color: "#e8e2d4",
          border: "1px solid #4a4640",
          padding: "5px 12px",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        ↺ Reset
      </button>

      {/* speed selector (cycles through the fixed ladder) */}
      <button
        onClick={cycleSpeed}
        title="Playback speed (click to cycle)"
        style={{
          background: "transparent",
          color: "#d9a843",
          border: "1px solid #4a4640",
          padding: "5px 10px",
          fontSize: 12,
          cursor: "pointer",
          minWidth: 48,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {fmtSpeed(speed)}
      </button>

      {/* scrubber */}
      <input
        type="range"
        min={0}
        max={total}
        step={1}
        value={Math.min(step, total)}
        onChange={(e) => onStep(Number(e.target.value))}
        aria-label="Build step"
        style={{ flex: 1, minWidth: 120, accentColor: "#d9a843" }}
      />

      {/* phase + step/total readout */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          minWidth: 96,
          lineHeight: 1.35,
        }}
      >
        <span
          style={{
            color: "#cfc8b8",
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: 11,
          }}
        >
          {phase || "—"}
        </span>
        <span style={{ color: "#8c867a", fontVariantNumeric: "tabular-nums" }}>
          {Math.min(step, total)}/{total}
        </span>
      </div>
    </div>
  );
}
