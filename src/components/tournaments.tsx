"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, Crosshair, GitFork, LockKeyhole, Plus, Search, Swords, Trophy, Users, X } from "lucide-react";
import { applyCommand, capacities, dateLabel, games, prizeLabel, statusNames, type Command, type Game, type Tournament } from "@/lib/tournaments";
import ScrollReveal from "./react-bits/ScrollReveal";
import { useLocale } from "./locale";

type View = "preview" | "directory" | "dashboard";
type Mode = "demo" | "shared" | "loading";
type Filter = Game | "all";
type Modal = { id: string; page: "details" | "join" } | { page: "create" | "login" };
const storageKey = "axion-demo-v1";
const filters: { key: Filter; label: string }[] = [{ key: "all", label: "Barchasi" }, { key: "cs2", label: "CS2" }, { key: "valorant", label: "VALORANT" }];

function loadLocal(fallback: Tournament[]) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const value = JSON.parse(stored);
      if (Array.isArray(value) && value.every((entry) => entry?.id && entry?.title && Array.isArray(entry.teams) && Array.isArray(entry.matches))) {
        return value as Tournament[];
      }
    }
  } catch { /* Start with the sample set if storage is unavailable. */ }
  return fallback;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "So‘rov bajarilmadi.");
  return data as T;
}

