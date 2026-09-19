import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { AppEnv } from "./auth";
import { requireAuth } from "./auth";
import { api } from "./routes/api";
import { pollPendingGenerations } from "./services/generations";
import { verifySignedMedia } from "../shared/signed-media";

const app = new Hono<AppEnv>();

app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
      frameAncestors: ["'none'"],
    },
  }),
);

app.use("/api/*", cors({ origin: (origin) => origin || "*", credentials: true }));

app.use("*", async (c, next) => {
  // Signed media bypasses session auth; HMAC is the gate.
  const path = new URL(c.req.url).pathname;
  if (path.startsWith("/media/signed/")) {
    return next();
  }
  return requireAuth(c, next);
});

app.route("/api", api);

app.on(["GET", "HEAD"], "/media/signed/:assetId", async (c) => {
  const assetId = c.req.param("assetId");
  const exp = c.req.query("exp") ?? null;
  const sig = c.req.query("sig") ?? null;
  const secret = c.env.MEDIA_SIGNING_SECRET;
  if (!secret) return c.json({ error: "signing_not_configured" }, 503);

  const verified = await verifySignedMedia(assetId, exp, sig, secret);
  if (!verified.ok) {
    return c.json({ error: verified.reason }, 403);
  }

  const asset = await c.env.DB.prepare(`SELECT * FROM assets WHERE id = ?`)
    .bind(assetId)
    .first<{ r2_key: string; mime_type: string }>();
  if (!asset) return c.json({ error: "not_found" }, 404);

  const object = await c.env.MEDIA.get(asset.r2_key);
  if (!object) return c.json({ error: "missing_object" }, 404);

  const headers = new Headers();
  headers.set("Content-Type", asset.mime_type || object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "private, max-age=60");
  headers.set("X-Content-Type-Options", "nosniff");
  if (c.req.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }
  return new Response(object.body, { status: 200, headers });
});

app.get("/media/generation/:id/video", async (c) => {
  const row = await c.env.DB.prepare(`SELECT r2_video_key FROM generations WHERE id = ?`)
    .bind(c.req.param("id"))
    .first<{ r2_video_key: string | null }>();
  if (!row?.r2_video_key) return c.json({ error: "not_ready" }, 404);
  const object = await c.env.MEDIA.get(row.r2_video_key);
  if (!object) return c.json({ error: "missing_object" }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "private, max-age=300",
    },
  });
});

app.get("/media/generation/:id/last-frame", async (c) => {
  const row = await c.env.DB.prepare(`SELECT r2_last_frame_key FROM generations WHERE id = ?`)
    .bind(c.req.param("id"))
    .first<{ r2_last_frame_key: string | null }>();
  if (!row?.r2_last_frame_key) return c.json({ error: "not_ready" }, 404);
  const object = await c.env.MEDIA.get(row.r2_last_frame_key);
  if (!object) return c.json({ error: "missing_object" }, 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
});

app.notFound(async (c) => {
  // SPA fallback for non-API routes via assets binding
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not found", 404);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: AppEnv["Bindings"], ctx: ExecutionContext) {
    ctx.waitUntil(
      pollPendingGenerations(env, 15).then((results) => {
        console.log(`cron polled ${results.length} generations`);
      }),
    );
  },
};
