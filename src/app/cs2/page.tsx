import type { Metadata } from "next";
import { ArenaScene } from "@/components/arena-scene";
import { Tournaments } from "@/components/tournaments";
import { mode } from "@/lib/server";
import { demoTournaments } from "@/lib/tournaments";

export const metadata: Metadata = { title: "Counter-Strike 2" };

export default function CounterStrike() {
  return <>
    <ArenaScene game="fighter" />
    <Tournaments initial={mode === "demo" ? demoTournaments() : []} initialFilter="cs2" view="preview" />
  </>;
}
