"use client";

/**
 * Routes the scene by ?building (ND-14). Default = the Notre-Dame spire (the v1
 * product). building=nanchan loads the original Nanchan viewer (the regression
 * anchor); building=notre-dame-towers loads the west-façade tier;
 * building=notre-dame-whole loads the WHOLE cathedral (massing + spire) — each
 * loads, none breaks the others.
 *
 * INT-03: the active building lives in React state so the AppShell toggle can
 * swap viewers reactively (no full reload). The choice is mirrored into the
 * ?building= query param so it stays shareable / reloadable, and the chosen
 * viewer is keyed so switching fully remounts it (clean three.js teardown).
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import AppShell, { Building } from "./AppShell";

const SpireViewer = dynamic(() => import("./SpireViewer"), { ssr: false });
const TowersViewer = dynamic(() => import("./TowersViewer"), { ssr: false });
const CathedralViewer = dynamic(() => import("./CathedralViewer"), { ssr: false });
const NanchanViewer = dynamic(() => import("./Viewer"), { ssr: false });

const VALID: Building[] = ["nanchan", "notre-dame", "notre-dame-towers", "notre-dame-whole"];

function readBuilding(): Building {
  if (typeof window === "undefined") return "notre-dame";
  const b = new URLSearchParams(window.location.search).get("building");
  return (VALID as string[]).includes(b ?? "") ? (b as Building) : "notre-dame";
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
    if (next === "notre-dame") url.searchParams.delete("building"); // notre-dame is the default
    else url.searchParams.set("building", next);
    window.history.pushState({}, "", url);
  }, []);

  return (
    <>
      <AppShell building={building} onChange={handleChange} />
      {building === "nanchan" ? (
        <NanchanViewer key="nanchan" />
      ) : building === "notre-dame-towers" ? (
        <TowersViewer key="notre-dame-towers" />
      ) : building === "notre-dame-whole" ? (
        <CathedralViewer key="notre-dame-whole" />
      ) : (
        <SpireViewer key="notre-dame" />
      )}
    </>
  );
}
