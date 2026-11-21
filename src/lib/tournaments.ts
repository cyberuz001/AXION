export type Game = "cs2" | "valorant";
export type Status = "open" | "live" | "completed";

export interface Team {
  id: string;
  name: string;
  captain?: string;
}

export interface Match {
  id: string;
  round: number;
  slot: number;
  a: string | null;
  b: string | null;
  winner: string | null;
  score: [number, number] | null;
}

export interface Tournament {
  id: string;
  title: string;
  game: Game;
  status: Status;
  date: string;
  slots: number;
  prize: number;
  teams: Team[];
  matches: Match[];
}

export type Command =
  | { kind: "create"; title: string; game: Game; date: string; slots: number; prize: number }
  | { kind: "join"; id: string; name: string; captain: string }
  | { kind: "start"; id: string }
  | { kind: "score"; id: string; match: string; a: number; b: number };

export const games: Record<Game, string> = { cs2: "Counter-Strike 2", valorant: "VALORANT" };
export const statusNames: Record<Status, string> = { open: "Qabul ochiq", live: "Jonli", completed: "Yakunlangan" };
export const capacities = [4, 8, 16, 32];
const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const tashkentDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Tashkent",
});

export function dateLabel(date: string, locale: "uz" | "en" = "uz") {
  const [day, month, year] = tashkentDate.format(new Date(date)).split("/");
  if (locale === "en") return `${Number(day)} ${monthsEn[Number(month) - 1]} ${year}`;
  return `${Number(day)}-${months[Number(month) - 1]}, ${year}`;
}

export function prizeLabel(prize: number, locale: "uz" | "en" = "uz") {
  if (locale === "en") return prize > 0 ? `${prize.toLocaleString("en-US")} UZS` : "No prize";
  return prize > 0 ? String(prize).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0") + " so‘m" : "Mukofotsiz";
}

export class TournamentError extends Error {}

export function applyCommand(items: Tournament[], command: Command, id: string): Tournament[] {
  if (command.kind === "create") {
    const title = command.title.trim();
    const date = new Date(command.date);
    if (title.length < 3 || title.length > 64 || !Object.hasOwn(games, command.game) ||
        !Number.isFinite(date.getTime()) || !capacities.includes(command.slots) ||
        !Number.isInteger(command.prize) || command.prize < 0 || command.prize > 1_000_000_000) {
      throw new TournamentError("Turnir ma’lumotlarini tekshiring.");
    }
    if (items.length >= 100) throw new TournamentError("Turnirlar soni chegaraga yetdi.");
    return [{ id, title, game: command.game, date: date.toISOString(), slots: command.slots, prize: command.prize,
      status: "open", teams: [], matches: [] }, ...items];
  }

  const current = items.find((tournament) => tournament.id === command.id);
  if (!current) throw new TournamentError("Turnir topilmadi.");
  const changed = { ...current };

  if (command.kind === "join") {
    const name = command.name.trim().replace(/\s+/g, " ");
    const captain = command.captain.trim().replace(/\s+/g, " ");
    if (changed.status !== "open") throw new TournamentError("Ro‘yxatdan o‘tish yopilgan.");
    if (name.length < 2 || name.length > 32 || captain.length < 2 || captain.length > 32) {
      throw new TournamentError("Jamoa va sardor nomi 2–32 belgidan iborat bo‘lsin.");
    }
    if (changed.teams.some((team) => team.name.normalize("NFKC").toLowerCase() === name.normalize("NFKC").toLowerCase())) {
      throw new TournamentError("Bu jamoa allaqachon ro‘yxatdan o‘tgan.");
    }
    if (changed.teams.length >= changed.slots) throw new TournamentError("Bo‘sh joy qolmagan.");
    changed.teams = [...changed.teams, { id, name, captain }];
  }

  if (command.kind === "start") {
    if (changed.status !== "open" || changed.teams.length < 2) {
      throw new TournamentError("Turnirni boshlash uchun kamida ikki jamoa kerak.");
    }
    changed.matches = createBracket(changed.teams);
    changed.status = "live";
  }

  if (command.kind === "score") {
    const match = changed.matches.find((entry) => entry.id === command.match);
    if (changed.status !== "live" || !match?.a || !match.b || match.winner) {
      throw new TournamentError("Bu uchrashuv natijasini hozir kiritib bo‘lmaydi.");
    }
    if (![command.a, command.b].every((score) => Number.isInteger(score) && score >= 0 && score <= 99) || command.a === command.b) {
      throw new TournamentError("0–99 oralig‘ida turli hisoblar kiriting.");
    }
    const winner = command.a > command.b ? match.a : match.b;
    const nextId = matchId(match.round + 1, Math.floor(match.slot / 2));
    changed.matches = changed.matches.map((entry) => {
      if (entry.id === match.id) return { ...entry, winner, score: [command.a, command.b] };
      if (entry.id === nextId) return match.slot % 2 === 0 ? { ...entry, a: winner } : { ...entry, b: winner };
      return entry;
    });
    if (!changed.matches.some((entry) => entry.id === nextId)) changed.status = "completed";
  }

  return items.map((tournament) => tournament.id === current.id ? changed : tournament);
}

