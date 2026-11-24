"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronRight, Crosshair, GitFork, LockKeyhole, Pencil, Plus, Search, Swords, Trash2, Trophy, Users, X } from "lucide-react";
import { applyCommand, capacities, games, prizeLabel, startLabel, statusNames, type Command, type Game, type Tournament } from "@/lib/tournaments";
import ScrollReveal from "./react-bits/ScrollReveal";
import BlurText from "./react-bits/BlurText";
import GlareHover from "./react-bits/GlareHover";
import FadeContent from "./react-bits/FadeContent";
import { useLocale } from "./locale";
import { OptionSelect } from "./option-select";
import { isCompactViewport } from "./viewport-experience";

type View = "preview" | "directory" | "dashboard" | "schedule";
type Mode = "demo" | "shared" | "loading";
type Filter = Game | "all";
type Notice = { kind: "success" | "error"; message: string; match?: string };
type Modal =
  | { id: string; page: "details" | "join" | "edit" }
  | { id: string; page: "delete"; title: string }
  | { page: "create" | "login" };
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
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...options });
  } catch {
    throw new Error("Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data === null) throw new Error(data?.error ?? "So‘rov bajarilmadi.");
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
  const [notice, setNotice] = useState<Notice | null>(null);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const dashboard = view === "dashboard";
  const preview = view === "preview";
  const schedule = view === "schedule";

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
    if (isCompactViewport() !== schedule) return;
    void refresh();
    const sync = (event: StorageEvent) => { if (event.key === storageKey) void refresh(); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [refresh, schedule]);

  async function run(task: () => Promise<void>, match?: string): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setNotice(null);
    try {
      await task();
      return true;
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Amal bajarilmadi.", match });
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
      setNotice({ kind: "success", message });
    }, command.kind === "score" ? command.match : undefined);
  }

  function open(next: Modal) {
    setNotice(null);
    setModal(next);
  }

  function close() {
    setModal(null);
    setNotice(null);
  }

  const selected = modal && "id" in modal ? items.find(({ id }) => id === modal.id) : undefined;
  const canManage = dashboard && (organizer || mode === "demo");
  const visible = items.filter((item) => (filter === "all" || item.game === filter) &&
    (status === "all" || item.status === status) && item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const cards = preview ? visible.slice(0, 3) : visible;

  if (schedule) {
    const chronological = [...items].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    return <section className="compact-schedule" aria-labelledby="schedule-title">
      <p className="compact-wordmark">AXION</p>
      <h1 id="schedule-title">{t("Turnir jadvali")}</h1>
      <p className="compact-reason">{t("Video va scroll sahnalari katta ekran uchun moslangan. Telefonda turnir jadvali ochiladi.")}</p>
      {failure ? <div className="compact-message" role="alert">
        <p>{t(failure)}</p><button className="button button-quiet" onClick={() => void refresh()}>{t("Qayta yuklash")}</button>
      </div> : chronological.length ? <ul className="compact-events" aria-label={t("Turnir jadvali")}>
        {chronological.map((item) => <li key={item.id}>
          <h2>{item.title}</h2>
          <time dateTime={item.date}>{startLabel(item.date, locale)}</time>
          <p>{item.teams.length ? item.teams.map(({ name }) => name).join(" · ") : t("Jamoalar hali ro‘yxatdan o‘tmagan.")}</p>
        </li>)}
      </ul> : <p className="compact-message" role="status">{t(mode === "loading" ? "Turnirlar yuklanmoqda…" : "Turnirlar topilmadi.")}</p>}
    </section>;
  }

  return <section id={preview ? "turnirlar" : undefined} className={preview ? "tournaments-section" : "tournaments-section standalone"}>
    <div className="shell">
      <div className="section-heading">
        <div>
          {preview ? <h2 className="section-title"><ScrollReveal mode="enter" effect="rise" baseRotation={0}>{t("TURNIRLAR.")}</ScrollReveal></h2> :
            <h1 className="section-title"><BlurText key={locale}
              text={t(dashboard ? "BOSHQARUV." : "TURNIRLAR.")} trigger="load" stepDuration={0.17} distance={11} blur={7} /></h1>}
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
            <input type="search" placeholder={t("Qidirish")} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <OptionSelect label={t("Turnir holati")} value={status} onValueChange={setStatus} options={[
            { value: "all", label: t("Barcha holatlar") },
            ...Object.entries(statusNames).map(([value, label]) => ({ value, label: t(label) })),
          ]} />
        </div>
      </div>}

      {failure ? <div className="empty-state" role="alert"><p>{t(failure)}</p><button className="button button-quiet" onClick={() => void refresh()}>{t("Qayta yuklash")}</button></div> :
        cards.length ? <div className="tournament-grid">
          {cards.map((item) => <TournamentCard key={item.id} item={item}
            onOpen={() => open({ id: item.id, page: "details" })}
            onEdit={canManage ? () => open({ id: item.id, page: "edit" }) : undefined}
            onDelete={canManage ? () => open({ id: item.id, page: "delete", title: item.title }) : undefined} />)}
        </div> : <FadeContent className="empty-state" trigger="mount" effect="focus" duration={0.22} role="status">
          <p>{t(mode === "loading" ? "Turnirlar yuklanmoqda…" : "Turnirlar topilmadi.")}</p>
        </FadeContent>}
      {!modal && <Feedback notice={notice} />}
    </div>

    {selected && modal?.page === "details" && <Dialog key={selected.id} title={selected.title} close={close} busy={busy} wide>
      <div className="dialog-meta"><span>{games[selected.game]}</span><StatusBadge item={selected} />
        <time dateTime={selected.date}>{startLabel(selected.date, locale)}</time><span>{prizeLabel(selected.prize, locale)}</span></div>
      {!notice?.match && <Feedback notice={notice} />}
      <h3><Users size={19} /> {t("Jamoalar")} <small>{selected.teams.length}/{selected.slots}</small></h3>
      {selected.teams.length ? <div className="team-list">{selected.teams.map((team) => <span key={team.id}>{team.name}
        {canManage && team.captain && <small>{team.captain}</small>}</span>)}</div> : <p className="muted">{t("Jamoalar hali ro‘yxatdan o‘tmagan.")}</p>}
      {selected.status === "open" && <div className="dialog-actions">
        <button className="button button-primary" disabled={busy || mode === "loading" || selected.teams.length >= selected.slots} onClick={() => open({ id: selected.id, page: "join" })}>
          {t(selected.teams.length >= selected.slots ? "Joy qolmagan" : "Jamoani ro‘yxatdan o‘tkazish")}
        </button>
        {canManage && <button className="button button-quiet" aria-describedby={selected.teams.length < 2 ? "start-tournament-help" : undefined} disabled={busy || selected.teams.length < 2}
          onClick={() => void update({ kind: "start", id: selected.id }, "Turnir boshlandi.")}><Swords size={17} /> {t("Turnirni boshlash")}</button>}
      </div>}
      {canManage && selected.status === "open" && selected.teams.length < 2 &&
        <p className="muted" id="start-tournament-help">{t("Turnirni boshlash uchun kamida ikki jamoa kerak.")}</p>}
      {selected.matches.length > 0 && <Bracket item={selected} canManage={canManage} busy={busy} notice={notice}
        save={(match, a, b) => update({ kind: "score", id: selected.id, match, a, b }, "Natija saqlandi.")} />}
      {canManage && <div className="manage-actions">
        <button className="button button-quiet" type="button" disabled={busy} onClick={() => open({ id: selected.id, page: "edit" })}><Pencil size={16} />{t("Tahrirlash")}</button>
        <button className="button button-quiet button-remove" type="button" disabled={busy}
          onClick={() => open({ id: selected.id, page: "delete", title: selected.title })}><Trash2 size={16} />{t("O‘chirish")}</button>
      </div>}
    </Dialog>}

    {selected && modal?.page === "join" && <Dialog key={`join-${selected.id}`} title={t("Jamoani ro‘yxatdan o‘tkazish")} close={close} busy={busy}>
      <p className="muted">{selected.title} · {games[selected.game]} · <time dateTime={selected.date}>{startLabel(selected.date, locale)}</time></p>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (await update({ kind: "join", id: selected.id, name: String(form.get("name")), captain: String(form.get("captain")) }, "Jamoa ro‘yxatdan o‘tdi.")) {
          setModal({ id: selected.id, page: "details" });
        }
      }}>
        <label>{t("Jamoa nomi")}<input name="name" required minLength={2} maxLength={32} autoComplete="organization" autoFocus /></label>
        <label>{t("Sardorning o‘yin nomi")}<input name="captain" required minLength={2} maxLength={32} autoComplete="nickname" /></label>
        <Feedback notice={notice} />
        <div className="dialog-actions"><button type="button" className="button button-quiet" disabled={busy} onClick={() => open({ id: selected.id, page: "details" })}>{t("Orqaga")}</button>
          <button className="button button-primary" disabled={busy}>{t(busy ? "Saqlanmoqda…" : "Ro‘yxatdan o‘tish")}</button></div>
      </form>
    </Dialog>}

    {canManage && (modal?.page === "create" || (modal?.page === "edit" && selected)) &&
      <Dialog key={selected?.id ? `edit-${selected.id}` : "create"} title={t(selected ? "Turnirni tahrirlash" : "Turnir yaratish")} close={close} busy={busy}>
      <TournamentForm item={selected} notice={notice} busy={busy} submit={async (command) => {
        if (!await update(command, selected ? "Turnir yangilandi." : "Turnir yaratildi.")) return;
        setModal(null);
        setQuery("");
        setFilter("all");
        setStatus("all");
      }} />
    </Dialog>}

    {canManage && selected && modal?.page === "delete" &&
      <Dialog key={`delete-${selected.id}`} title={t("Turnirni o‘chirish")} close={close} busy={busy}>
        <p className="delete-name">{selected.title}</p>
        <p className="muted">{t("Turnir, jamoalar va natijalar o‘chiriladi.")}</p>
        <Feedback notice={notice} />
        <div className="dialog-actions">
          <button className="button button-quiet" type="button" autoFocus disabled={busy} onClick={close}>{t("Bekor qilish")}</button>
          <button className="button button-danger" type="button" disabled={busy} onClick={async () => {
            if (await update({ kind: "delete", id: selected.id, title: modal.title }, "Turnir o‘chirildi.")) setModal(null);
          }}><Trash2 size={16} />{t(busy ? "O‘chirilmoqda…" : "O‘chirish")}</button>
        </div>
      </Dialog>}

    {modal?.page === "login" && <Dialog key="login" title={t("Tashkilotchi kirishi")} close={close} busy={busy}>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (await run(async () => { await api("/api/session", send("POST", { password: form.get("password") })); await refresh(); })) close();
      }}>
        <label>{t("Tashkilotchi paroli")}<input type="password" name="password" required maxLength={256} autoComplete="current-password" /></label>
        <Feedback notice={notice} />
        <div className="dialog-actions"><button className="button button-primary" disabled={busy}>{t(busy ? "Kirilmoqda…" : "Kirish")}</button></div>
      </form>
    </Dialog>}
  </section>;
}

