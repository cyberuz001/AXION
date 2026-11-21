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
import { isCompactViewport } from "./viewport-experience";

type Arena = "cs2" | "fighter" | "valorant";

const scenes = {
  cs2: {
    name: "CS2",
    title: "KIBER",
    highlight: "ARENA.",
    detail: "O‘zbekiston kibersport turnirlari",
    action: "Turnirlarni ko‘rish",
    target: "/turnirlar",
    next: "VALORANT",
  },
  fighter: {
    name: "CS2",
    title: "COUNTER",
    highlight: "STRIKE 2.",
    detail: "Counter-Strike 2 turnirlari",
    action: "CS2 turnirlari",
    target: "/turnirlar?oyin=cs2",
    next: "TURNIRLAR.",
  },
  valorant: {
    name: "VALORANT",
    title: "AGENT",
    highlight: "ARENASI.",
    detail: "Jamoang bilan turnirga kir.",
    action: "VALORANT turnirlari",
    target: "/turnirlar?oyin=valorant",
    next: "ARENALAR.",
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
  const filmTransform = useTransform(scrollYProgress, [0, 0.26, 0.59, 0.8, 1], [
    "translate3d(0, 0svh, 0) scale(1.03)",
    "translate3d(0, 13svh, 0) scale(1.04)",
    "translate3d(0, 31svh, 0) scale(1.06)",
    "translate3d(0, 53svh, 0) scale(1.1)",
    "translate3d(0, 88svh, 0) scale(1.12)",
  ]);
  const filmOpacity = useTransform(scrollYProgress, [0, 0.6, 0.83, 0.92], [1, 1, 0.68, 0]);
  const copyY = useTransform(scrollYProgress, [0, 0.53], ["0svh", "-27svh"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.08, 0.37, 0.53], [1, 1, 0.48, 0]);
  const lightTransform = useTransform(scrollYProgress, [0.58, 0.96], ["translateX(-56%)", "translateX(56%)"]);
  const lightOpacity = useTransform(scrollYProgress, [0.58, 0.74, 0.92], [0, 0.28, 0]);
  const handoffOpacity = useTransform(scrollYProgress, [0.63, 0.83, 0.96, 1], [0, 1, 1, 0.82]);
  const handoffY = useTransform(scrollYProgress, [0.63, 0.91, 1], ["18svh", "0svh", "-13svh"]);
  const handoffMask = useTransform(scrollYProgress, [0.64, 0.82], ["inset(0 55% 0 0)", "inset(0 0% 0 0)"]);
  const trackProgress = useSpring(scrollYProgress, { stiffness: 145, damping: 32, restDelta: 0.001 });

  useEffect(() => {
    // Let the browser decode the first frames while the rest of the clip downloads.
    setSource(shouldLoad && !isCompactViewport() ? `/media/${game}.mp4` : undefined);
  }, [game, shouldLoad]);

  const syncFrame: () => void = useCallback(() => {
    const media = video.current;
    if (reducedMotion || !media || media.readyState < HTMLMediaElement.HAVE_METADATA ||
        !Number.isFinite(media.duration) || media.duration <= 0) return;

    const time = Math.min(scrollYProgress.get() / 0.9, 1) * Math.max(0, media.duration - 0.045);
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
    const visible = progress < 0.49;
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
      <div className="arena-screen">
        <motion.div className="arena-visual" style={reducedMotion ? undefined : { transform: filmTransform, opacity: filmOpacity }}>
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
            style={reducedMotion ? undefined : { y: copyY, opacity: copyOpacity }}>
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
      </div>
      <motion.div className="shell arena-handoff" aria-hidden="true"
        style={{ opacity: handoffOpacity, y: handoffY, clipPath: handoffMask }}>
        <span>{t(scene.next)}</span>
      </motion.div>
      <div className="shell arena-progress" aria-hidden="true">
        <div className="scene-tracker">
          <motion.span style={reducedMotion ? undefined : { scaleX: trackProgress }} />
        </div>
      </div>
    </div>
  </section>;
}
