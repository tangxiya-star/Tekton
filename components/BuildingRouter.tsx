"use client";

/**
 * Routes the scene by ?building (ND-14). Default = the Notre-Dame spire (the v1
 * product). building=nanchan loads the original Nanchan viewer (the regression
 * anchor) — both load, neither breaks the other.
 *
 * INT-03: the active building now lives in React state so the AppShell toggle
 * can swap viewers reactively (no full reload). The choice is mirrored into the
 * ?building= query param so it stays shareable / reloadable, and the chosen
 * viewer is keyed so switching fully remounts it (clean three.js teardown).
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import AppShell, { Building } from "./AppShell";

const SpireViewer = dynamic(() => import("./SpireViewer"), { ssr: false });
const NanchanViewer = dynamic(() => import("./Viewer"), { ssr: false });

function readBuilding(): Building {
  if (typeof window === "undefined") return "notre-dame";
  return new URLSearchParams(window.location.search).get("building") === "nanchan"
    ? "nanchan"
    : "notre-dame";
}

export default function BuildingRouter() {
  const [building, setBuilding] = useState<Building>("notre-dame");

  // hydrate from the URL on mount (ssr:false, so window is available)
  useEffect(() => {
    setBuilding(readBuilding());
  }, []);

  // keep state in sync with browser back/forward
  useEffect(() => {
    const onPop = () => setBuilding(readBuilding());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleChange = useCallback((next: Building) => {
    setBuilding(next);
    const url = new URL(window.location.href);
    if (next === "nanchan") url.searchParams.set("building", "nanchan");
    else url.searchParams.delete("building"); // notre-dame is the default
    window.history.pushState({}, "", url);
  }, []);

  return (
    <>
      <AppShell building={building} onChange={handleChange} />
      {building === "nanchan" ? (
        <NanchanViewer key="nanchan" />
      ) : (
        <SpireViewer key="notre-dame" />
      )}
    </>
  );
}
