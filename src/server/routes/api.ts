import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../auth";
import {
  authConfigured,
  clearSessionCookieHeader,
  createSessionToken,
  destroySession,
  getSessionTokenFromRequest,
  sessionCookieHeader,
  validateSession,
  verifyPassword,
} from "../auth";
import { createBytePlusProvider } from "../providers/byteplus-seedance";
import { HttpError, mapGeneration, pollGeneration, submitGeneration } from "../services/generations";
import {
  characterAssetKey,
  createAssetFromUpload,
  getSignedAssetUrl,
  sceneInputKey,
} from "../services/media";
import { estimateGenerationCost, pricingFromEnv, sumSpendSince } from "../services/pricing-service";
import { parseNumber } from "../env";
import { perSecondRate } from "../../shared/pricing";
import { jsonBool, newId, nowIso, slugify, toDbBool } from "../utils";
import type { AspectRatio, GenerationMode, Resolution } from "../../shared/types";
import { MAX_DURATION, MIN_DURATION } from "../../shared/types";

export const api = new Hono<AppEnv>();

api.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.code ?? "error", message: err.message }, err.status as 400);
  }
  if (err instanceof z.ZodError) {
    return c.json({ error: "validation", message: err.issues[0]?.message ?? "Invalid request" }, 400);
  }
  console.error(err);
  return c.json({ error: "internal", message: "Internal server error" }, 500);
});

api.get("/health", async (c) => {
  let d1: "ok" | "error" = "ok";
  let r2: "ok" | "error" = "ok";
  try {
    await c.env.DB.prepare(`SELECT 1 AS ok`).first();
  } catch {
    d1 = "error";
  }
  try {
    await c.env.MEDIA.list({ limit: 1 });
  } catch {
    r2 = "error";
  }
  const configured = Boolean(c.env.BYTEPLUS_API_KEY);
  return c.json({
    app: "ok",
    d1,
    r2,
    byteplusConfigured: configured,
    byteplus: configured ? "configured" : "missing_credential",
    version: c.env.APP_VERSION,
    commit: c.env.GIT_COMMIT ?? null,
    deployedAt: c.env.DEPLOYED_AT ?? null,
  });
});

api.get("/auth/status", async (c) => {
  const required = authConfigured(c.env);
  if (!required) {
    return c.json({ required: false, authenticated: true });
  }
  const token = getSessionTokenFromRequest(c);
  const authenticated = await validateSession(c.env, token);
  return c.json({ required: true, authenticated });
});

api.post("/auth/login", async (c) => {
  if (!authConfigured(c.env)) {
    return c.json({ ok: true, message: "Password auth not configured" });
  }
  const body = z.object({ password: z.string().min(1) }).parse(await c.req.json());
  const ok = await verifyPassword(c.env, body.password);
  if (!ok) return c.json({ error: "invalid_password", message: "Invalid password" }, 401);
  const session = await createSessionToken(c.env);
  c.header("Set-Cookie", sessionCookieHeader(session.token, session.expiresAt));
  return c.json({ ok: true });
});

api.post("/auth/logout", async (c) => {
  const token = getSessionTokenFromRequest(c);
  await destroySession(c.env, token);
  c.header("Set-Cookie", clearSessionCookieHeader());
  return c.json({ ok: true });
});

api.get("/projects", async (c) => {
  const rows = await c.env.DB.prepare(`SELECT * FROM projects ORDER BY name ASC`).all();
  return c.json({ projects: rows.results ?? [] });
});

