"use client";

import dynamic from "next/dynamic";

const BuildingRouter = dynamic(() => import("../components/BuildingRouter"), { ssr: false });

export default function Home() {
  return <BuildingRouter />;
}
