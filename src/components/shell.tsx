"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { changeLocale, useLocale, type Locale } from "./locale";

export function Brand() {
  const { t } = useLocale();
  return <Link className="brand" href="/" aria-label={t("AXION bosh sahifa")}>
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>AXION</span>
  </Link>;
}

export function Header() {
  const { locale, t } = useLocale();
  const links = <>
    <Link href="/#cs2">CS2</Link>
    <Link href="/#valorant">VALORANT</Link>
    <Link href="/turnirlar">{t("Turnirlar")}</Link>
  </>;
  return <header className="site-header">
    <div className="shell header-inner">
      <Brand />
      <nav className="desktop-nav" aria-label={t("Asosiy menyu")}>{links}</nav>
      <div className="header-actions">
        <div className="language">
          <select aria-label={t("Til")} value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
            <option value="uz">UZ</option><option value="en">EN</option>
          </select><ChevronDown size={15} aria-hidden="true" />
        </div>
        <Link className="button header-panel" href="/boshqaruv">{t("Boshqaruv")}</Link>
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
      <nav aria-label={t("Sahifa oxiri")}><Link href="/turnirlar">{t("Turnirlar")}</Link><Link href="/boshqaruv">{t("Boshqaruv")}</Link><a href="https://github.com/cyberuz001/AXION">GitHub</a></nav>
    </div>
    <div className="shell footer-legal">
      <span>AXION © {new Date().getUTCFullYear()}</span>
      <span>{t("Mustaqil espor platformasi.")}</span>
    </div>
  </footer>;
}
