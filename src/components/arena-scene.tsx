"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
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
  },
  fighter: {
    name: "CS2",
    title: "COUNTER",
    highlight: "STRIKE 2.",
    detail: "Counter-Strike 2 turnirlari",
    action: "CS2 turnirlari",
    target: "/turnirlar?oyin=cs2",
  },
  valorant: {
    name: "VALORANT",
    title: "AGENT",
    highlight: "ARENASI.",
    detail: "Jamoang bilan turnirga kir.",
    action: "VALORANT turnirlari",
    target: "/turnirlar?oyin=valorant",
  },
};

export function ArenaScene({ game }: { game: Arena }) {
  const chapter = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const lastSeek = useRef(0);
  const seekTimer = useRef<number | undefined>(undefined);
  const [source, setSource] = useState<string>();
  const [introVisible, setIntroVisible] = useState(true);
  const scene = scenes[game];
  const { locale, t } = useLocale();
  const reducedMotion = useReducedMotion();
  const inView = useInView(chapter, { once: true, margin: "400px" });
  const shouldLoad = !reducedMotion && (game !== "valorant" || inView);
  const { scrollYProgress } = useScroll({
    target: chapter,
    offset: ["start start", "end end"],
    trackContentSize: true,
  });
  const stageTransform = useTransform(scrollYProgress, [0, 0.22, 0.62, 0.86, 1], [
    "translate3d(0, 0svh, 0)",
    "translate3d(0, -13svh, 0)",
    "translate3d(0, -33svh, 0)",
    "translate3d(0, -47svh, 0)",
    "translate3d(0, -102svh, 0)",
  ]);
  const filmTransform = useTransform(scrollYProgress, [0, 0.62, 0.86, 1], [
    "translate3d(0, 0svh, 0) scale(1)",
    "translate3d(0, 13svh, 0) scale(1.04)",
    "translate3d(0, 23svh, 0) scale(1.09)",
    "translate3d(0, 24svh, 0) scale(1.11)",
  ]);
  const copyTransform = useTransform(scrollYProgress, [0, 0.68], [
    "translate3d(0, 0svh, 0)",
    "translate3d(0, -29svh, 0)",
  ]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.1, 0.57, 0.73, 1], [1, 1, 0.28, 0, 0]);
  const lightTransform = useTransform(scrollYProgress, [0.68, 1], ["translateX(-56%)", "translateX(56%)"]);
  const lightOpacity = useTransform(scrollYProgress, [0.68, 0.84, 1], [0, 0.19, 0]);
  const trackProgress = useSpring(scrollYProgress, { stiffness: 145, damping: 32, restDelta: 0.001 });

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
    if (reducedMotion || !media || media.readyState < HTMLMediaElement.HAVE_METADATA ||
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

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    syncFrame();
    const visible = progress < 0.7;
    if (visible !== introVisible) setIntroVisible(visible);
  });
  useEffect(() => {
    syncFrame();
    return () => {
      window.clearTimeout(seekTimer.current);
      seekTimer.current = undefined;
    };
  }, [syncFrame]);

  return <section className={`arena arena-${game}`} id={game} ref={chapter} aria-label={scene.name}>
    <div className="arena-window">
      <motion.div className="arena-screen" style={reducedMotion ? undefined : { transform: stageTransform }}>
        <motion.div className="arena-visual" style={reducedMotion ? undefined : { transform: filmTransform }}>
          <video ref={video} src={source} poster={`/media/${game}.webp`}
            preload={source ? "auto" : "none"} muted playsInline disablePictureInPicture disableRemotePlayback
            aria-hidden="true" onLoadedMetadata={syncFrame} onLoadedData={syncFrame} onSeeked={syncFrame} />
        </motion.div>
        <div className="arena-gradients" />
        <div className="arena-dots" aria-hidden="true">
          <DotGrid dotSize={1.5} gap={34} baseColor={game === "valorant" ? "#999999" : "#777777"} activeColor={game === "valorant" ? "#3b3b3b" : "#eeeeee"} />
        </div>
        <motion.div className="arena-sheen" aria-hidden="true" style={reducedMotion ? undefined : { transform: lightTransform, opacity: lightOpacity }} />
        <div className="shell arena-content">
          <motion.div className="arena-copy"
            style={reducedMotion ? undefined : { transform: copyTransform, opacity: copyOpacity }}>
            <div className="arena-game"><span aria-hidden="true" />{scene.name}</div>
            {game !== "valorant" ? <h1 key={locale}><BlurText text={t(scene.title)} stepDuration={0.19} trigger="load" className="title-line" />
              <BlurText text={t(scene.highlight)} stepDuration={0.22} trigger="load" className="title-line" /></h1> :
              <h2><ScrollReveal containerClassName="reveal-heading" textClassName="title-line" baseOpacity={0.62} baseRotation={0} effect="rise">{t(scene.title)}</ScrollReveal>
                <span className="title-line">{t(scene.highlight)}</span></h2>}
            <p>{t(scene.detail)}</p>
            <div className="arena-actions" inert={!reducedMotion && !introVisible}>
              <StarBorder as={Link} href={scene.target} className="arena-cta" radius={2} stars={1} duration={10} glow={0.45}
                hover="reveal" backgroundColor={game === "valorant" ? "#101010" : "#f7f7f7"}
                textColor={game === "valorant" ? "#f7f7f7" : "#101010"}>
                {t(scene.action)} <ArrowUpRight size={18} />
              </StarBorder>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <div className="shell arena-progress" aria-hidden="true">
        <div className="scene-tracker">
          <motion.span style={reducedMotion ? undefined : { scaleX: trackProgress }} />
        </div>
      </div>
    </div>
  </section>;
}
