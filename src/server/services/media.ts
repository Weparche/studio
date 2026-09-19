import { signMediaUrl } from "../../shared/signed-media";
import type { Env } from "../env";
import { ALLOWED_IMAGE_MIMES, extensionForMime, MAX_IMAGE_BYTES, newId, nowIso } from "../utils";

export async function putObjectStream(
  env: Env,
  key: string,
  body: ReadableStream | ArrayBuffer | Uint8Array | string,
  contentType: string,
): Promise<void> {
  await env.MEDIA.put(key, body, {
    httpMetadata: { contentType },
  });
}

export async function archiveUrlToR2(
  env: Env,
  sourceUrl: string,
  key: string,
  contentTypeHint?: string,
): Promise<{ key: string; contentType: string; size: number }> {
  const res = await fetch(sourceUrl);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to fetch provider media (${res.status})`);
  }
  const contentType =
    contentTypeHint ||
    res.headers.get("content-type") ||
    "application/octet-stream";
  // Stream directly into R2 without buffering entire file in Worker memory
  await env.MEDIA.put(key, res.body, {
    httpMetadata: { contentType },
  });
  const head = await env.MEDIA.head(key);
  return {
    key,
    contentType,
    size: head?.size ?? 0,
  };
}

export function generationVideoKey(parts: {
  projectId: string;
  episodeId: string;
  sceneId: string;
  generationId: string;
}): string {
  return `projects/${parts.projectId}/episodes/${parts.episodeId}/scenes/${parts.sceneId}/generations/${parts.generationId}/video.mp4`;
}

export function generationLastFrameKey(parts: {
  projectId: string;
  episodeId: string;
  sceneId: string;
  generationId: string;
}): string {
  return `projects/${parts.projectId}/episodes/${parts.episodeId}/scenes/${parts.sceneId}/generations/${parts.generationId}/last-frame.jpg`;
}

export function characterAssetKey(projectId: string, characterId: string, assetId: string, ext: string): string {
  return `projects/${projectId}/characters/${characterId}/${assetId}.${ext}`;
}

export function sceneInputKey(parts: {
  projectId: string;
  episodeId: string;
  sceneId: string;
  assetId: string;
  ext: string;
}): string {
  return `projects/${parts.projectId}/episodes/${parts.episodeId}/scenes/${parts.sceneId}/inputs/${parts.assetId}.${parts.ext}`;
}

export async function createAssetFromUpload(
  env: Env,
  opts: {
    projectId?: string | null;
    file: File;
    r2Key: string;
  },
): Promise<{ id: string; r2_key: string; mime_type: string; size_bytes: number; extension: string }> {
  const mime = opts.file.type || "application/octet-stream";
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new Error(`Unsupported MIME type: ${mime}`);
  }
  if (opts.file.size > MAX_IMAGE_BYTES) {
    throw new Error(`File too large (max ${MAX_IMAGE_BYTES} bytes)`);
  }
  const id = newId("asset");
  const extension = extensionForMime(mime);
  const key = opts.r2Key.includes(".") ? opts.r2Key : `${opts.r2Key}.${extension}`;
  await env.MEDIA.put(key, opts.file.stream(), {
    httpMetadata: { contentType: mime },
  });
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO assets (id, project_id, kind, mime_type, extension, size_bytes, r2_key, width, height, sha256, original_filename, created_at, updated_at)
     VALUES (?, ?, 'image', ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)`,
  )
    .bind(
      id,
      opts.projectId ?? null,
      mime,
      extension,
      opts.file.size,
      key,
      opts.file.name || null,
      now,
      now,
    )
    .run();
  return { id, r2_key: key, mime_type: mime, size_bytes: opts.file.size, extension };
}

export async function getSignedAssetUrl(
  env: Env,
  requestUrl: string,
  assetId: string,
  ttlSeconds = 900,
): Promise<string> {
  if (!env.MEDIA_SIGNING_SECRET) {
    throw new Error("MEDIA_SIGNING_SECRET is not configured");
  }
  const origin = new URL(requestUrl).origin;
  return signMediaUrl(origin, assetId, env.MEDIA_SIGNING_SECRET, ttlSeconds);
}