api.post("/projects", async (c) => {
  const body = z
    .object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      slug: z.string().max(80).optional(),
    })
    .parse(await c.req.json());
  const id = newId("proj");
  const now = nowIso();
  const slug = body.slug || slugify(body.name);
  await c.env.DB.prepare(
    `INSERT INTO projects (id, name, slug, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, body.name, slug, body.description ?? "", now, now)
    .run();
  const project = await c.env.DB.prepare(`SELECT * FROM projects WHERE id = ?`).bind(id).first();
  return c.json({ project }, 201);
});

api.get("/projects/:id", async (c) => {
  const project = await c.env.DB.prepare(`SELECT * FROM projects WHERE id = ?`)
    .bind(c.req.param("id"))
    .first();
  if (!project) return c.json({ error: "not_found" }, 404);
  const episodes = await c.env.DB.prepare(
    `SELECT * FROM episodes WHERE project_id = ? ORDER BY episode_number ASC`,
  )
    .bind(project.id as string)
    .all();
  const characters = await c.env.DB.prepare(
    `SELECT * FROM characters WHERE project_id = ? ORDER BY name ASC`,
  )
    .bind(project.id as string)
    .all();
  return c.json({ project, episodes: episodes.results ?? [], characters: characters.results ?? [] });
});

api.post("/projects/:projectId/episodes", async (c) => {
  const body = z
    .object({
      name: z.string().min(1),
      episodeNumber: z.number().int().positive(),
      description: z.string().optional(),
    })
    .parse(await c.req.json());
  const id = newId("ep");
  const now = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO episodes (id, project_id, name, episode_number, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, c.req.param("projectId"), body.name, body.episodeNumber, body.description ?? "", now, now)
    .run();
  const episode = await c.env.DB.prepare(`SELECT * FROM episodes WHERE id = ?`).bind(id).first();
  return c.json({ episode }, 201);
});

api.post("/episodes/:episodeId/scenes", async (c) => {
  const body = z
    .object({
      title: z.string().min(1),
      description: z.string().optional(),
    })
    .parse(await c.req.json());
  const id = newId("scene");
  const now = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO scenes (
      id, episode_id, title, description, notes, working_prompt, preferred_mode, preferred_resolution,
      preferred_duration, preferred_ratio, preferred_audio, preferred_return_last_frame, created_at, updated_at
    ) VALUES (?, ?, ?, ?, '', '', 'text', ?, ?, ?, 1, 1, ?, ?)`,
  )
    .bind(
      id,
      c.req.param("episodeId"),
      body.title,
      body.description ?? "",
      c.env.DEFAULT_RESOLUTION || "480p",
      Number(c.env.DEFAULT_DURATION || "15"),
      c.env.DEFAULT_ASPECT_RATIO || "9:16",
      now,
      now,
    )
    .run();
  const scene = await c.env.DB.prepare(`SELECT * FROM scenes WHERE id = ?`).bind(id).first();
  return c.json({ scene }, 201);
});

api.get("/scenes/:id", async (c) => {
  const scene = await c.env.DB.prepare(
    `SELECT s.*, e.project_id, e.name AS episode_name, e.episode_number, p.name AS project_name
     FROM scenes s
     JOIN episodes e ON e.id = s.episode_id
     JOIN projects p ON p.id = e.project_id
     WHERE s.id = ?`,
  )
    .bind(c.req.param("id"))
    .first();
  if (!scene) return c.json({ error: "not_found" }, 404);
  return c.json({
    scene: {
      ...scene,
      preferred_audio: jsonBool(scene.preferred_audio as number),
      preferred_return_last_frame: jsonBool(scene.preferred_return_last_frame as number),
    },
  });
});

