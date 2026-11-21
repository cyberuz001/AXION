"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import BlurText from "./react-bits/BlurText";
import ScrollReveal from "./react-bits/ScrollReveal";
import DotGrid from "./react-bits/DotGrid";
import { useLocale } from "./locale";

type Arena = "cs2" | "valorant";

const scenes = {
  cs2: {
    name: "CS2",
    title: "KIBER",
    highlight: "ARENA.",
    detail: "O‘zbekiston kibersport turnirlari",
    action: "Turnirlarni ko‘rish",
    next: "#valorant",
    nextLabel: "Keyingi arena",
  },
  valorant: {
    name: "VALORANT",
    title: "AGENT",
    highlight: "ARENASI.",
    detail: "Jamoang bilan turnirga kir.",
    action: "VALORANT turnirlari",
    next: "#turnirlar",
    nextLabel: "Turnirlar taqvimi",
  },
};

export function ArenaScene({ game }: { game: Arena }) {
  const chapter = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const lastProgress = useRef(0);
  const scrubbing = useRef(true);
  const reduced = useRef(false);
  const [manual, setManual] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(game === "cs2");
  const scene = scenes[game];
  const { locale, t } = useLocale();
  const { scrollYProgress } = useScroll({ target: chapter, offset: ["start 0.08", "end end"] });

  function renderProgress() {
    frame.current = null;
    if (!scrubbing.current || reduced.current) return;
    const progress = Math.min(1, Math.max(0, lastProgress.current));
    screen.current?.style.setProperty("--scene-progress", String(progress));
    const media = video.current;
    if (!media || media.seeking || !Number.isFinite(media.duration)) return;
    const time = Math.min(media.duration - 0.06, progress * media.duration);
    if (Math.abs(media.currentTime - time) > 0.035) media.currentTime = time;
  }

  function scheduleProgress() {
    if (frame.current === null) frame.current = requestAnimationFrame(renderProgress);
  }

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    lastProgress.current = progress;
    scheduleProgress();
  });

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = motionPreference.matches; };
    update();
    motionPreference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShouldLoad(true);
    }, { rootMargin: "240px" });
    const section = chapter.current;
    if (section) observer.observe(section);
    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", update);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, []);

  async function toggleVideo() {
    const media = video.current;
    if (!media) return;
    if (!media.paused) {
      media.pause();
      return;
    }
    scrubbing.current = false;
    setManual(true);
    try {
      await media.play();
    } catch {
      scrubbing.current = true;
      setManual(false);
    }
  }

  function resumeScroll() {
    video.current?.pause();
    scrubbing.current = true;
    setManual(false);
    scheduleProgress();
  }

  return <section className={`arena arena-${game}`} id={game} ref={chapter} aria-label={scene.name}>
    <div className="arena-screen" ref={screen}>
      <div className="arena-visual">
        <video ref={video} src={shouldLoad ? `/media/${game}.mp4` : undefined} poster={`/media/${game}.webp`}
          preload={game === "cs2" ? "auto" : "metadata"} muted playsInline loop aria-hidden="true"
          onLoadedData={scheduleProgress} onSeeked={scheduleProgress}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      </div>
      <div className="arena-gradients" />
      <div className="arena-dots" aria-hidden="true">
        <DotGrid dotSize={1.5} gap={34} baseColor={game === "cs2" ? "#777777" : "#999999"} activeColor={game === "cs2" ? "#eeeeee" : "#3b3b3b"} />
      </div>
      <div className="arena-sheen" aria-hidden="true" />
      <div className="shell arena-content">
        <div className="arena-copy">
          <div className="arena-game"><span aria-hidden="true" />{scene.name}</div>
          {game === "cs2" ? <h1 key={locale}><BlurText text={t(scene.title)} stepDuration={0.19} trigger="load" className="title-line" />
            <BlurText text={t(scene.highlight)} stepDuration={0.22} trigger="load" className="title-line" /></h1> :
            <h2><ScrollReveal containerClassName="reveal-heading" textClassName="title-line" baseOpacity={0.62} baseRotation={0} effect="rise">{t(scene.title)}</ScrollReveal>
              <span className="title-line">{t(scene.highlight)}</span></h2>}
          <p>{t(scene.detail)}</p>
          <div className="arena-actions">
            <Link className="button button-primary" href={game === "cs2" ? "/turnirlar" : "/turnirlar?oyin=valorant"}>{t(scene.action)} <ArrowUpRight size={18} /></Link>
          </div>
        </div>
        <div className="arena-bottom">
          <a className="next-scene" href={scene.next}>{t(scene.nextLabel)} <ArrowDownRight size={17} /></a>
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
