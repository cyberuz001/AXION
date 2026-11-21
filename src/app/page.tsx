import { ArenaScene } from "@/components/arena-scene";
import { ArenaGallery } from "@/components/arena-gallery";
import { ArenaParallax, ArenaTextScroll } from "@/components/arena-motion";
import { Tournaments } from "@/components/tournaments";
import { mode } from "@/lib/server";
import { demoTournaments } from "@/lib/tournaments";

export default function Home() {
  return <>
    <ArenaScene game="cs2" />
    <ArenaTextScroll />
    <ArenaParallax game="valorant" />
    <ArenaScene game="valorant" />
    <ArenaGallery />
    <ArenaParallax game="cs2" />
    <Tournaments initial={mode === "demo" ? demoTournaments() : []} view="preview" />
  </>;
}