api.patch("/scenes/:id", async (c) => {
  const body = z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      workingPrompt: z.string().optional(),
      preferredMode: z.enum(["text", "first_frame", "first_last", "references"]).optional(),
      preferredResolution: z.enum(["480p", "720p"]).optional(),
      preferredDuration: z.number().int().min(MIN_DURATION).max(MAX_DURATION).optional(),
      preferredRatio: z
        .enum(["9:16", "16:9", "1:1", "4:3", "3:4", "21:9", "adaptive"])
        .optional(),
      preferredAudio: z.boolean().optional(),
      preferredReturnLastFrame: z.boolean().optional(),
    })
    .parse(await c.req.json());

  const existing = await c.env.DB.prepare(`SELECT * FROM scenes WHERE id = ?`)
    .bind(c.req.param("id"))
    .first();
  if (!existing) return c.json({ error: "not_found" }, 404);

  const now = nowIso();
  await c.env.DB.prepare(
    `UPDATE scenes SET
      title = ?,
      description = ?,
      notes = ?,
      working_prompt = ?,
      preferred_mode = ?,
      preferred_resolution = ?,
      preferred_duration = ?,
      preferred_ratio = ?,
      preferred_audio = ?,
      preferred_return_last_frame = ?,
      updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      body.title ?? existing.title,
      body.description ?? existing.description,
      body.notes ?? existing.notes,
      body.workingPrompt ?? existing.working_prompt,
      body.preferredMode ?? existing.preferred_mode,
      body.preferredResolution ?? existing.preferred_resolution,
      body.preferredDuration ?? existing.preferred_duration,
      body.preferredRatio ?? existing.preferred_ratio,
      toDbBool(body.preferredAudio ?? jsonBool(existing.preferred_audio as number)),
      toDbBool(
        body.preferredReturnLastFrame ?? jsonBool(existing.preferred_return_last_frame as number),
      ),
      now,
      c.req.param("id"),
    )
    .run();

  const scene = await c.env.DB.prepare(`SELECT * FROM scenes WHERE id = ?`)
    .bind(c.req.param("id"))
    .first();
  return c.json({ scene });
});

api.get("/tree", async (c) => {
  const projects = (await c.env.DB.prepare(`SELECT * FROM projects ORDER BY name`).all()).results ?? [];
  const episodes = (await c.env.DB.prepare(`SELECT * FROM episodes ORDER BY episode_number`).all()).results ?? [];
  const scenes = (await c.env.DB.prepare(`SELECT * FROM scenes ORDER BY created_at`).all()).results ?? [];
  return c.json({ projects, episodes, scenes });
});

api.get("/characters", async (c) => {
  const projectId = c.req.query("projectId");
  const rows = projectId
    ? await c.env.DB.prepare(`SELECT * FROM characters WHERE project_id = ? ORDER BY name`).bind(projectId).all()
    : await c.env.DB.prepare(`SELECT * FROM characters ORDER BY name`).all();
  return c.json({ characters: rows.results ?? [] });
});

api.post("/characters", async (c) => {
  const body = z
    .object({
      projectId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse(await c.req.json());
  const id = newId("char");
  const now = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO characters (id, project_id, name, description, notes, primary_reference_asset_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
  )
    .bind(id, body.projectId, body.name, body.description ?? "", body.notes ?? "", now, now)
    .run();
  const character = await c.env.DB.prepare(`SELECT * FROM characters WHERE id = ?`).bind(id).first();
  return c.json({ character }, 201);
});

api.post("/assets", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return c.json({ error: "file_required" }, 400);
  const projectId = String(form.get("projectId") || "") || null;
  const characterId = String(form.get("characterId") || "") || null;
  const sceneId = String(form.get("sceneId") || "") || null;
  const role = String(form.get("role") || "reference_image");

  let r2KeyPrefix = `uploads/${newId("up")}`;
  if (characterId && projectId) {
    const assetId = newId("asset");
    r2KeyPrefix = characterAssetKey(projectId, characterId, assetId, "tmp").replace(/\.tmp$/, "");
  } else if (sceneId && projectId) {
    const episode = await c.env.DB.prepare(
      `SELECT e.id AS episode_id, e.project_id FROM scenes s JOIN episodes e ON e.id = s.episode_id WHERE s.id = ?`,
    )
      .bind(sceneId)
      .first<{ episode_id: string; project_id: string }>();
    if (episode) {
      const assetId = newId("asset");
      r2KeyPrefix = sceneInputKey({
        projectId: episode.project_id,
        episodeId: episode.episode_id,
        sceneId,
        assetId,
        ext: "tmp",
      }).replace(/\.tmp$/, "");
    }
  }

  try {
    const asset = await createAssetFromUpload(c.env, {
      projectId,
      file,
      r2Key: r2KeyPrefix,
    });

    if (characterId) {
      const now = nowIso();
      const isPrimary = String(form.get("isPrimary") || "") === "true";
      await c.env.DB.prepare(
        `INSERT INTO character_assets (id, character_id, asset_id, is_primary, sort_order, created_at)
         VALUES (?, ?, ?, ?, 0, ?)`,
      )
        .bind(newId("ca"), characterId, asset.id, toDbBool(isPrimary), now)
        .run();
      if (isPrimary) {
        await c.env.DB.prepare(
          `UPDATE characters SET primary_reference_asset_id = ?, updated_at = ? WHERE id = ?`,
        )
          .bind(asset.id, now, characterId)
          .run();
      }
    }

    if (sceneId) {
      const now = nowIso();
      await c.env.DB.prepare(
        `INSERT INTO scene_assets (id, scene_id, asset_id, role, sort_order, label, created_at)
         VALUES (?, ?, ?, ?, 0, '', ?)`,
      )
        .bind(newId("sa"), sceneId, asset.id, role, now)
        .run();
    }

    const url = await getSignedAssetUrl(c.env, c.req.url, asset.id);
    return c.json({ asset, url }, 201);
  } catch (err) {
    return c.json({ error: "upload_failed", message: err instanceof Error ? err.message : "Upload failed" }, 400);
  }
});

api.get("/assets/:id/url", async (c) => {
  try {
    const url = await getSignedAssetUrl(c.env, c.req.url, c.req.param("id"));
    return c.json({ url });
  } catch (err) {
    return c.json({ error: "signing_failed", message: err instanceof Error ? err.message : "Failed" }, 500);
  }
});

api.get("/scenes/:id/generations", async (c) => {
  const filter = c.req.query("filter") || "all";
  let sql = `SELECT * FROM generations WHERE scene_id = ?`;
  if (filter === "selected") sql += ` AND is_favorite = 1`;
  if (filter === "generating") sql += ` AND status IN ('queued','running')`;
  if (filter === "failed") sql += ` AND status = 'failed'`;
  sql += ` ORDER BY created_at DESC`;
  const rows = await c.env.DB.prepare(sql).bind(c.req.param("id")).all();
  const generations = (rows.results ?? []).map((r) => mapGeneration(r as Record<string, unknown>));
  const selected = generations.filter((g) => g.is_favorite).length;
  return c.json({
    generations,
    summary: {
      total: generations.length,
      selected,
      generating: generations.filter((g) => g.status === "queued" || g.status === "running").length,
      failed: generations.filter((g) => g.status === "failed").length,
    },
  });
});

api.post("/generations", async (c) => {
  const body = z
    .object({
      sceneId: z.string(),
      mode: z.enum(["text", "first_frame", "first_last", "references"]),
      prompt: z.string().optional(),
      duration: z.number().int().min(MIN_DURATION).max(MAX_DURATION),
      resolution: z.enum(["480p", "720p"]),
      aspectRatio: z.enum(["9:16", "16:9", "1:1", "4:3", "3:4", "21:9", "adaptive"]),
      generateAudio: z.boolean(),
      returnLastFrame: z.boolean(),
      firstFrameAssetId: z.string().nullable().optional(),
      lastFrameAssetId: z.string().nullable().optional(),
      references: z
        .array(
          z.object({
            assetId: z.string(),
            characterId: z.string().nullable().optional(),
            label: z.string().optional(),
          }),
        )
        .optional(),
      idempotencyKey: z.string().max(120).optional(),
      seed: z.number().int().optional(),
    })
    .parse(await c.req.json());

  const result = await submitGeneration(c.env, c.req.url, {
    ...body,
    mode: body.mode as GenerationMode,
    resolution: body.resolution as Resolution,
    aspectRatio: body.aspectRatio as AspectRatio,
  });
  return c.json(result, result.reused ? 200 : 201);
});

api.get("/generations/:id", async (c) => {
  const id = c.req.param("id");
  let generation = await pollGeneration(c.env, id, c.req.url);
  if (!generation) {
    const row = await c.env.DB.prepare(`SELECT * FROM generations WHERE id = ?`).bind(id).first();
    if (!row) return c.json({ error: "not_found" }, 404);
    generation = mapGeneration(row as Record<string, unknown>);
  }
  const refs = await c.env.DB.prepare(
    `SELECT * FROM generation_references WHERE generation_id = ? ORDER BY sort_order ASC`,
  )
    .bind(id)
    .all();
  const lastFrameAsset = await c.env.DB.prepare(
    `SELECT value FROM settings WHERE key = ?`,
  )
    .bind(`gen_last_frame_asset:${id}`)
    .first<{ value: string }>();

  return c.json({
    generation,
    references: refs.results ?? [],
    generatedLastFrameAssetId: lastFrameAsset?.value ?? null,
  });
});

api.post("/generations/:id/favorite", async (c) => {
  const body = z.object({ favorite: z.boolean() }).parse(await c.req.json());
  await c.env.DB.prepare(`UPDATE generations SET is_favorite = ?, updated_at = ? WHERE id = ?`)
    .bind(toDbBool(body.favorite), nowIso(), c.req.param("id"))
    .run();
  const row = await c.env.DB.prepare(`SELECT * FROM generations WHERE id = ?`)
    .bind(c.req.param("id"))
    .first();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json({ generation: mapGeneration(row as Record<string, unknown>) });
});

api.post("/generations/:id/retry", async (c) => {
  const row = await c.env.DB.prepare(`SELECT * FROM generations WHERE id = ?`)
    .bind(c.req.param("id"))
    .first<Record<string, unknown>>();
  if (!row) return c.json({ error: "not_found" }, 404);
  const refs = (
    await c.env.DB.prepare(
      `SELECT * FROM generation_references WHERE generation_id = ? ORDER BY sort_order`,
    )
      .bind(c.req.param("id"))
      .all()
  ).results as Array<{ asset_id: string; character_id: string | null; label: string }>;

  const result = await submitGeneration(c.env, c.req.url, {
    sceneId: String(row.scene_id),
    mode: String(row.mode) as GenerationMode,
    prompt: String(row.prompt ?? ""),
    duration: Number(row.duration),
    resolution: String(row.resolution) as Resolution,
    aspectRatio: String(row.aspect_ratio) as AspectRatio,
    generateAudio: jsonBool(row.generate_audio as number),
    returnLastFrame: jsonBool(row.return_last_frame as number),
    firstFrameAssetId: (row.first_frame_asset_id as string | null) ?? null,
    lastFrameAssetId: (row.last_frame_asset_id as string | null) ?? null,
    references: refs.map((r) => ({
      assetId: r.asset_id,
      characterId: r.character_id,
      label: r.label,
    })),
    idempotencyKey: crypto.randomUUID(),
  });
  return c.json(result, 201);
});

api.delete("/generations/:id", async (c) => {
  await c.env.DB.prepare(`DELETE FROM generations WHERE id = ?`).bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

api.get("/prompt-snippets", async (c) => {
  const projectId = c.req.query("projectId");
  const rows = await c.env.DB.prepare(
    `SELECT * FROM prompt_snippets WHERE project_id IS NULL OR project_id = ? ORDER BY sort_order, title`,
  )
    .bind(projectId ?? "")
    .all();
  return c.json({ snippets: rows.results ?? [] });
});

api.post("/prompt-snippets", async (c) => {
  const body = z
    .object({
      projectId: z.string().nullable().optional(),
      title: z.string().min(1),
      body: z.string().min(1),
    })
    .parse(await c.req.json());
  const id = newId("snip");
  const now = nowIso();
  await c.env.DB.prepare(
    `INSERT INTO prompt_snippets (id, project_id, title, body, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, 100, ?, ?)`,
  )
    .bind(id, body.projectId ?? null, body.title, body.body, now, now)
    .run();
  const snippet = await c.env.DB.prepare(`SELECT * FROM prompt_snippets WHERE id = ?`).bind(id).first();
  return c.json({ snippet }, 201);
});

api.patch("/prompt-snippets/:id", async (c) => {
  const body = z.object({ title: z.string().optional(), body: z.string().optional() }).parse(await c.req.json());
  const existing = await c.env.DB.prepare(`SELECT * FROM prompt_snippets WHERE id = ?`)
    .bind(c.req.param("id"))
    .first();
  if (!existing) return c.json({ error: "not_found" }, 404);
  await c.env.DB.prepare(
    `UPDATE prompt_snippets SET title = ?, body = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(body.title ?? existing.title, body.body ?? existing.body, nowIso(), c.req.param("id"))
    .run();
  const snippet = await c.env.DB.prepare(`SELECT * FROM prompt_snippets WHERE id = ?`)
    .bind(c.req.param("id"))
    .first();
  return c.json({ snippet });
});

