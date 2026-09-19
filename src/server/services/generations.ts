import type { AspectRatio, GenerationMode, Resolution } from "../../shared/types";
import { BytePlusApiError, createBytePlusProvider } from "../providers/byteplus-seedance";
import type { Env } from "../env";
import { backoffSeconds, jsonBool, newId, nowIso, toDbBool } from "../utils";
import {
  archiveUrlToR2,
  generationLastFrameKey,
  generationVideoKey,
  getSignedAssetUrl,
} from "./media";
import { checkBudgetGuards, estimateGenerationCost } from "./pricing-service";

export interface SubmitGenerationBody {
  sceneId: string;
  mode: GenerationMode;
  prompt?: string;
  duration: number;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  generateAudio: boolean;
  returnLastFrame: boolean;
  firstFrameAssetId?: string | null;
  lastFrameAssetId?: string | null;
  references?: Array<{
    assetId: string;
    characterId?: string | null;
    label?: string;
  }>;
  idempotencyKey?: string;
  seed?: number;
}

async function getSceneContext(db: D1Database, sceneId: string) {
  return db
    .prepare(
      `SELECT s.*, e.id AS episode_id, e.project_id AS project_id, e.name AS episode_name,
              p.name AS project_name
       FROM scenes s
       JOIN episodes e ON e.id = s.episode_id
       JOIN projects p ON p.id = e.project_id
       WHERE s.id = ?`,
    )
    .bind(sceneId)
    .first<{
      id: string;
      episode_id: string;
      project_id: string;
      title: string;
      working_prompt: string;
    }>();
}

