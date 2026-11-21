import type { Metadata } from "next";
import { ArenaScene } from "@/components/arena-scene";

export const metadata: Metadata = { title: "Counter-Strike 2" };

export default function CounterStrike() {
  return <ArenaScene game="fighter" />;
}
