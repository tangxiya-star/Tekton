"use client";

/**
 * Routes the scene by ?building, with a visible selector toggle so a visitor can
 * switch recreations without editing the URL. Each building remounts on switch.
 *   notre-dame (default) → SpireViewer (the flèche, full fidelity)
 *   notre-dame-towers     → TowersViewer (west towers + facade, v2 tier)
 *   nanchan               → Viewer (Holly's Nanchan — the regression anchor)
 */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import BrandMark from "./BrandMark";

const SpireViewer = dynamic(() => import("./SpireViewer"), { ssr: false });
const TowersViewer = dynamic(() => import("./TowersViewer"), { ssr: false });
const CathedralViewer = dynamic(() => import("./CathedralViewer"), { ssr: false });
const NanchanViewer = dynamic(() => import("./Viewer"), { ssr: false });

const BUILDINGS: { key: string; label: string }[] = [
  { key: "notre-dame", label: "Notre-Dame · Spire" },
  { key: "notre-dame-towers", label: "Notre-Dame · Towers" },
  { key: "notre-dame-whole", label: "Notre-Dame · Cathedral" },
  { key: "nanchan", label: "Nanchan Temple" },
];

export default function BuildingRouter() {
  const [building, setBuilding] = useState("notre-dame");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("building");
    if (fromUrl) setBuilding(fromUrl === "towers" ? "notre-dame-towers" : fromUrl);
    const onPop = () => {
      const b = new URLSearchParams(window.location.search).get("building") ?? "notre-dame";
      setBuilding(b === "towers" ? "notre-dame-towers" : b);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const pick = (key: string) => {
    setBuilding(key);
    const url = new URL(window.location.href);
    // preserve ?cam= for automated capture; just swap building
    url.searchParams.set("building", key);
    window.history.pushState({}, "", url);
  };

  const Active = building === "nanchan" ? NanchanViewer : building === "notre-dame-towers" ? TowersViewer : building === "notre-dame-whole" ? CathedralViewer : SpireViewer;

  return (
    <>
      <BrandMark />
      <div
        style={{
          position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          display: "inline-flex", border: "1px solid #4a4640", background: "#1c1d20cc",
          backdropFilter: "blur(6px)", fontFamily: "system-ui, sans-serif", fontSize: 12.5, letterSpacing: 1,
        }}
      >
        {BUILDINGS.map((b, i) => {
          const active = b.key === building || (b.key === "notre-dame-towers" && building === "towers");
          return (
            <button
              key={b.key}
              onClick={() => pick(b.key)}
              style={{
                background: active ? "#e8e2d4" : "transparent",
                color: active ? "#141416" : "#cfc8b8",
                border: "none", borderLeft: i ? "1px solid #4a4640" : "none",
                padding: "8px 18px", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
              }}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <Active key={building} />
    </>
  );
}