function Feedback({ notice }: { notice: Notice | null }) {
  const { t } = useLocale();
  if (!notice) return null;
  const error = notice.kind === "error";
  return <p className={`feedback${error ? " feedback-error" : ""}`} role={error ? "alert" : "status"}>{t(notice.message)}</p>;
}

function TournamentForm({ item, notice, busy, submit }: {
  item?: Tournament; notice: Notice | null; busy: boolean; submit: (command: Command) => Promise<void>;
}) {
  const { t } = useLocale();
  const [game, setGame] = useState<Game>(item?.game ?? "cs2");
  const [slots, setSlots] = useState(String(item?.slots ?? 8));
  const startDate = item ? new Date(Date.parse(item.date) + 5 * 60 * 60 * 1000).toISOString().slice(0, 16) : "";
  return <form onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = { title: String(form.get("title")), game, date: `${form.get("date")}:00+05:00`,
      slots: Number(slots), prize: Number(form.get("prize")) };
    void submit(item ? { kind: "edit", id: item.id, ...fields } : { kind: "create", ...fields });
  }}>
    <label>{t("Turnir nomi")}<input name="title" defaultValue={item?.title} required minLength={3} maxLength={64} /></label>
    <div className="form-grid">
      <div className="option-field"><span>{t("O‘yin")}</span><OptionSelect inline align="start" label={t("O‘yin")} value={game}
        onValueChange={(value) => setGame(value as Game)} disabled={Boolean(item && (item.status !== "open" || item.teams.length))}
        options={Object.entries(games).map(([value, label]) => ({ value, label }))} /></div>
      <div className="option-field"><span>{t("Joylar")}</span><OptionSelect inline align="start" label={t("Joylar")} value={slots}
        onValueChange={setSlots} disabled={item && item.status !== "open"}
        options={capacities.map((value) => ({ value: String(value), label: String(value), disabled: value < (item?.teams.length ?? 0) }))} /></div>
    </div>
    <label>{t("Sana va vaqt (Toshkent)")}<input type="datetime-local" name="date" defaultValue={startDate} required /></label>
    <label>{t("Mukofot (so‘m)")}<input type="number" name="prize" min={0} max={1_000_000_000} step={1} defaultValue={item?.prize ?? 0} required /></label>
    <Feedback notice={notice} />
    <div className="dialog-actions"><button className="button button-primary" disabled={busy}>{t(busy ? "Saqlanmoqda…" : item ? "Saqlash" : "Turnir yaratish")}</button></div>
  </form>;
}

