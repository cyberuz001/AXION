import { NextRequest, NextResponse } from "next/server";
import { isOrganizer, listTournaments, mode, mutate, rateLimit, sameOrigin, sessionCookie } from "@/lib/server";
import { demoTournaments, publicTournaments, readCommand, TournamentError } from "@/lib/tournaments";

const unavailable = () => NextResponse.json({ error: "Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring." }, { status: 503 });

export async function GET(request: NextRequest) {
  try {
    if (mode === "unavailable") return unavailable();
    const organizer = isOrganizer(request.cookies.get(sessionCookie)?.value);
    const tournaments = mode === "demo" ? demoTournaments() : await listTournaments();
    return NextResponse.json({ mode, organizer, items: organizer ? tournaments : publicTournaments(tournaments) },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  if (mode !== "shared") return unavailable();
  if (!sameOrigin(request)) return NextResponse.json({ error: "So‘rovga ruxsat yo‘q." }, { status: 403 });
  try {
    const organizer = isOrganizer(request.cookies.get(sessionCookie)?.value);
    if (Number(request.headers.get("content-length")) > 4096) {
      return NextResponse.json({ error: "So‘rov juda katta." }, { status: 413 });
    }
    const body = await request.text();
    if (body.length > 4096) return NextResponse.json({ error: "So‘rov juda katta." }, { status: 413 });
    const command = readCommand(JSON.parse(body));
    if (!organizer && command.kind !== "join") {
      return NextResponse.json({ error: "Tashkilotchi sifatida kiring." }, { status: 401 });
    }
    if (!organizer && await rateLimit(request, "join", 12)) {
      return NextResponse.json({ error: "Bir daqiqadan keyin qayta urinib ko‘ring." }, { status: 429 });
    }
    const items = await mutate(command);
    return NextResponse.json({ items: organizer ? items : publicTournaments(items) },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TournamentError || error instanceof SyntaxError) {
      return NextResponse.json({ error: error instanceof TournamentError ? error.message : "So‘rov noto‘g‘ri." }, { status: 400 });
    }
    return unavailable();
  }
}