export async function submitGeneration(
  env: Env,
  requestUrl: string,
  body: SubmitGenerationBody,
) {
  if (body.idempotencyKey) {
    const existing = await env.DB.prepare(
      `SELECT * FROM generations WHERE idempotency_key = ?`,
    )
      .bind(body.idempotencyKey)
      .first();
    if (existing) return { generation: mapGeneration(existing), reused: true as const };
  }

  const scene = await getSceneContext(env.DB, body.sceneId);
  if (!scene) throw new HttpError(404, "Scene not found");

  const provider = createBytePlusProvider(env);
  if (!provider) {
    throw new HttpError(503, "BytePlus setup required", "provider_not_configured");
  }

  const hasVideoInput = false;
  const estimate = estimateGenerationCost(env, {
    resolution: body.resolution,
    duration: body.duration,
    hasVideoInput,
  });

  const budget = await checkBudgetGuards(env, estimate.estimatedCostUsd);
  if (!budget.ok) {
    throw new HttpError(402, budget.message, "budget_exceeded");
  }

  const refs = body.references ?? [];
  const signedRefs = [];
  for (let i = 0; i < refs.length; i += 1) {
    const ref = refs[i];
    const url = await getSignedAssetUrl(env, requestUrl, ref.assetId);
    signedRefs.push({
      assetId: ref.assetId,
      role: "reference_image" as const,
      tag: `@image${i + 1}`,
      sortOrder: i,
      characterId: ref.characterId ?? null,
      label: ref.label ?? "",
      url,
    });
  }

  let firstFrame = null;
  if (body.firstFrameAssetId) {
    firstFrame = {
      assetId: body.firstFrameAssetId,
      role: "first_frame" as const,
      tag: "@image_first",
      sortOrder: 0,
      url: await getSignedAssetUrl(env, requestUrl, body.firstFrameAssetId),
    };
  }
  let lastFrame = null;
  if (body.lastFrameAssetId) {
    lastFrame = {
      assetId: body.lastFrameAssetId,
      role: "last_frame" as const,
      tag: "@image_last",
      sortOrder: 0,
      url: await getSignedAssetUrl(env, requestUrl, body.lastFrameAssetId),
    };
  }

  const id = newId("gen");
  const now = nowIso();

  let providerTaskId: string | null = null;
  let providerStatus: string | null = "queued";
  let status: string = "queued";
  let errorCode: string | null = null;
  let errorMessage: string | null = null;
  let startedAt: string | null = null;

  try {
    const created = await provider.createGeneration({
      prompt: body.prompt ?? "",
      mode: body.mode,
      firstFrame,
      lastFrame,
      references: signedRefs,
      duration: body.duration,
      resolution: body.resolution,
      aspectRatio: body.aspectRatio,
      generateAudio: body.generateAudio,
      returnLastFrame: body.returnLastFrame,
      watermark: false,
      seed: body.seed,
    });
    providerTaskId = created.providerTaskId;
    providerStatus = created.providerStatus;
    status = "queued";
    startedAt = now;
  } catch (err) {
    if (err instanceof BytePlusApiError && err.isFundingError()) {
      throw new HttpError(402, "BytePlus account requires funding.", "funding_required");
    }
    if (err instanceof BytePlusApiError) {
      status = "failed";
      errorCode = err.code;
      errorMessage = err.message;
    } else {
      throw err;
    }
  }

  await env.DB.prepare(
    `INSERT INTO generations (
      id, scene_id, provider, provider_task_id, model, mode, prompt, duration, resolution,
      aspect_ratio, generate_audio, return_last_frame, watermark, status, provider_status, seed,
      first_frame_asset_id, last_frame_asset_id, billing_mode, has_video_input,
      estimated_cost_usd, confirmed_cost_usd, error_code, error_message, is_favorite, archived,
      idempotency_key, poll_attempts, next_poll_at, created_at, started_at, completed_at, updated_at
    ) VALUES (?, ?, 'byteplus', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 0, 0, ?, 0, ?, ?, ?, NULL, ?)`,
  )
    .bind(
      id,
      body.sceneId,
      providerTaskId,
      env.BYTEPLUS_MODEL,
      body.mode,
      body.prompt ?? "",
      body.duration,
      body.resolution,
      body.aspectRatio,
      toDbBool(body.generateAudio),
      toDbBool(body.returnLastFrame),
      status,
      providerStatus,
      body.seed ?? null,
      body.firstFrameAssetId ?? null,
      body.lastFrameAssetId ?? null,
      env.BYTEPLUS_BILLING_MODE || "MODELARK_TOKEN",
      toDbBool(hasVideoInput),
      estimate.estimatedCostUsd,
      errorCode,
      errorMessage,
      body.idempotencyKey ?? null,
      status === "queued" || status === "running" ? now : null,
      now,
      startedAt,
      now,
    )
    .run();

  for (const ref of signedRefs) {
    await env.DB.prepare(
      `INSERT INTO generation_references (id, generation_id, asset_id, role, tag, sort_order, character_id, label, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        newId("gref"),
        id,
        ref.assetId,
        ref.role,
        ref.tag,
        ref.sortOrder,
        ref.characterId,
        ref.label,
        now,
      )
      .run();
  }

  const row = await env.DB.prepare(`SELECT * FROM generations WHERE id = ?`).bind(id).first();
  return { generation: mapGeneration(row!), reused: false as const };
}

export async function pollGeneration(env: Env, generationId: string, requestUrl?: string) {
  const row = await env.DB.prepare(`SELECT * FROM generations WHERE id = ?`)
    .bind(generationId)
    .first<Record<string, unknown>>();
  if (!row) return null;
  if (!["queued", "running"].includes(String(row.status))) {
    return mapGeneration(row);
  }
  if (!row.provider_task_id) return mapGeneration(row);

  const provider = createBytePlusProvider(env);
  if (!provider) return mapGeneration(row);

  const status = await provider.getGenerationStatus(String(row.provider_task_id));
  const now = nowIso();
  const attempts = Number(row.poll_attempts ?? 0) + 1;
  const nextPoll = new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString();

  let r2VideoKey = row.r2_video_key as string | null;
  let r2LastFrameKey = row.r2_last_frame_key as string | null;
  let archived = Number(row.archived ?? 0);
  let confirmedCost = row.confirmed_cost_usd as number | null;
  let videoTokens = row.video_tokens as number | null;
  let estimatedCost = row.estimated_cost_usd as number | null;
  let completedAt = row.completed_at as string | null;
  let providerUsageJson = row.provider_usage_json as string | null;

  if (status.status === "succeeded" && status.videoUrl && !r2VideoKey) {
    const scene = await getSceneContext(env.DB, String(row.scene_id));
    if (scene) {
      const videoKey = generationVideoKey({
        projectId: scene.project_id,
        episodeId: scene.episode_id,
        sceneId: scene.id,
        generationId,
      });
      await archiveUrlToR2(env, status.videoUrl, videoKey, "video/mp4");
      r2VideoKey = videoKey;
      archived = 1;

      if (status.lastFrameUrl) {
        const frameKey = generationLastFrameKey({
          projectId: scene.project_id,
          episodeId: scene.episode_id,
          sceneId: scene.id,
          generationId,
        });
        await archiveUrlToR2(env, status.lastFrameUrl, frameKey, "image/jpeg");
        r2LastFrameKey = frameKey;

        // Persist last frame as an asset for continuity
        const assetId = newId("asset");
        await env.DB.prepare(
          `INSERT INTO assets (id, project_id, kind, mime_type, extension, size_bytes, r2_key, width, height, sha256, original_filename, created_at, updated_at)
           VALUES (?, ?, 'image', 'image/jpeg', 'jpg', 0, ?, NULL, NULL, NULL, 'last-frame.jpg', ?, ?)`,
        )
          .bind(assetId, scene.project_id, frameKey, now, now)
          .run();
        // Store asset id in settings-like field via generation_references label marker
        await env.DB.prepare(
          `UPDATE generations SET last_frame_asset_id = COALESCE(last_frame_asset_id, ?) WHERE id = ? AND (last_frame_asset_id IS NULL OR last_frame_asset_id = '')`,
        )
          .bind(assetId, generationId)
          .run();
        // Actually we want generated last frame separately — store via provider_usage_json side channel and r2 key
        await env.DB.prepare(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
          .bind(`gen_last_frame_asset:${generationId}`, assetId, now)
          .run();
      }
    }

    if (status.usage?.completionTokens) {
      const cost = estimateGenerationCost(env, {
        resolution: String(row.resolution) as Resolution,
        duration: Number(row.duration),
        hasVideoInput: jsonBool(row.has_video_input as number),
        completionTokens: status.usage.completionTokens,
      });
      videoTokens = cost.videoTokens;
      confirmedCost = cost.confirmedCostUsd;
      estimatedCost = cost.estimatedCostUsd;
      providerUsageJson = JSON.stringify(status.usage.raw ?? status.usage);
      await env.DB.prepare(
        `INSERT INTO provider_usage (id, generation_id, provider, billing_mode, resolution, duration, has_video_input, video_tokens, estimated_cost_usd, confirmed_cost_usd, provider_usage_json, created_at)
         VALUES (?, ?, 'byteplus', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          newId("usage"),
          generationId,
          String(row.billing_mode),
          String(row.resolution),
          Number(row.duration),
          toDbBool(jsonBool(row.has_video_input as number)),
          videoTokens,
          estimatedCost,
          confirmedCost,
          providerUsageJson,
          now,
        )
        .run();
    }
    completedAt = now;
  }

  if (status.status === "failed" || status.status === "expired" || status.status === "cancelled") {
    completedAt = now;
  }

  await env.DB.prepare(
    `UPDATE generations SET
      status = ?,
      provider_status = ?,
      provider_output_url = COALESCE(?, provider_output_url),
      provider_last_frame_url = COALESCE(?, provider_last_frame_url),
      r2_video_key = COALESCE(?, r2_video_key),
      r2_last_frame_key = COALESCE(?, r2_last_frame_key),
      seed = COALESCE(?, seed),
      video_tokens = COALESCE(?, video_tokens),
      estimated_cost_usd = COALESCE(?, estimated_cost_usd),
      confirmed_cost_usd = COALESCE(?, confirmed_cost_usd),
      provider_usage_json = COALESCE(?, provider_usage_json),
      error_code = COALESCE(?, error_code),
      error_message = COALESCE(?, error_message),
      archived = ?,
      poll_attempts = ?,
      next_poll_at = ?,
      completed_at = COALESCE(?, completed_at),
      updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      status.status,
      status.providerStatus,
      status.videoUrl ?? null,
      status.lastFrameUrl ?? null,
      r2VideoKey,
      r2LastFrameKey,
      status.seed ?? null,
      videoTokens,
      estimatedCost,
      confirmedCost,
      providerUsageJson,
      status.errorCode ?? null,
      status.errorMessage ?? null,
      archived,
      attempts,
      ["queued", "running"].includes(status.status) ? nextPoll : null,
      completedAt,
      now,
      generationId,
    )
    .run();

  const updated = await env.DB.prepare(`SELECT * FROM generations WHERE id = ?`)
    .bind(generationId)
    .first();
  void requestUrl;
  return updated ? mapGeneration(updated) : null;
}

export async function pollPendingGenerations(env: Env, limit = 10) {
  const now = nowIso();
  const rows = await env.DB.prepare(
    `SELECT id FROM generations
     WHERE status IN ('queued', 'running')
       AND provider_task_id IS NOT NULL
       AND (next_poll_at IS NULL OR next_poll_at <= ?)
     ORDER BY created_at ASC
     LIMIT ?`,
  )
    .bind(now, limit)
    .all<{ id: string }>();

  const results = [];
  for (const row of rows.results ?? []) {
    try {
      // Optimistic lock: bump next_poll_at before work
      await env.DB.prepare(
        `UPDATE generations SET next_poll_at = ?, poll_attempts = poll_attempts, updated_at = ?
         WHERE id = ? AND status IN ('queued', 'running')`,
      )
        .bind(new Date(Date.now() + 30_000).toISOString(), now, row.id)
        .run();
      results.push(await pollGeneration(env, row.id));
    } catch (err) {
      console.error("poll failed", row.id, err);
    }
  }
  return results;
}

export function mapGeneration(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    scene_id: String(row.scene_id),
    provider: String(row.provider),
    provider_task_id: (row.provider_task_id as string | null) ?? null,
    model: String(row.model),
    mode: String(row.mode),
    prompt: String(row.prompt ?? ""),
    duration: Number(row.duration),
    resolution: String(row.resolution),
    aspect_ratio: String(row.aspect_ratio),
    generate_audio: jsonBool(row.generate_audio as number),
    return_last_frame: jsonBool(row.return_last_frame as number),
    watermark: jsonBool(row.watermark as number),
    status: String(row.status),
    provider_status: (row.provider_status as string | null) ?? null,
    seed: row.seed === null || row.seed === undefined ? null : Number(row.seed),
    provider_output_url: (row.provider_output_url as string | null) ?? null,
    provider_last_frame_url: (row.provider_last_frame_url as string | null) ?? null,
    r2_video_key: (row.r2_video_key as string | null) ?? null,
    r2_last_frame_key: (row.r2_last_frame_key as string | null) ?? null,
    first_frame_asset_id: (row.first_frame_asset_id as string | null) ?? null,
    last_frame_asset_id: (row.last_frame_asset_id as string | null) ?? null,
    billing_mode: String(row.billing_mode),
    has_video_input: jsonBool(row.has_video_input as number),
    provider_usage_json: (row.provider_usage_json as string | null) ?? null,
    video_tokens: row.video_tokens === null || row.video_tokens === undefined ? null : Number(row.video_tokens),
    estimated_cost_usd:
      row.estimated_cost_usd === null || row.estimated_cost_usd === undefined
        ? null
        : Number(row.estimated_cost_usd),
    confirmed_cost_usd:
      row.confirmed_cost_usd === null || row.confirmed_cost_usd === undefined
        ? null
        : Number(row.confirmed_cost_usd),
    error_code: (row.error_code as string | null) ?? null,
    error_message: (row.error_message as string | null) ?? null,
    is_favorite: jsonBool(row.is_favorite as number),
    archived: jsonBool(row.archived as number),
    idempotency_key: (row.idempotency_key as string | null) ?? null,
    poll_attempts: Number(row.poll_attempts ?? 0),
    next_poll_at: (row.next_poll_at as string | null) ?? null,
    created_at: String(row.created_at),
    started_at: (row.started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    updated_at: String(row.updated_at),
  };
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
