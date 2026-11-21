import { NextResponse } from "next/server";
import { createSession, mode, passwordMatches, rateLimit, sameOrigin, sessionAge, sessionCookie } from "@/lib/server";

const options = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } as const;

export async function POST(request: Request) {
  if (mode !== "shared" || !sameOrigin(request)) return NextResponse.json({ error: "Kirish imkonsiz." }, { status: 403 });
  try {
    if (await rateLimit(request, "login", 6)) {
      return NextResponse.json({ error: "Bir daqiqadan keyin qayta urinib ko‘ring." }, { status: 429 });
    }
    const body = await request.text();
    if (body.length > 1024 || !passwordMatches(JSON.parse(body)?.password)) {
      return NextResponse.json({ error: "Parol noto‘g‘ri." }, { status: 401 });
    }
    const response = NextResponse.json({ organizer: true });
    response.cookies.set(sessionCookie, createSession(), { ...options, maxAge: sessionAge });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Kirishda xatolik. Qayta urinib ko‘ring." }, { status: error instanceof SyntaxError ? 400 : 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "So‘rovga ruxsat yo‘q." }, { status: 403 });
  const response = NextResponse.json({ organizer: false });
  response.cookies.set(sessionCookie, "", { ...options, maxAge: 0 });
  return response;
}