function matchId(round: number, slot: number) {
  return `r${round + 1}-m${slot + 1}`;
}

function createBracket(teams: Team[]): Match[] {
  const rounds = Math.ceil(Math.log2(teams.length));
  const firstRound = 2 ** (rounds - 1);
  const matches: Match[] = [];
  for (let round = 0; round < rounds; round++) {
    for (let slot = 0; slot < firstRound / 2 ** round; slot++) {
      const a = round === 0 ? teams[slot]?.id ?? null : null;
      const b = round === 0 ? teams[firstRound * 2 - 1 - slot]?.id ?? null : null;
      matches.push({ id: matchId(round, slot), round, slot, a, b, winner: a && !b ? a : null, score: null });
    }
  }
  for (const match of matches) {
    if (!match.winner) continue;
    const next = matches.find((entry) => entry.id === matchId(1, Math.floor(match.slot / 2)));
    if (next) {
      if (match.slot % 2 === 0) next.a = match.winner;
      else next.b = match.winner;
    }
  }
  return matches;
}

export function publicTournaments(items: Tournament[]): Tournament[] {
  return items.map((item) => ({ ...item, teams: item.teams.map(({ id, name }) => ({ id, name })) }));
}

function seedTeams(names: string[]) {
  return names.map((name, index) => ({ id: `team-${index + 1}`, name }));
}

export function demoTournaments(): Tournament[] {
  const liveTeams = seedTeams(["Nexus", "Qalqon", "Phantom", "Pulse"]);
  const pastTeams = seedTeams(["Sabre", "Volt", "Orbit", "Ronin"]);
  const sample: Tournament[] = [
    { id: "axion-major", title: "AXION Major", game: "cs2", status: "open", date: "2026-12-12T13:00:00.000Z",
      slots: 16, prize: 12_000_000, teams: seedTeams(["UzCore", "Redline", "Mirage Five", "Vortex", "Nomads", "Nova", "Spectre", "Recoil"]), matches: [] },
    { id: "protocol-open", title: "Protocol Open", game: "valorant", status: "open", date: "2026-12-19T13:00:00.000Z",
      slots: 16, prize: 8_000_000, teams: seedTeams(["Sentinel", "Talon", "Zero Trace", "Skyline", "Overtime"]), matches: [] },
    { id: "midnight-cup", title: "Midnight Cup", game: "cs2", status: "live", date: "2026-11-21T13:00:00.000Z",
      slots: 8, prize: 3_000_000, teams: liveTeams, matches: createBracket(liveTeams) },
    { id: "aftershock", title: "Aftershock", game: "valorant", status: "live", date: "2026-11-07T13:00:00.000Z",
      slots: 4, prize: 2_000_000, teams: pastTeams, matches: createBracket(pastTeams) },
  ];
  return [["r1-m1", 13, 7], ["r1-m2", 11, 13], ["r2-m1", 13, 9]].reduce(
    (items, [match, a, b]) => applyCommand(items, { kind: "score", id: "aftershock", match: String(match), a: Number(a), b: Number(b) }, ""),
    sample,
  );
}

export function readCommand(input: unknown): Command {
  if (!input || typeof input !== "object" || !("kind" in input)) throw new TournamentError("So‘rov noto‘g‘ri.");
  const data = input as Record<string, unknown>;
  if (data.kind === "create" && typeof data.title === "string" && (data.game === "cs2" || data.game === "valorant") &&
      typeof data.date === "string" && typeof data.slots === "number" && typeof data.prize === "number") {
    return { kind: data.kind, title: data.title, game: data.game, date: data.date, slots: data.slots, prize: data.prize };
  }
  if (typeof data.id === "string") {
    if (data.kind === "join" && typeof data.name === "string" && typeof data.captain === "string") {
      return { kind: data.kind, id: data.id, name: data.name, captain: data.captain };
    }
    if (data.kind === "start") return { kind: data.kind, id: data.id };
    if (data.kind === "score" && typeof data.match === "string" && typeof data.a === "number" && typeof data.b === "number") {
      return { kind: data.kind, id: data.id, match: data.match, a: data.a, b: data.b };
    }
  }
  throw new TournamentError("So‘rov noto‘g‘ri.");
}
