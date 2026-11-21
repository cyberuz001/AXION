import type { Metadata } from "next";
import { Tournaments } from "@/components/tournaments";
import { mode } from "@/lib/server";
import { demoTournaments } from "@/lib/tournaments";

export const metadata: Metadata = { title: "Boshqaruv" };

export default function Dashboard() {
  return <Tournaments initial={mode === "demo" ? demoTournaments() : []} view="dashboard" />;
}
