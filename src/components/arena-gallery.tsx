"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type RefObject } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useLocale } from "./locale";

const panels = [
  { title: "COUNTER-STRIKE 2", action: "CS2 videosi", href: "/cs2", poster: "/media/fighter.webp" },
  { title: "VALORANT", action: "VALORANT turnirlari", href: "/turnirlar?oyin=valorant", poster: "/media/valorant.webp" },
  { title: "TURNIRLAR.", action: "Barcha turnirlar", href: "/turnirlar", poster: "/media/cs2.webp" },
];

export function ArenaGallery() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const { scrollXProgress } = useScroll({ container: rail });
  const track = useSpring(scrollXProgress, { stiffness: 150, damping: 30, restDelta: 0.001 });
  const textShift = useTransform(scrollYProgress, [0, 1], ["translateX(11vw)", "translateX(0vw)"]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const element = rail.current;
    if (element && !reducedMotion) {
      element.scrollLeft = (element.scrollWidth - element.clientWidth) * progress;
    }
  });

  return <section id="arenalar" ref={section} className="arena-gallery" aria-labelledby="arena-gallery-title">
    <div className="arena-gallery-stage">
      <div className="shell gallery-heading">
        <motion.h2 id="arena-gallery-title" style={reducedMotion ? undefined : { transform: textShift }}>
          {t("ARENALAR.")}
        </motion.h2>
      </div>
      <div className="gallery-rail" ref={rail} tabIndex={0} role="region" aria-label={t("Arena galereyasi")}>
        {panels.map((panel) => <GalleryPanel key={panel.href} panel={panel} rail={rail} />)}
      </div>
      <div className="shell gallery-progress" aria-hidden="true">
        <div className="scene-tracker"><motion.span style={{ scaleX: track }} /></div>
      </div>
    </div>
  </section>;
}

function GalleryPanel({ panel, rail }: { panel: (typeof panels)[number]; rail: RefObject<HTMLDivElement | null> }) {
  const card = useRef<HTMLAnchorElement>(null);
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const { scrollXProgress } = useScroll({
    container: rail,
    target: card,
    axis: "x",
    offset: ["start end", "center center"],
  });
  const imageReveal = useTransform(scrollXProgress, [0, 1], ["inset(7% 25% 7% 25%)", "inset(0% 0% 0% 0%)"]);

  return <Link href={panel.href} className="gallery-panel" ref={card}>
    <motion.div className="gallery-image" style={reducedMotion ? undefined : { clipPath: imageReveal }}>
      <Image src={panel.poster} alt="" fill sizes="(max-width: 720px) 100vw, 90vw" unoptimized />
    </motion.div>
    <div className="gallery-panel-copy">
      <motion.h3 initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }} viewport={{ root: rail, once: true, amount: 0.2 }}
        transition={{ duration: reducedMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}>
        {t(panel.title)}
      </motion.h3>
      <span className="gallery-panel-action">{t(panel.action)} <ArrowUpRight size={18} /></span>
    </div>
  </Link>;
}
