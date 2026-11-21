import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer, Header } from "@/components/shell";
import { LocaleProvider, SkipLink } from "@/components/locale";
import { themeScript } from "@/lib/theme-preference";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AXION — O‘zbekiston kibersport arenasi", template: "%s · AXION" },
  description: "Counter-Strike 2 va VALORANT turnirlariga jamoangiz bilan qo‘shiling yoki o‘z turniringizni boshqaring.",
  icons: { icon: "/axion-icon.svg" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="uz" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body><LocaleProvider>
      <SkipLink />
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </LocaleProvider></body>
  </html>;
}
