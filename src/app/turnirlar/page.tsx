import type { Metadata } from "next";
import { Tournaments } from "@/components/tournaments";
import { mode } from "@/lib/server";
import { demoTournaments } from "@/lib/tournaments";

export const metadata: Metadata = { title: "Turnirlar" };

export default async function Directory({ searchParams }: {
  searchParams: Promise<{ oyin?: string | string[] }>;
}) {
  const { oyin } = await searchParams;
  return <Tournaments key={String(oyin)} initial={mode === "demo" ? demoTournaments() : []} view="directory"
    initialFilter={oyin === "cs2" || oyin === "valorant" ? oyin : "all"} />;
}
