"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useLocale } from "./locale";
import { themeKey } from "@/lib/theme-preference";

const themeEvent = "axion-theme-change";
type Theme = "light" | "dark";
let fallback: Theme = "light";
const serverTheme = (): Theme => "light";

function snapshot(): Theme {
  try {
    const stored = localStorage.getItem(themeKey);
    return stored === "light" || stored === "dark" ? stored : fallback;
  }
  catch { return fallback; }
}

function subscribe(update: () => void) {
  window.addEventListener(themeEvent, update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener(themeEvent, update);
    window.removeEventListener("storage", update);
  };
}

export function ThemeToggle() {
  const { t } = useLocale();
  const theme = useSyncExternalStore(subscribe, snapshot, serverTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = snapshot();
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    fallback = next;
    try { localStorage.setItem(themeKey, next); } catch { /* Keep the in-memory preference. */ }
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event(themeEvent));
  }

  const label = t(theme === "dark" ? "Yorug‘ rejimga o‘tish" : "Qorong‘i rejimga o‘tish");
  return <button className="theme-toggle" type="button" aria-label={label} title={label} onClick={toggle}>
    <Sun size={19} className="theme-sun" /><Moon size={19} className="theme-moon" />
  </button>;
}
