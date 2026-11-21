"use client";

import { type ReactNode, useSyncExternalStore } from "react";

const compactViewport = "(max-width: 767px), (hover: none) and (pointer: coarse)";

function subscribe(update: () => void) {
  const media = window.matchMedia(compactViewport);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

export function isCompactViewport() {
  return window.matchMedia(compactViewport).matches;
}

export function ViewportExperience({ children, schedule }: { children: ReactNode; schedule: ReactNode }) {
  const compact = useSyncExternalStore(subscribe, isCompactViewport, () => false);
  return compact ? schedule : <div className="desktop-experience">{children}</div>;
}
