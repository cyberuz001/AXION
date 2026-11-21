import { ArenaScene } from "@/components/arena-scene";
import { ArenaGallery } from "@/components/arena-gallery";
import { Tournaments } from "@/components/tournaments";
import { mode } from "@/lib/server";
import { demoTournaments } from "@/lib/tournaments";

export default function Home() {
  return <>
    <ArenaScene game="cs2" />
    <ArenaScene game="valorant" />
    <ArenaGallery />
    <Tournaments initial={mode === "demo" ? demoTournaments() : []} view="preview" />
  </>;
}
