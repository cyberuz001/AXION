"use client";

import { type ReactNode, useRef } from "react";
import { Menu } from "lucide-react";
import { useLocale } from "./locale";

export function MobileNav({ children }: { children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  const { t } = useLocale();
  return <details className="mobile-nav" ref={details}
    onKeyDown={(event) => { if (event.key === "Escape" && details.current?.open) {
      details.current.open = false;
      details.current.querySelector("summary")?.focus();
    } }}>
    <summary aria-label={t("Menyuni ochish")}><Menu size={22} /></summary>
    <nav aria-label={t("Mobil menyu")} onClick={(event) => {
      if (event.target instanceof Element && event.target.closest("a") && details.current) details.current.open = false;
    }}>{children}</nav>
  </details>;
}
