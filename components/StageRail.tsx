"use client";

/**
 * Pipeline stage rail (ND-26) — the eight phases of `npm run goal` advancing in
 * sync with the build. Presentational; the parent passes the active phase. The
 * verify tick reads the live verifier report so the gate state is honest.
 */
import report from "../artifacts/verifier-report.notre-dame.json";

const PHASES = [
  ["research", "Research"],
  ["ingest", "Ingest"],
  ["derive", "Derive"],
  ["build", "Build"],
  ["verify", "Verify"],
  ["loop", "Loop"],
  ["record", "Record"],
  ["ship", "Ship"],
];

export default function StageRail({ active = "verify" }: { active?: string }) {
  const summary = (report as any).summary ?? { pass: 0, total: 0, fail: 0 };
  const activeIdx = Math.max(0, PHASES.findIndex(([k]) => k === active));
  return (
    <div
      style={{
        position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 0, background: "#1c1d20cc",
        border: "1px solid #3a3833", padding: "6px 10px", backdropFilter: "blur(4px)",
        fontSize: 11, letterSpacing: 0.5,
      }}
    >
      {PHASES.map(([key, label], i) => {
        const done = i < activeIdx;
        const isActive = i === activeIdx;
        const color = done ? "#7bbf7b" : isActive ? "#d9a843" : "#6b665d";
        return (
          <span key={key} style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color, display: "flex", alignItems: "center", gap: 5, padding: "0 8px" }}>
              <span style={{ width: 7, height: 7, borderRadius: 7, background: color, display: "inline-block", boxShadow: isActive ? "0 0 6px #d9a843" : "none" }} />
              {label}
              {key === "verify" && (
                <span style={{ color: summary.fail ? "#b34a38" : "#7bbf7b", marginLeft: 3 }}>
                  {summary.pass}/{summary.total}
                </span>
              )}
            </span>
            {i < PHASES.length - 1 && <span style={{ color: "#3a3833" }}>→</span>}
          </span>
        );
      })}
    </div>
  );
}