api.delete("/prompt-snippets/:id", async (c) => {
  await c.env.DB.prepare(`DELETE FROM prompt_snippets WHERE id = ?`).bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

api.get("/usage", async (c) => {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  async function stats(since: string) {
    const row = await c.env.DB.prepare(
      `SELECT
         COUNT(*) AS generations,
         SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS successful,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
         SUM(CASE WHEN status IN ('queued','running') THEN 1 ELSE 0 END) AS pending,
         COALESCE(SUM(CASE WHEN status = 'succeeded' THEN duration ELSE 0 END), 0) AS generated_seconds,
         COALESCE(SUM(COALESCE(confirmed_cost_usd, estimated_cost_usd, 0)), 0) AS estimated_spend
       FROM generations WHERE created_at >= ?`,
    )
      .bind(since)
      .first();
    return row;
  }

  const byProject = await c.env.DB.prepare(
    `SELECT p.name AS project,
            COALESCE(SUM(COALESCE(g.confirmed_cost_usd, g.estimated_cost_usd, 0)), 0) AS spend,
            COUNT(g.id) AS generations
     FROM projects p
     LEFT JOIN episodes e ON e.project_id = p.id
     LEFT JOIN scenes s ON s.episode_id = e.id
     LEFT JOIN generations g ON g.scene_id = s.id AND g.created_at >= ?
     GROUP BY p.id
     ORDER BY p.name`,
  )
    .bind(monthStart)
    .all();

  const byResolution = await c.env.DB.prepare(
    `SELECT resolution,
            COUNT(*) AS generations,
            COALESCE(SUM(COALESCE(confirmed_cost_usd, estimated_cost_usd, 0)), 0) AS spend
     FROM generations WHERE created_at >= ?
     GROUP BY resolution`,
  )
    .bind(monthStart)
    .all();

  return c.json({
    today: await stats(dayStart),
    month: await stats(monthStart),
    byProject: byProject.results ?? [],
    byResolution: byResolution.results ?? [],
  });
});

api.get("/provider/status", async (c) => {
  const configured = Boolean(c.env.BYTEPLUS_API_KEY);
  const pricing = pricingFromEnv(c.env);
  return c.json({
    provider: "byteplus",
    model: c.env.BYTEPLUS_MODEL,
    configured,
    status: configured ? "connected" : "missing",
    billingMode: pricing.billingMode,
    rates: {
      "480p": perSecondRate("480p", false, pricing),
      "720p": perSecondRate("720p", false, pricing),
    },
    consoleUrl: c.env.BYTEPLUS_CONSOLE_URL,
    billingCenterUrl: c.env.BYTEPLUS_BILLING_CENTER_URL,
    addFundsUrl: c.env.BYTEPLUS_ADD_FUNDS_URL,
  });
});

api.get("/provider/billing", async (c) => {
  const pricing = pricingFromEnv(c.env);
  const monthStart = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1),
  ).toISOString();
  const trackedSpend = await sumSpendSince(c.env.DB, "1970-01-01T00:00:00.000Z");
  const monthSpend = await sumSpendSince(c.env.DB, monthStart);
  const funded = parseNumber(c.env.BYTEPLUS_FUNDED_BUDGET_USD, NaN);
  const low = parseNumber(c.env.BYTEPLUS_LOW_BALANCE_USD, 5);
  const hasFundedBudget = Number.isFinite(funded);
  const estimatedRemaining = hasFundedBudget ? funded - trackedSpend : null;

  // Official cash-balance API is not used: BytePlus OpenAPI billing requires AK/SK
  // signature APIs that are not part of ModelArk Bearer-key auth. We never scrape
  // the console. Show clearly-labelled estimated remaining when funded budget is set.
  const monthSeconds = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(CASE WHEN status = 'succeeded' THEN duration ELSE 0 END), 0) AS seconds
     FROM generations WHERE created_at >= ?`,
  )
    .bind(monthStart)
    .first<{ seconds: number }>();

  return c.json({
    source: hasFundedBudget ? "estimated" : "unavailable",
    authoritative: false,
    availableBalance: null,
    estimatedRemaining,
    trackedSpend,
    monthSpend,
    monthGeneratedSeconds: monthSeconds?.seconds ?? 0,
    lowBalance: estimatedRemaining !== null ? estimatedRemaining <= low : false,
    lowBalanceThreshold: low,
    rates: {
      "480p": perSecondRate("480p", false, pricing),
      "720p": perSecondRate("720p", false, pricing),
      tokenPriceNoVideo: pricing.tokenPriceNoVideoPerMillion,
      tokenPriceWithVideo: pricing.tokenPriceWithVideoPerMillion,
    },
    model: c.env.BYTEPLUS_MODEL,
    billingMode: pricing.billingMode,
    addFundsUrl: c.env.BYTEPLUS_ADD_FUNDS_URL,
    billingCenterUrl: c.env.BYTEPLUS_BILLING_CENTER_URL,
    updatedAt: nowIso(),
    note: hasFundedBudget
      ? "Estimated from NEPAR Studio usage against BYTEPLUS_FUNDED_BUDGET_USD"
      : "Official BytePlus cash balance API is not available via ModelArk API key. Set BYTEPLUS_FUNDED_BUDGET_USD for estimated remaining.",
  });
});

api.get("/settings", async (c) => {
  const configured = Boolean(c.env.BYTEPLUS_API_KEY);
  const pricing = pricingFromEnv(c.env);
  return c.json({
    byteplus: {
      model: c.env.BYTEPLUS_MODEL,
      status: configured ? "connected" : "missing",
      billingMode: pricing.billingMode,
      estimate480p: estimateGenerationCost(c.env, {
        resolution: "480p",
        duration: 5,
        hasVideoInput: false,
      }).estimatedCostUsd,
      estimate720p: estimateGenerationCost(c.env, {
        resolution: "720p",
        duration: 5,
        hasVideoInput: false,
      }).estimatedCostUsd,
    },
    cloudflare: {
      d1: "connected",
      r2: "connected",
      cron: "*/2 * * * *",
    },
    defaults: {
      resolution: c.env.DEFAULT_RESOLUTION || "480p",
      aspectRatio: c.env.DEFAULT_ASPECT_RATIO || "9:16",
      duration: Number(c.env.DEFAULT_DURATION || "15"),
      audio: c.env.DEFAULT_GENERATE_AUDIO !== "false",
    },
  });
});

api.post("/provider/test", async (c) => {
  const provider = createBytePlusProvider(c.env);
  if (!provider) {
    return c.json({ ok: false, status: "missing", message: "BytePlus setup required" });
  }
  // Cheap connectivity check: list/get with invalid id should auth-check without generating video
  try {
    await provider.getGenerationStatus("cgt-connectivity-probe-nepar");
    return c.json({ ok: true, status: "connected" });
  } catch (err) {
    if (err instanceof Error && /401|unauthorized|invalid.*key|authentication/i.test(err.message)) {
      return c.json({ ok: false, status: "error", message: "Invalid BytePlus credentials" });
    }
    // 404 / task not found still proves auth worked
    return c.json({ ok: true, status: "connected", message: "Credentials accepted" });
  }
});
