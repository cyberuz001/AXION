"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useLocale } from "./locale";

export function ArenaTextScroll() {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const forward = useTransform(scrollYProgress, [0, 1], ["-50%", "0%"]);
  const reverse = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  return <section ref={section} className="arena-text-scroll" aria-label="Counter-Strike 2 va VALORANT">
    <div aria-hidden="true" className="arena-text-lines">
      <motion.div className="arena-text-row" style={reducedMotion ? undefined : { x: forward }}>
        <span>COUNTER-STRIKE 2</span><span>COUNTER-STRIKE 2</span>
      </motion.div>
      <motion.div className="arena-text-row arena-text-outline" style={reducedMotion ? undefined : { x: reverse }}>
        <span>VALORANT / VALORANT</span><span>VALORANT / VALORANT</span>
      </motion.div>
    </div>
  </section>;
}

const parallaxPanels = {
  valorant: { title: "VALORANT", poster: "/media/valorant.webp", href: "#valorant", action: "VALORANT sahnasi" },
  cs2: { title: "COUNTER-STRIKE 2", poster: "/media/fighter.webp", href: "/cs2", action: "CS2 videosi" },
};

export function ArenaParallax({ game }: { game: keyof typeof parallaxPanels }) {
  const section = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();
  const panel = parallaxPanels[game];
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12svh", "12svh"]);
  const captionY = useTransform(scrollYProgress, [0, 1], ["19svh", "-19svh"]);
  const opacity = useTransform(scrollYProgress, [0.13, 0.34, 0.69, 0.95], [0.08, 1, 1, 0.16]);
  const clipPath = useTransform(scrollYProgress, [0.07, 0.35], ["inset(0% 24% 0% 24%)", "inset(0% 0% 0% 0%)"]);

  return <section ref={section} className={`arena-parallax arena-parallax-${game}`} aria-labelledby={`parallax-${game}`}>
    <motion.div className="parallax-window" style={reducedMotion ? undefined : { clipPath }} aria-hidden="true">
      <motion.div className="parallax-image" style={reducedMotion ? undefined : { y }}>
        <Image src={panel.poster} alt="" fill sizes="100vw" unoptimized />
      </motion.div>
    </motion.div>
    <div className="shell parallax-caption">
      <motion.div style={reducedMotion ? undefined : { y: captionY, opacity }}>
        <h2 id={`parallax-${game}`}>{panel.title}</h2>
        <Link className="parallax-link" href={panel.href}>{t(panel.action)} <ArrowDownRight size={20} /></Link>
      </motion.div>
    </div>
  </section>;
}
