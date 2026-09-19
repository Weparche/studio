export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "project";
}

export function jsonBool(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

export function toDbBool(value: boolean): number {
  return value ? 1 : 0;
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "audio/mpeg":
      return "mp3";
    case "audio/wav":
      return "wav";
    default:
      return "bin";
  }
}

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function backoffSeconds(attempts: number): number {
  const base = Math.min(120, 5 * Math.pow(1.6, Math.max(0, attempts)));
  return Math.round(base);
}
