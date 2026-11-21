"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Pause, Play, RotateCcw } from "lucide-react";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import BlurText from "./react-bits/BlurText";
import ScrollReveal from "./react-bits/ScrollReveal";
import DotGrid from "./react-bits/DotGrid";
import StarBorder from "./react-bits/StarBorder";
import { useLocale } from "./locale";

type Arena = "cs2" | "fighter" | "valorant";
const mediaChunkSize = 768 * 1024;

async function bufferFilm(path: string, signal: AbortSignal, segmented: boolean) {
  const first = await fetch(path, { signal, headers: segmented ? { Range: `bytes=0-${mediaChunkSize - 1}` } : undefined });
  if (!first.ok) throw new Error("Could not buffer the clip");
  if (!segmented || first.status === 200) return first.blob();

  const range = /^bytes 0-(\d+)\/(\d+)$/.exec(first.headers.get("Content-Range") ?? "");
  if (!range) throw new Error("Missing clip byte range");

  const start = Number(range[1]) + 1;
  const length = Number(range[2]);
  const chunks = Array.from({ length: Math.ceil((length - start) / mediaChunkSize) }, (_, index) => {
    const from = start + index * mediaChunkSize;
    const to = Math.min(from + mediaChunkSize, length) - 1;
    return fetch(path, { signal, headers: { Range: `bytes=${from}-${to}` } }).then((response) => {
      if (response.headers.get("Content-Range") !== `bytes ${from}-${to}/${length}` || response.status !== 206) {
        throw new Error("Unexpected clip byte range");
      }
      return response.arrayBuffer();
    });
  });
  return new Blob(await Promise.all([first.arrayBuffer(), ...chunks]), { type: "video/mp4" });
}

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
  const previewStart = useRef<number | null>(null);
  const lastSeek = useRef(0);
  const seekTimer = useRef<number | undefined>(undefined);
  const [manual, setManual] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState<string>();
  const scene = scenes[game];
  const { locale, t } = useLocale();
  const reducedMotion = useReducedMotion();
  const inView = useInView(chapter, { once: true, margin: "400px" });
  const shouldLoad = game !== "valorant" || inView;
  const { scrollY, scrollYProgress } = useScroll({
    target: chapter,
    offset: ["start start", "end end"],
    trackContentSize: true,
  });
  const filmTransform = useTransform(scrollYProgress, [0, 0.28, 0.74, 1], [
    "translate3d(0, 0svh, 0) scale(1)",
    "translate3d(0, -3svh, 0) scale(1.035)",
    "translate3d(0, -10svh, 0) scale(1.09)",
    "translate3d(0, -16svh, 0) scale(1.13)",
  ]);
  const copyTransform = useTransform(scrollYProgress, [0, 0.66], [
    "translate3d(0, 0svh, 0)",
    "translate3d(0, -11svh, 0)",
  ]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.15, 0.64, 1], [1, 1, 0.38, 0.21]);
  const lightTransform = useTransform(scrollYProgress, [0.68, 1], ["translateX(-56%)", "translateX(56%)"]);
  const lightOpacity = useTransform(scrollYProgress, [0.68, 0.84, 1], [0, 0.19, 0]);

  useEffect(() => {
    if (!shouldLoad) return;
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const path = `/media/${game}${mobile ? "-mobile" : ""}.mp4`;
    if (!mobile && game !== "cs2") {
      setSource(path);
      return;
    }

    const request = new AbortController();
    const timeout = window.setTimeout(() => request.abort(), 38000);
    let disposed = false;
    let objectUrl: string | undefined;
    // Buffer the scroll clip so reversing direction does not interrupt an outstanding media request.
    void bufferFilm(path, request.signal, !mobile).then((movie) => {
      if (disposed) return;
      objectUrl = URL.createObjectURL(movie);
      setSource(objectUrl);
    }).catch(() => {
      request.abort();
      if (!disposed) setSource(path);
    }).finally(() => window.clearTimeout(timeout));
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      request.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [game, shouldLoad]);

  const syncFrame: () => void = useCallback(() => {
    const media = video.current;
    if (reducedMotion || previewStart.current !== null || !media ||
        media.readyState < HTMLMediaElement.HAVE_METADATA ||
        !Number.isFinite(media.duration) || media.duration <= 0) return;

    const time = scrollYProgress.get() * Math.max(0, media.duration - 0.045);
    if (Math.abs(media.currentTime - time) < 0.016) return;

    const now = performance.now();
    const wait = 85 - (now - lastSeek.current);
    if (media.seeking && wait > 0) {
      if (seekTimer.current === undefined) {
        seekTimer.current = window.setTimeout(() => {
          seekTimer.current = undefined;
          syncFrame();
        }, wait);
      }
      return;
    }
    lastSeek.current = now;
    media.currentTime = time;
  }, [reducedMotion, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", syncFrame);
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (previewStart.current !== null && !reducedMotion && Math.abs(latest - previewStart.current) > 6) {
      resumeScroll();
    }
  });
  useEffect(() => {
    syncFrame();
    return () => {
      window.clearTimeout(seekTimer.current);
      seekTimer.current = undefined;
    };
  }, [syncFrame]);

  async function toggleVideo() {
    const media = video.current;
    if (!media) return;
    if (!media.paused) {
      media.pause();
      return;
    }
    previewStart.current = scrollY.get();
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
    syncFrame();
  }

  return <section className={`arena arena-${game}`} id={game} ref={chapter} aria-label={scene.name}>
    <div className="arena-screen">
      <motion.div className="arena-visual" style={reducedMotion ? undefined : { transform: filmTransform }}>
        <video ref={video} src={source} poster={`/media/${game}.webp`}
          preload={source ? "auto" : "none"} muted playsInline loop aria-hidden="true"
          onLoadedMetadata={syncFrame} onLoadedData={syncFrame} onSeeked={syncFrame}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      </motion.div>
      <div className="arena-gradients" />
      <div className="arena-dots" aria-hidden="true">
        <DotGrid dotSize={1.5} gap={34} baseColor={game === "valorant" ? "#999999" : "#777777"} activeColor={game === "valorant" ? "#3b3b3b" : "#eeeeee"} />
      </div>
      <motion.div className="arena-sheen" aria-hidden="true" style={reducedMotion ? undefined : { transform: lightTransform, opacity: lightOpacity }} />
      <div className="shell arena-content">
        <motion.div className="arena-copy" style={reducedMotion ? undefined : { transform: copyTransform, opacity: copyOpacity }}>
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
        </motion.div>
        <div className="arena-bottom">
          <Link className="next-scene" href={scene.next}>{t(scene.nextLabel)} <ArrowDownRight size={17} /></Link>
          <div className="scene-tracker" aria-hidden="true"><motion.span style={reducedMotion ? undefined : { scaleX: scrollYProgress }} /></div>
          <div className="video-controls">
            {manual && <button className="icon-button" type="button" aria-label={t("Scroll orqali boshqarish")} title={t("Scroll orqali boshqarish")} onClick={resumeScroll}><RotateCcw size={16} /></button>}
            <button className="icon-button" type="button" disabled={!source} aria-label={t(playing ? "Videoni pauza qilish" : "Videoni ijro etish")} onClick={toggleVideo}>
              {playing ? <Pause size={17} /> : <Play size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