function StatusBadge({ item }: { item: Tournament }) {
  const { t } = useLocale();
  return <span className={`status status-${item.status}`}><i />{t(statusNames[item.status])}</span>;
}

function TournamentCard({ item, onOpen, onEdit, onDelete }: {
  item: Tournament; onOpen: () => void; onEdit?: () => void; onDelete?: () => void;
}) {
  const game = item.game;
  const { t, locale } = useLocale();
  return <article className={`tournament-card card-${game}`}>
    <GlareHover className="card-visual" height="auto" width="100%" background="transparent" borderColor="transparent"
      borderRadius="0" glareOpacity={0.18} glareSize={212} transitionDuration={580} variant="sheen">
      <StatusBadge item={item} />
      <div className="card-game"><Crosshair size={16} /> {games[game]}</div>
    </GlareHover>
    <div className="card-body">
      <h3>{item.title}</h3>
      <div className="card-meta"><span><CalendarDays size={16} /><time dateTime={item.date}>{startLabel(item.date, locale)}</time></span>
        <span><Users size={16} />{item.teams.length}/{item.slots}</span></div>
      <div className="card-bottom"><span><Trophy size={17} /> {prizeLabel(item.prize, locale)}</span>
        <button className="button card-button" onClick={onOpen} aria-label={locale === "en" ? `${item.title} details` : `${item.title} tafsilotlari`}>{t("Tafsilot")} <ChevronRight size={16} /></button></div>
      {onEdit && <div className="card-management">
        <button className="button" type="button" onClick={onEdit}><Pencil size={15} />{t("Tahrirlash")}</button>
        <button className="button button-remove" type="button" onClick={onDelete}><Trash2 size={15} />{t("O‘chirish")}</button>
      </div>}
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

function Bracket({ item, canManage, busy, notice, save }: {
  item: Tournament; canManage: boolean; busy: boolean; notice: Notice | null; save: (match: string, a: number, b: number) => Promise<boolean>;
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
          {notice?.match === match.id && <Feedback notice={notice} />}
        </div>)}
      </div>)}
    </div>
  </div>;
}
