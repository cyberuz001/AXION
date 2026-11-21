"use client";

import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from "react";

const english: Record<string, string> = {
  "Asosiy kontentga o‘tish": "Skip to content",
  "AXION bosh sahifa": "AXION home",
  "Asosiy menyu": "Main navigation",
  "Mobil menyu": "Mobile navigation",
  "Menyuni ochish": "Open menu",
  "Til": "Language",
  "Turnirlar": "Tournaments",
  "Boshqaruv": "Manage",
  "Sahifa oxiri": "Footer",
  "O‘zbekiston kibersport turnirlari.": "Esports tournaments in Uzbekistan.",
  "Mustaqil espor platformasi.": "Independent esports platform.",
  "KIBER": "ESPORTS",
  "ARENA.": "ARENA.",
  "AGENT": "AGENT",
  "ARENASI.": "ARENA.",
  "O‘zbekiston kibersport turnirlari": "Esports tournaments in Uzbekistan",
  "Jamoang bilan turnirga kir.": "Enter a tournament with your team.",
  "Turnirlarni ko‘rish": "Browse tournaments",
  "Keyingi arena": "Next arena",
  "Turnirlar taqvimi": "Tournament schedule",
  "VALORANT turnirlari": "VALORANT tournaments",
  "Videoni pauza qilish": "Pause film",
  "Videoni ijro etish": "Play film",
  "Scroll orqali boshqarish": "Control with scroll",
  "TURNIRLAR.": "TOURNAMENTS.",
  "BOSHQARUV.": "MANAGE.",
  "Barcha turnirlar": "All tournaments",
  "Turnir yaratish": "Create tournament",
  "Kirish": "Sign in",
  "Chiqish": "Sign out",
  "Demo rejimi · O‘zgarishlar shu brauzerda saqlanadi.": "Demo mode · Changes are saved in this browser.",
  "Natija va turnirlarni tahrirlash uchun tizimga kiring.": "Sign in to manage tournaments and results.",
  "Barchasi": "All games",
  "O‘yin filtri": "Filter by game",
  "Turnir qidirish": "Search tournaments",
  "Turnir holati": "Tournament status",
  "Barcha holatlar": "All statuses",
  "Qabul ochiq": "Registration open",
  "Jonli": "Live",
  "Yakunlangan": "Completed",
  "Qayta yuklash": "Retry",
  "Turnirlar yuklanmoqda…": "Loading tournaments…",
  "Turnirlar topilmadi.": "No tournaments found.",
  "Jamoalar": "Teams",
  "Jamoalar hali ro‘yxatdan o‘tmagan.": "No teams have registered yet.",
  "Jamoani ro‘yxatdan o‘tkazish": "Register a team",
  "Joy qolmagan": "Tournament full",
  "Kamida ikki jamoa kerak": "At least two teams are needed",
  "Turnirni boshlash": "Start tournament",
  "Turnir boshlandi.": "Tournament started.",
  "Natija saqlandi.": "Result saved.",
  "Jamoa ro‘yxatdan o‘tdi.": "Team registered.",
  "Jamoa nomi": "Team name",
  "Sardorning o‘yin nomi": "Captain’s player name",
  "Orqaga": "Back",
  "Saqlanmoqda…": "Saving…",
  "Ro‘yxatdan o‘tish": "Register",
  "Turnir yaratildi.": "Tournament created.",
  "Turnir nomi": "Tournament name",
  "O‘yin": "Game",
  "Joylar": "Team slots",
  "Sana va vaqt (Toshkent)": "Date and time (Tashkent)",
  "Mukofot (so‘m)": "Prize (UZS)",
  "Tashkilotchi kirishi": "Organizer sign-in",
  "Tashkilotchi paroli": "Organizer password",
  "Kirilmoqda…": "Signing in…",
  "Tafsilot": "Details",
  "Yopish": "Close",
  "Turnir to‘ri": "Bracket",
  "Turnir raundlari": "Tournament rounds",
  "G‘olib": "Winner",
  "Final": "Final",
  "Avtomatik o‘tish": "Bye",
  "Kutilmoqda": "Pending",
  "Saqlash": "Save",
  "So‘rov bajarilmadi.": "The request failed.",
  "Turnirlarni yuklab bo‘lmadi.": "Could not load tournaments.",
  "Amal bajarilmadi.": "The action failed.",
  "Brauzer xotirasiga yozib bo‘lmadi.": "Could not save data in browser storage.",
  "Turnir ma’lumotlarini tekshiring.": "Check the tournament details.",
  "Turnirlar soni chegaraga yetdi.": "The tournament limit has been reached.",
  "Turnir topilmadi.": "Tournament not found.",
  "Ro‘yxatdan o‘tish yopilgan.": "Registration is closed.",
  "Jamoa va sardor nomi 2–32 belgidan iborat bo‘lsin.": "Team and captain names must have 2–32 characters.",
  "Bu jamoa allaqachon ro‘yxatdan o‘tgan.": "This team is already registered.",
  "Bo‘sh joy qolmagan.": "No slots are available.",
  "Turnirni boshlash uchun kamida ikki jamoa kerak.": "At least two teams are needed to start the tournament.",
  "Bu uchrashuv natijasini hozir kiritib bo‘lmaydi.": "A result cannot be submitted for this match yet.",
  "0–99 oralig‘ida turli hisoblar kiriting.": "Enter two different scores between 0 and 99.",
  "So‘rov noto‘g‘ri.": "Invalid request.",
  "So‘rov juda katta.": "The request is too large.",
  "So‘rovga ruxsat yo‘q.": "The request is not allowed.",
  "Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.": "The server is unavailable. Try again.",
  "Tashkilotchi sifatida kiring.": "Sign in as an organizer.",
  "Bir daqiqadan keyin qayta urinib ko‘ring.": "Try again in one minute.",
  "Ma’lumot yangilandi. Qayta urinib ko‘ring.": "The tournament was updated. Try again.",
  "Kirish imkonsiz.": "Sign-in is unavailable.",
  "Parol noto‘g‘ri.": "Incorrect password.",
  "Kirishda xatolik. Qayta urinib ko‘ring.": "Sign-in failed. Try again.",
};

export type Locale = "uz" | "en";
const languageKey = "axion-language";
const change = "axion-language-change";
let fallback: Locale = "uz";

function snapshot(): Locale {
  try {
    const stored = localStorage.getItem(languageKey);
    return stored === "uz" || stored === "en" ? stored : fallback;
  }
  catch { return fallback; }
}

function subscribe(update: () => void) {
  window.addEventListener(change, update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener(change, update);
    window.removeEventListener("storage", update);
  };
}

const defaultLocale = () => "uz" as const;
const Context = createContext<Locale>("uz");

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, snapshot, defaultLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <Context.Provider value={locale}>{children}</Context.Provider>;
}

export function changeLocale(locale: Locale) {
  fallback = locale;
  try { localStorage.setItem(languageKey, locale); } catch { /* Keep the in-memory preference. */ }
  window.dispatchEvent(new Event(change));
}

export function useLocale() {
  const locale = useContext(Context);
  return { locale, t: (text: string) => locale === "en" ? english[text] ?? text : text };
}

export function SkipLink() {
  const { t } = useLocale();
  return <a className="skip-link" href="#main">{t("Asosiy kontentga o‘tish")}</a>;
}
