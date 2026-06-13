"use client";

/**
 * AppShell (INT-03) — a fixed, top-center segmented toggle that lets a visitor
 * switch between the two recreations:
 *
 *   南禅寺 Nanchan   |   Notre-Dame
 *
 * It is purely presentational: the active building lives in the parent
 * (BuildingRouter) as React state, and selecting a segment both (a) updates the
 * `?building=` query param (so the choice is shareable / reloadable) and
 * (b) calls back so the parent remounts the chosen viewer reactively — no full
 * page reload. Default = notre-dame; "nanchan" = Holly's Nanchan viewer.
 */

export type Building = "nanchan" | "notre-dame";

const SEGMENTS: { key: Building; zh: string; en: string }[] = [
  { key: "nanchan", zh: "南禅寺", en: "Nanchan" },
  { key: "notre-dame", zh: "巴黎圣母院", en: "Notre-Dame" },
];

export default function AppShell({
  building,
  onChange,
}: {
  building: Building;
  onChange: (b: Building) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        gap: 0,
        background: "rgba(20, 20, 22, 0.82)",
        border: "1px solid #4a4640",
        borderRadius: 999,
        padding: 4,
        backdropFilter: "blur(6px)",
        boxShadow: "0 2px 18px rgba(0,0,0,0.45)",
        fontFamily: "var(--font, system-ui)",
        userSelect: "none",
      }}
    >
      {SEGMENTS.map((s) => {
        const active = s.key === building;
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (!active) onChange(s.key);
            }}
            style={{
              border: "none",
              borderRadius: 999,
              cursor: active ? "default" : "pointer",
              padding: "8px 20px",
              fontSize: 13,
              letterSpacing: 1.5,
              lineHeight: 1.2,
              background: active ? "#e8e2d4" : "transparent",
              color: active ? "#141416" : "#e8e2d4",
              transition: "background 140ms ease, color 140ms ease",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{s.zh}</span>
            <span style={{ fontSize: 11, opacity: 0.72, marginLeft: 7 }}>{s.en}</span>
          </button>
        );
      })}
    </div>
  );
}
