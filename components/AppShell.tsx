"use client";

/**
 * AppShell (INT-03) — a fixed, top-center segmented toggle that lets a visitor
 * switch between the recreations:
 *
 *   南禅寺 Nanchan | Notre-Dame Spire | Notre-Dame Towers | Notre-Dame Cathedral
 *
 * It is purely presentational: the active building lives in the parent
 * (BuildingRouter) as React state, and selecting a segment both (a) updates the
 * `?building=` query param (so the choice is shareable / reloadable) and
 * (b) calls back so the parent remounts the chosen viewer reactively — no full
 * page reload. Default = notre-dame (the focused spire); "nanchan" = Holly's
 * Nanchan viewer; "notre-dame-towers" = the west-façade tier;
 * "notre-dame-whole" = the WHOLE cathedral massing + spire (a separate tab).
 */

export type Building =
  | "nanchan"
  | "notre-dame"
  | "notre-dame-towers"
  | "notre-dame-whole";

const SEGMENTS: { key: Building; zh: string; en: string }[] = [
  { key: "nanchan", zh: "南禅寺", en: "Nanchan" },
  { key: "notre-dame", zh: "巴黎圣母院 · 尖塔", en: "Spire" },
  { key: "notre-dame-towers", zh: "巴黎圣母院 · 西立面", en: "Towers" },
  { key: "notre-dame-whole", zh: "巴黎圣母院 · 全貌", en: "Cathedral" },
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
              padding: "8px 18px",
              fontSize: 13,
              letterSpacing: 1.2,
              lineHeight: 1.2,
              background: active ? "#e8e2d4" : "transparent",
              color: active ? "#141416" : "#e8e2d4",
              transition: "background 140ms ease, color 140ms ease",
              whiteSpace: "nowrap",
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
