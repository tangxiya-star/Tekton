"use client";

/**
 * Tekton brand mark — fixed top-right, shown on every building (mounted in
 * BuildingRouter). The logomark is the *ad quadratum* motif (a module square +
 * its 45° inscribed square) — the generative geometry the engine actually uses
 * to derive Gothic pinnacles and the cai-fen module. The wordmark keeps 营造
 * (from the original name, Yingzao) after "Tekton".
 */
export default function BrandMark() {
  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 24,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
        userSelect: "none",
        textShadow: "0 1px 10px #000",
      }}
      aria-label="Tekton 营造"
    >
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* ad quadratum: the module square + its 45° inscribed square */}
        <rect x="5.5" y="5.5" width="21" height="21" stroke="#d9a843" strokeWidth="1.5" />
        <path d="M16 5.5 L26.5 16 L16 26.5 L5.5 16 Z" stroke="#d9a843" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" fill="#d9a843" />
      </svg>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{ fontSize: 17, letterSpacing: 3, color: "#ece7dc", fontWeight: 600 }}>TEKTON</span>
        <span style={{ fontSize: 16, letterSpacing: 2, color: "#d9a843" }}>营造</span>
      </div>
    </div>
  );
}
