import type { Context, Next } from "hono";
import type { Env } from "./env";

const SESSION_COOKIE = "nepar_studio_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type AppVariables = {
  authenticated: boolean;
};

export type AppEnv = {
  Bindings: Env;
  Variables: AppVariables;
};

const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function authConfigured(env: Env): boolean {
  return Boolean(env.STUDIO_PASSWORD && env.SESSION_SECRET);
}

export async function createSessionToken(env: Env): Promise<{ token: string; expiresAt: string }> {
  if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET missing");
  const id = crypto.randomUUID();
  const expiresAtMs = Date.now() + SESSION_TTL_SECONDS * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();
  const payload = `${id}.${expiresAtMs}`;
  const sig = await hmacSign(env.SESSION_SECRET, payload);
  const token = `${payload}.${sig}`;
  const tokenHash = await sha256Hex(token);
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO sessions (id, token_hash, created_at, expires_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, tokenHash, now, expiresAt, now)
    .run();
  return { token, expiresAt };
}

export async function destroySession(env: Env, token: string | undefined): Promise<void> {
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(tokenHash).run();
}

export async function validateSession(env: Env, token: string | undefined): Promise<boolean> {
  if (!token || !env.SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [id, expRaw, sig] = parts;
  const expected = await hmacSign(env.SESSION_SECRET, `${id}.${expRaw}`);
  if (!timingSafeEqual(expected, sig)) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT id, expires_at FROM sessions WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<{ id: string; expires_at: string }>();
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(row.id).run();
    return false;
  }
  await env.DB.prepare(`UPDATE sessions SET last_seen_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), row.id)
    .run();
  return true;
}

export async function verifyPassword(env: Env, password: string): Promise<boolean> {
  if (!env.STUDIO_PASSWORD) return false;
  return timingSafeEqual(password, env.STUDIO_PASSWORD);
}

export function sessionCookieHeader(token: string, expiresAt: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getSessionTokenFromRequest(c: Context<AppEnv>): string | undefined {
  const cookies = parseCookies(c.req.header("cookie"));
  return cookies[SESSION_COOKIE];
}

/** Signed media route is intentionally public (HMAC is the auth). */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/api/health" ||
    pathname === "/api/auth/status" ||
    pathname === "/api/auth/login" ||
    pathname.startsWith("/media/signed/")
  );
}

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const path = new URL(c.req.url).pathname;
  if (isPublicPath(path)) {
    return next();
  }

  // If password auth is not configured, allow (Cloudflare Access may protect the zone).
  if (!authConfigured(c.env)) {
    c.set("authenticated", true);
    return next();
  }

  const token = getSessionTokenFromRequest(c);
  const ok = await validateSession(c.env, token);
  if (!ok) {
    if (path.startsWith("/api/") || path.startsWith("/media/")) {
      return c.json({ error: "unauthorized", message: "Authentication required" }, 401);
    }
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("authenticated", true);
  return next();
}
