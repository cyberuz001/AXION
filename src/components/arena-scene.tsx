"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import BlurText from "./react-bits/BlurText";
import ScrollReveal from "./react-bits/ScrollReveal";
import DotGrid from "./react-bits/DotGrid";
import StarBorder from "./react-bits/StarBorder";
import { useLocale } from "./locale";

type Arena = "cs2" | "fighter" | "valorant";

const scenes = {
  cs2: {
    name: "CS2",
    title: "KIBER",
    highlight: "ARENA.",
    detail: "O‘zbekiston kibersport turnirlari",
    action: "Turnirlarni ko‘rish",
    target: "/turnirlar",
    next: "/cs2",
    nextLabel: "CS2 videosi",
  },
  fighter: {
    name: "CS2",
    title: "COUNTER",
    highlight: "STRIKE 2.",
    detail: "Counter-Strike 2 turnirlari",
    action: "CS2 turnirlari",
    target: "/turnirlar?oyin=cs2",
    next: "/#valorant",
    nextLabel: "Keyingi arena",
  },
  valorant: {
    name: "VALORANT",
    title: "AGENT",
    highlight: "ARENASI.",
    detail: "Jamoang bilan turnirga kir.",
    action: "VALORANT turnirlari",
    target: "/turnirlar?oyin=valorant",
    next: "#turnirlar",
    nextLabel: "Turnirlar taqvimi",
  },
};

export function ArenaScene({ game }: { game: Arena }) {
  const chapter = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const syncScroll = useRef<(() => void) | null>(null);
  const previewStart = useRef<number | null>(null);
  const [manual, setManual] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(game !== "valorant");
  const scene = scenes[game];
  const { locale, t } = useLocale();

  useEffect(() => {
    const section = chapter.current;
    const stage = screen.current;
    const media = video.current;
    if (!section || !stage || !media) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let stickyTop = 0;
    let travel = 0;

    const render = () => {
      frame = 0;
      if (motionPreference.matches || previewStart.current !== null || travel <= 0) return;

      const progress = Math.min(1, Math.max(0, (stickyTop - section.getBoundingClientRect().top) / travel));
      stage.style.setProperty("--scene-progress", String(progress));
      if (media.seeking || media.readyState < HTMLMediaElement.HAVE_METADATA ||
          !Number.isFinite(media.duration) || media.duration <= 0) return;

      const end = Math.max(0, media.duration - 0.045);
      const time = progress * end;
      if (Math.abs(media.currentTime - time) >= 0.016) media.currentTime = time;
    };

    function schedule() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    const measure = () => {
      stickyTop = Number.parseFloat(getComputedStyle(stage).top) || 0;
      travel = section.offsetHeight - stage.offsetHeight;
      schedule();
    };

    const onScroll = () => {
      if (previewStart.current !== null && !motionPreference.matches &&
          Math.abs(window.scrollY - previewStart.current) > 6) {
        previewStart.current = null;
        media.pause();
        setManual(false);
      }
      schedule();
    };

    syncScroll.current = schedule;
    const sizes = new ResizeObserver(measure);
    sizes.observe(section);
    sizes.observe(stage);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px" });
    observer.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    motionPreference.addEventListener("change", measure);
    const resyncEvents = ["loadedmetadata", "loadeddata", "durationchange", "seeked"];
    resyncEvents.forEach((event) => media.addEventListener(event, schedule));
    measure();
    return () => {
      observer.disconnect();
      sizes.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      motionPreference.removeEventListener("change", measure);
      resyncEvents.forEach((event) => media.removeEventListener(event, schedule));
      cancelAnimationFrame(frame);
      syncScroll.current = null;
    };
  }, []);

  async function toggleVideo() {
    const media = video.current;
    if (!media) return;
    if (!media.paused) {
      media.pause();
      return;
    }
    previewStart.current = window.scrollY;
    setManual(true);
    try {
      await media.play();
    } catch {
      resumeScroll();
    }
  }

  function resumeScroll() {
    video.current?.pause();
    previewStart.current = null;
    setManual(false);
    syncScroll.current?.();
  }

  return <section className={`arena arena-${game}`} id={game} ref={chapter} aria-label={scene.name}>
    <div className="arena-screen" ref={screen}>
      <div className="arena-visual">
        <video ref={video} src={shouldLoad ? `/media/${game}.mp4` : undefined} poster={`/media/${game}.webp`}
          preload={shouldLoad ? "auto" : "none"} muted playsInline loop aria-hidden="true"
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      </div>
      <div className="arena-gradients" />
      <div className="arena-dots" aria-hidden="true">
        <DotGrid dotSize={1.5} gap={34} baseColor={game === "valorant" ? "#999999" : "#777777"} activeColor={game === "valorant" ? "#3b3b3b" : "#eeeeee"} />
      </div>
      <div className="arena-sheen" aria-hidden="true" />
      <div className="shell arena-content">
        <div className="arena-copy">
          <div className="arena-game"><span aria-hidden="true" />{scene.name}</div>
          {game !== "valorant" ? <h1 key={locale}><BlurText text={t(scene.title)} stepDuration={0.19} trigger="load" className="title-line" />
            <BlurText text={t(scene.highlight)} stepDuration={0.22} trigger="load" className="title-line" /></h1> :
            <h2><ScrollReveal containerClassName="reveal-heading" textClassName="title-line" baseOpacity={0.62} baseRotation={0} effect="rise">{t(scene.title)}</ScrollReveal>
              <span className="title-line">{t(scene.highlight)}</span></h2>}
          <p>{t(scene.detail)}</p>
          <div className="arena-actions">
            <StarBorder as={Link} href={scene.target} className="arena-cta" radius={2} stars={1} duration={10} glow={0.45}
              hover="reveal" backgroundColor={game === "valorant" ? "#101010" : "#f7f7f7"}
              textColor={game === "valorant" ? "#f7f7f7" : "#101010"}>
              {t(scene.action)} <ArrowUpRight size={18} />
            </StarBorder>
          </div>
        </div>
        <div className="arena-bottom">
          <Link className="next-scene" href={scene.next}>{t(scene.nextLabel)} <ArrowDownRight size={17} /></Link>
          <div className="scene-tracker" aria-hidden="true"><span /></div>
          <div className="video-controls">
            {manual && <button className="icon-button" type="button" aria-label={t("Scroll orqali boshqarish")} title={t("Scroll orqali boshqarish")} onClick={resumeScroll}><RotateCcw size={16} /></button>}
            <button className="icon-button" type="button" aria-label={t(playing ? "Videoni pauza qilish" : "Videoni ijro etish")} onClick={toggleVideo}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
