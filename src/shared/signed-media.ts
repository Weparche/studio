/**
 * HMAC-signed temporary media URLs for private R2 assets.
 * BytePlus retrieves these over HTTPS without interactive auth.
 */

const encoder = new TextEncoder();

export interface SignedMediaParams {
  assetId: string;
  exp: number;
  sig: string;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function buildSignedPayload(assetId: string, exp: number): string {
  return `GET\n/media/signed/${assetId}\n${exp}`;
}

export async function signMediaUrl(
  baseUrl: string,
  assetId: string,
  secret: string,
  ttlSeconds = 900,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const exp = nowSeconds + ttlSeconds;
  const payload = buildSignedPayload(assetId, exp);
  const sig = await hmacSha256Hex(secret, payload);
  const url = new URL(`/media/signed/${assetId}`, baseUrl);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("sig", sig);
  return url.toString();
}

export async function verifySignedMedia(
  assetId: string,
  expRaw: string | null,
  sig: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!expRaw || !sig) {
    return { ok: false, reason: "missing_signature" };
  }
  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) {
    return { ok: false, reason: "invalid_expiry" };
  }
  if (nowSeconds > exp) {
    return { ok: false, reason: "expired" };
  }
  const expected = await hmacSha256Hex(secret, buildSignedPayload(assetId, exp));
  if (!timingSafeEqual(expected, sig.toLowerCase())) {
    return { ok: false, reason: "invalid_signature" };
  }
  return { ok: true };
}
