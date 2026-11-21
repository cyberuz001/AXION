"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { MobileNav } from "./mobile-nav";
import { OptionSelect } from "./option-select";
import { ThemeToggle } from "./theme";
import { changeLocale, useLocale, type Locale } from "./locale";

export function Brand() {
  const { t } = useLocale();
  return <Link className="brand" href="/" aria-label={t("AXION bosh sahifa")}>
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>AXION</span>
  </Link>;
}

export function Header() {
  const { locale, t } = useLocale();
  const path = usePathname();
  const [hidden, setHidden] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    if (y <= 2) setHidden(false);
    else if (y > 16 && y > (scrollY.getPrevious() ?? 0)) setHidden(true);
  });

  const links = <>
    <Link href="/cs2" aria-current={path === "/cs2" ? "page" : undefined}>CS2</Link>
    <Link href="/#valorant">VALORANT</Link>
    <Link href="/turnirlar" aria-current={path === "/turnirlar" ? "page" : undefined}>{t("Turnirlar")}</Link>
  </>;
  return <header className="site-header" data-hidden={hidden}>
    <div className="shell header-inner">
      <Brand />
      <nav className="desktop-nav" aria-label={t("Asosiy menyu")}>{links}</nav>
      <div className="header-actions">
        <OptionSelect compact label={t("Til")} value={locale} options={[{ value: "uz", label: "UZ" }, { value: "en", label: "EN" }]}
          onValueChange={(value) => changeLocale(value as Locale)} />
        <ThemeToggle />
        <Link className="button header-panel" href="/boshqaruv" aria-current={path === "/boshqaruv" ? "page" : undefined}>{t("Boshqaruv")}</Link>
        <MobileNav>{links}<Link href="/boshqaruv">{t("Boshqaruv")}</Link></MobileNav>
      </div>
    </div>
  </header>;
}

export function Footer() {
  const { t } = useLocale();
  return <footer className="site-footer">
    <div className="shell footer-inner">
      <Brand />
      <nav aria-label={t("Sahifa oxiri")}><Link href="/cs2">CS2</Link><Link href="/#valorant">VALORANT</Link><Link href="/turnirlar">{t("Turnirlar")}</Link><Link href="/boshqaruv">{t("Boshqaruv")}</Link><a href="https://github.com/cyberuz001/AXION">GitHub</a></nav>
    </div>
    <div className="shell footer-legal">
      <span>AXION © {new Date().getUTCFullYear()}</span>
      <span>{t("Mustaqil espor platformasi.")}</span>
    </div>
  </footer>;
}