function send(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export function Tournaments({ initial, view, initialFilter = "all" }: {
  initial: Tournament[]; view: View; initialFilter?: Filter;
}) {
  const [items, setItems] = useState(initial);
  const { locale, t } = useLocale();
  const [mode, setMode] = useState<Mode>("loading");
  const [organizer, setOrganizer] = useState(false);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const dashboard = view === "dashboard";
  const preview = view === "preview";

  const refresh = useCallback(async () => {
    setFailure("");
    try {
      const data = await api<{ mode: "demo" | "shared"; organizer: boolean; items: Tournament[] }>("/api/tournaments");
      setMode(data.mode);
      setOrganizer(data.organizer);
      setItems(data.mode === "demo" ? loadLocal(data.items) : data.items);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Turnirlarni yuklab bo‘lmadi.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const sync = (event: StorageEvent) => { if (event.key === storageKey) void refresh(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [refresh]);

  async function run(task: () => Promise<void>): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setNotice("");
    try {
      await task();
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Amal bajarilmadi.");
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function update(command: Command, message: string) {
    return run(async () => {
      if (mode === "demo") {
        const itemsAfter = applyCommand(loadLocal(items), command, window.crypto.randomUUID());
        try {
          localStorage.setItem(storageKey, JSON.stringify(itemsAfter));
        } catch {
          throw new Error("Brauzer xotirasiga yozib bo‘lmadi.");
        }
        setItems(itemsAfter);
      } else {
        const data = await api<{ items: Tournament[] }>("/api/tournaments", send("POST", command));
        setItems(data.items);
      }
      setNotice(message);
    });
  }

  function open(next: Modal) {
    setNotice("");
    setModal(next);
  }

  function close() {
    setModal(null);
    setNotice("");
  }

  const selected = modal && "id" in modal ? items.find(({ id }) => id === modal.id) : undefined;
  const canManage = dashboard && (organizer || mode === "demo");
  const visible = items.filter((item) => (filter === "all" || item.game === filter) &&
    (status === "all" || item.status === status) && item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const cards = preview ? visible.slice(0, 3) : visible;

  return <section id={preview ? "turnirlar" : undefined} className={preview ? "tournaments-section" : "tournaments-section standalone"}>
    <div className="shell">
      <div className="section-heading">
        <div>
          {preview ? <h2 className="section-title"><ScrollReveal mode="enter" effect="rise" baseRotation={0}>{t("TURNIRLAR.")}</ScrollReveal></h2> :
            <h1 className="section-title">{t(dashboard ? "BOSHQARUV." : "TURNIRLAR.")}</h1>}
        </div>
        {preview && <Link className="button button-quiet" href="/turnirlar">{t("Barcha turnirlar")} <ArrowRight size={17} /></Link>}
        {dashboard && (canManage ? <div className="heading-actions">
          {organizer && <button className="button button-quiet" disabled={busy} onClick={() => {
            void run(async () => { await api("/api/session", { method: "DELETE" }); setOrganizer(false); await refresh(); });
          }}>{t("Chiqish")}</button>}
          <button className="button button-primary" onClick={() => open({ page: "create" })}><Plus size={20} /> {t("Turnir yaratish")}</button>
        </div> : <button className="button button-primary" disabled={mode !== "shared"} onClick={() => open({ page: "login" })}><LockKeyhole size={17} /> {t("Kirish")}</button>)}
      </div>

      {mode === "demo" && <p className="mode-notice">{t("Demo rejimi · O‘zgarishlar shu brauzerda saqlanadi.")}</p>}
      {dashboard && mode === "shared" && !organizer && <p className="mode-notice">{t("Natija va turnirlarni tahrirlash uchun tizimga kiring.")}</p>}

      {!preview && <div className="toolbar">
        <div className="filters" aria-label={t("O‘yin filtri")}>
          {filters.map(({ key, label }) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{t(label)}</button>)}
        </div>
        <div className="toolbar-inputs">
          <label className="search"><Search size={17} /><span className="sr-only">{t("Turnir qidirish")}</span>
            <input type="search" placeholder={t("Turnir qidirish")} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select aria-label={t("Turnir holati")} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">{t("Barcha holatlar")}</option>
            {Object.entries(statusNames).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}
          </select>
        </div>
      </div>}

      {failure ? <div className="empty-state" role="alert"><p>{t(failure)}</p><button className="button button-quiet" onClick={() => void refresh()}>{t("Qayta yuklash")}</button></div> :
        cards.length ? <div className="tournament-grid">
          {cards.map((item) => <TournamentCard key={item.id} item={item} onOpen={() => open({ id: item.id, page: "details" })} />)}
        </div> : <div className="empty-state" role="status"><p>{t(mode === "loading" ? "Turnirlar yuklanmoqda…" : "Turnirlar topilmadi.")}</p></div>}
      {!modal && notice && <p className="feedback" role="status">{t(notice)}</p>}
    </div>

    {selected && modal?.page === "details" && <Dialog key={selected.id} title={selected.title} close={close} busy={busy} wide>
      <div className="dialog-meta"><span>{games[selected.game]}</span><StatusBadge item={selected} /><span>{dateLabel(selected.date, locale)}</span><span>{prizeLabel(selected.prize, locale)}</span></div>
      <h3><Users size={19} /> {t("Jamoalar")} <small>{selected.teams.length}/{selected.slots}</small></h3>
      {selected.teams.length ? <div className="team-list">{selected.teams.map((team) => <span key={team.id}>{team.name}
        {canManage && team.captain && <small>{team.captain}</small>}</span>)}</div> : <p className="muted">{t("Jamoalar hali ro‘yxatdan o‘tmagan.")}</p>}
      {selected.status === "open" && <div className="dialog-actions">
        <button className="button button-primary" disabled={busy || mode === "loading" || selected.teams.length >= selected.slots} onClick={() => open({ id: selected.id, page: "join" })}>
          {t(selected.teams.length >= selected.slots ? "Joy qolmagan" : "Jamoani ro‘yxatdan o‘tkazish")}
        </button>
        {canManage && <button className="button button-quiet" title={selected.teams.length < 2 ? t("Kamida ikki jamoa kerak") : undefined} disabled={busy || selected.teams.length < 2}
          onClick={() => void update({ kind: "start", id: selected.id }, "Turnir boshlandi.")}><Swords size={17} /> {t("Turnirni boshlash")}</button>}
      </div>}
      {selected.matches.length > 0 && <Bracket item={selected} canManage={canManage} busy={busy}
        save={(match, a, b) => update({ kind: "score", id: selected.id, match, a, b }, "Natija saqlandi.")} />}
      {notice && <p className="feedback" role="status">{t(notice)}</p>}
    </Dialog>}

    {selected && modal?.page === "join" && <Dialog key={`join-${selected.id}`} title={t("Jamoani ro‘yxatdan o‘tkazish")} close={close} busy={busy}>
      <p className="muted">{selected.title} · {games[selected.game]}</p>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (await update({ kind: "join", id: selected.id, name: String(form.get("name")), captain: String(form.get("captain")) }, "Jamoa ro‘yxatdan o‘tdi.")) {
          setModal({ id: selected.id, page: "details" });
        }
      }}>
        <label>{t("Jamoa nomi")}<input name="name" required minLength={2} maxLength={32} autoComplete="organization" /></label>
        <label>{t("Sardorning o‘yin nomi")}<input name="captain" required minLength={2} maxLength={32} autoComplete="nickname" /></label>
        {notice && <p className="feedback" role="alert">{t(notice)}</p>}
        <div className="dialog-actions"><button type="button" className="button button-quiet" disabled={busy} onClick={() => open({ id: selected.id, page: "details" })}>{t("Orqaga")}</button>
          <button className="button button-primary" disabled={busy}>{t(busy ? "Saqlanmoqda…" : "Ro‘yxatdan o‘tish")}</button></div>
      </form>
    </Dialog>}

    {modal?.page === "create" && canManage && <Dialog key="create" title={t("Turnir yaratish")} close={close} busy={busy}>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const command: Command = {
          kind: "create", title: String(form.get("title")), game: form.get("game") as Game,
          date: `${form.get("date")}:00+05:00`, slots: Number(form.get("slots")), prize: Number(form.get("prize")),
        };
        if (await update(command, "Turnir yaratildi.")) {
          setModal(null);
          setQuery("");
          setFilter("all");
          setStatus("all");
        }
      }}>
        <label>{t("Turnir nomi")}<input name="title" required minLength={3} maxLength={64} /></label>
        <div className="form-grid">
          <label>{t("O‘yin")}<select name="game"><option value="cs2">Counter-Strike 2</option><option value="valorant">VALORANT</option></select></label>
          <label>{t("Joylar")}<select name="slots" defaultValue={8}>{capacities.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        <label>{t("Sana va vaqt (Toshkent)")}<input type="datetime-local" name="date" required /></label>
        <label>{t("Mukofot (so‘m)")}<input type="number" name="prize" min={0} max={1_000_000_000} step={1} defaultValue={0} required /></label>
        {notice && <p className="feedback" role="alert">{t(notice)}</p>}
        <div className="dialog-actions"><button className="button button-primary" disabled={busy}>{t(busy ? "Saqlanmoqda…" : "Turnir yaratish")}</button></div>
      </form>
    </Dialog>}

    {modal?.page === "login" && <Dialog key="login" title={t("Tashkilotchi kirishi")} close={close} busy={busy}>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (await run(async () => { await api("/api/session", send("POST", { password: form.get("password") })); await refresh(); })) close();
      }}>
        <label>{t("Tashkilotchi paroli")}<input type="password" name="password" required maxLength={256} autoComplete="current-password" /></label>
        {notice && <p className="feedback" role="alert">{t(notice)}</p>}
        <div className="dialog-actions"><button className="button button-primary" disabled={busy}>{t(busy ? "Kirilmoqda…" : "Kirish")}</button></div>
      </form>
    </Dialog>}
  </section>;
}

function StatusBadge({ item }: { item: Tournament }) {
  const { t } = useLocale();
  return <span className={`status status-${item.status}`}><i />{t(statusNames[item.status])}</span>;
}

function TournamentCard({ item, onOpen }: { item: Tournament; onOpen: () => void }) {
  const game = item.game;
  const { t, locale } = useLocale();
  return <article className={`tournament-card card-${game}`}>
    <div className="card-visual">
      <StatusBadge item={item} />
      <div className="card-game"><Crosshair size={16} /> {games[game]}</div>
    </div>
    <div className="card-body">
      <h3>{item.title}</h3>
      <div className="card-meta"><span><CalendarDays size={16} />{dateLabel(item.date, locale)}</span><span><Users size={16} />{item.teams.length}/{item.slots}</span></div>
      <div className="card-bottom"><span><Trophy size={17} /> {prizeLabel(item.prize, locale)}</span>
        <button className="button card-button" onClick={onOpen} aria-label={locale === "en" ? `${item.title} details` : `${item.title} tafsilotlari`}>{t("Tafsilot")} <ChevronRight size={16} /></button></div>
    </div>
  </article>;
}

function Dialog({ title, close, busy, wide, children }: { title: string; close: () => void; busy: boolean; wide?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={wide ? "dialog dialog-wide" : "dialog"} aria-labelledby="dialog-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) close(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !busy) close(); }}>
    <div className="dialog-inner">
      <div className="dialog-heading"><h2 id="dialog-title">{title}</h2>
        <button className="icon-button" type="button" aria-label={t("Yopish")} disabled={busy} onClick={close}><X size={21} /></button></div>
      {children}
    </div>
  </dialog>;
}

function Bracket({ item, canManage, busy, save }: {
  item: Tournament; canManage: boolean; busy: boolean; save: (match: string, a: number, b: number) => Promise<boolean>;
}) {
  const final = item.matches[item.matches.length - 1];
  const { t, locale } = useLocale();
  const teams = new Map(item.teams.map((team) => [team.id, team.name]));
  const rounds = Array.from({ length: final.round + 1 }, (_, index) => index);
  async function submit(event: FormEvent<HTMLFormElement>, match: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await save(match, Number(form.get("a")), Number(form.get("b")));
  }
  return <div className="bracket">
    <h3><GitFork size={19} /> {t("Turnir to‘ri")}</h3>
    {final.winner && <p className="champion"><Trophy size={18} /> {t("G‘olib")} · {teams.get(final.winner)}</p>}
    <div className="bracket-scroll" tabIndex={0} aria-label={t("Turnir raundlari")}>
      {rounds.map((round) => <div className="bracket-round" key={round}>
        <strong>{round === final.round ? t("Final") : locale === "en" ? `Round ${round + 1}` : `${round + 1}-raund`}</strong>
        {item.matches.filter((match) => match.round === round).map((match) => <div key={match.id} className="match">
          {[match.a, match.b].map((id, index) => <div className={id && id === match.winner ? "winner" : ""} key={index}>
            <span>{(id && teams.get(id)) || t(match.winner ? "Avtomatik o‘tish" : "Kutilmoqda")}</span><b>{match.score?.[index] ?? "–"}</b>
          </div>)}
          {canManage && match.a && match.b && !match.winner && <form className="score-form" aria-label={`${teams.get(match.a)} / ${teams.get(match.b)}`} onSubmit={(event) => void submit(event, match.id)}>
            <input name="a" aria-label={`${teams.get(match.a)} ${locale === "en" ? "score" : "hisobi"}`} type="number" min={0} max={99} required />
            <input name="b" aria-label={`${teams.get(match.b)} ${locale === "en" ? "score" : "hisobi"}`} type="number" min={0} max={99} required />
            <button className="button card-button" disabled={busy}>{t("Saqlash")}</button>
          </form>}
        </div>)}
      </div>)}
    </div>
  </div>;
}
