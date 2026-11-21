import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { BlobNotFoundError, BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { applyCommand, TournamentError, type Command, type Tournament } from "./tournaments";

const token = process.env.BLOB_READ_WRITE_TOKEN;
const password = process.env.AXION_ADMIN_PASSWORD ?? "";
const secret = process.env.AXION_SESSION_SECRET ?? "";
export const mode = token && password.length >= 16 && secret.length >= 32
  ? "shared" : token || password || secret ? "unavailable" : "demo";
const storageKey = "axion/tournaments-v1.json";
export const sessionCookie = "axion_organizer";
export const sessionAge = 60 * 60 * 8;

export async function listTournaments(): Promise<Tournament[]> {
  return (await readBlob<Tournament[]>(storageKey))?.value ?? [];
}

async function readBlob<T>(key: string) {
  try {
    const found = await get(key, { access: "private", useCache: false });
    if (!found || found.statusCode !== 200) return null;
    const value = await new Response(found.stream).json() as T;
    return { value, etag: found.blob.etag };
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

async function writeBlob(key: string, value: unknown, etag?: string, ttlDays?: number) {
  try {
    await put(key, JSON.stringify(value), {
      access: "private", contentType: "application/json", addRandomSuffix: false,
      allowOverwrite: Boolean(etag), ifMatch: etag, ttlDays,
    });
    return true;
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || (!etag && await readBlob(key))) return false;
    throw error;
  }
}

export async function mutate(command: Command) {
  if (mode !== "shared") throw new Error("Storage unavailable");
  const id = randomUUID();
  for (let attempt = 0; attempt < 6; attempt++) {
    const before = await readBlob<Tournament[]>(storageKey);
    const after = applyCommand(before?.value ?? [], command, id);
    if (await writeBlob(storageKey, after, before?.etag)) return after;
  }
  throw new TournamentError("Ma’lumot yangilandi. Qayta urinib ko‘ring.");
}

function sign(value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordMatches(value: unknown) {
  return mode === "shared" && typeof value === "string" && value.length <= 256 && equal(sign(value), sign(password));
}

export function createSession() {
  const payload = `${Math.floor(Date.now() / 1000) + sessionAge}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign(`${payload}.${password}`)}`;
}

export function isOrganizer(cookie: string | undefined) {
  if (mode !== "shared" || !cookie) return false;
  const [expires, nonce, signature] = cookie.split(".");
  return !!signature && /^\d+$/.test(expires) && /^[a-f0-9]{32}$/.test(nonce ?? "") &&
    Number(expires) > Date.now() / 1000 && equal(signature, sign(`${expires}.${nonce}.${password}`));
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin === null || origin === new URL(request.url).origin) return true;
  try {
    return request.headers.get("sec-fetch-site") === "same-origin" && new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function rateLimit(request: Request, bucket: string, limit: number) {
  if (mode !== "shared") return false;
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `axion/limits/${bucket}/${Math.floor(Date.now() / 60_000)}-${sign(ip).slice(0, 24)}.json`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const before = await readBlob<number>(key);
    const count = before?.value ?? 0;
    if (count >= limit) return true;
    if (await writeBlob(key, count + 1, before?.etag, 1)) return false;
  }
  return true;
}
