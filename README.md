# NEPAR Series Studio

Internal production studio for **NEPAR Series** cinematic AI video scenes.

- **Product:** NEPAR SERIES · Seedance Studio  
- **Production URL:** https://studio.nepar.hr  
- **Repository:** https://github.com/Weparche/studio  
- **Provider:** BytePlus ModelArk · Dreamina Seedance 2.5  
- **Model ID:** `dreamina-seedance-2-5-260628`

This is **not** a public SaaS, landing page, or Higgsfield clone. It is NEPAR’s private tool for iterative scene generation with character continuity, cost tracking, and durable media archival.

---

## Architecture

```
Browser (React + Vite + Tailwind)
        │
        ▼
Cloudflare Worker (Hono)
  ├── /api/*          authenticated JSON API
  ├── /media/signed/* HMAC temporary media for BytePlus fetch
  ├── /media/generation/* private playback from R2
  └── static SPA assets
        │
        ├── D1  nepar-series-studio-db
        ├── R2  nepar-series-studio-media (private)
        └── Cron */2 * * * *  → poll pending BytePlus tasks + archive
```

Stack:

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 |
| Object storage | Cloudflare R2 (private) |
| Auth | App password session cookie (fallback) and/or Cloudflare Access |
| Video provider | Direct BytePlus ModelArk Seedance 2.5 |

---

## Why ModelArk (not LAS)

Official routes compared for Seedance 2.5 at **480p**, high iteration volume:

| Route | Billing | Approx. 480p rate (no video input) |
|-------|---------|--------------------------------------|
| **ModelArk** (selected) | Token formula | ~**$0.103 / s** (~$0.514 / 5s) |
| BytePlus LAS Enhanced | Duration × factor | ~**$0.206 / s** (0.303 × 0.6785) |

**Selected API path:** ModelArk Video Generation API  
**Base URL:** `https://ark.ap-southeast.bytepluses.com/api/v3`  
**Create:** `POST /contents/generations/tasks`  
**Status:** `GET /contents/generations/tasks/{id}`  
**Auth:** `Authorization: Bearer <ARK_API_KEY>`  

Provider video URLs expire in **24 hours** — Studio always archives MP4 + last frame into R2.

Official docs (source of truth):

- https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API  
- https://docs.byteplus.com/en/docs/ModelArk/2553724 (Seedance 2.5 tutorial)  

---

## Pricing / cost tracking

Token formula (ModelArk):

```
tokens = (input_video_seconds + output_seconds) × width × height × fps / 1024
```

List rates used for estimates (configurable via env):

- No video input: **$10.70 / M tokens**
- With video input: **$6.40 / M tokens**

480p frame used for estimates: **854×480 @ 24fps**.

UI always labels **Estimated cost** unless `usage.completion_tokens` is present, then **Provider-confirmed**.

Official cash balance is **not** available through the ModelArk Bearer API key. Studio uses:

1. Optional `BYTEPLUS_FUNDED_BUDGET_USD` → clearly labelled **estimated remaining**
2. One-click **Add funds** / **Billing Center** console links

Billing Center: https://console.byteplus.com/finance/overview  
Add funds: https://console.byteplus.com/finance/fund  

---

## Generation modes

| Mode | Behavior |
|------|----------|
| Text | Prompt only |
| First frame | `role: first_frame` — **ratio forced to `adaptive`** |
| First + Last | `first_frame` + `last_frame` — **ratio `adaptive`** |
| References | `reference_image` list; prompt tags `@image1`… bound by content order |

Duration: **4–30** seconds (official Seedance 2.5). Default resolution: **480p**. Default ratio: **9:16**. Watermark: **false**. Return last frame: **ON** by default.

---

## Local development

```bash
cp .dev.vars.example .dev.vars
# fill secrets

npm install
npm run db:migrate:local
npx wrangler dev   # Worker + D1 + R2 on :8787
# optional Vite HMR for UI:
npm run dev        # proxies /api and /media to :8787
```

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run typecheck` | Client + worker TypeScript |
| `npm test` | Unit + mock integration tests |
| `npm run build` | Production SPA → `dist/client` |
| `npm run deploy` | Build + `wrangler deploy` |
| `npm run db:migrate:remote` | Apply D1 migrations to production |

---

## Environment / secrets

See `.dev.vars.example`.

| Variable | Required | Notes |
|----------|----------|-------|
| `BYTEPLUS_API_KEY` | for generation | ModelArk API key |
| `MEDIA_SIGNING_SECRET` | yes | HMAC for `/media/signed/*` |
| `SESSION_SECRET` | if password auth | session signing |
| `STUDIO_PASSWORD` | if password auth | internal login |
| `BYTEPLUS_FUNDED_BUDGET_USD` | optional | estimated remaining |
| `BYTEPLUS_LOW_BALANCE_USD` | optional | warning threshold |
| `BYTEPLUS_DAILY_BUDGET_USD` | optional | hard daily cap |
| `BYTEPLUS_MONTHLY_BUDGET_USD` | optional | hard monthly cap |

Never commit real secrets. Production secrets: `wrangler secret put …`.

---

## Authentication

Preferred: **Cloudflare Access** on `studio.nepar.hr/*` with bypass for `/media/signed/*` (BytePlus must fetch references without interactive login).

Fallback: strong `STUDIO_PASSWORD` + httpOnly Secure session cookie.

---

## Generation lifecycle

1. Browser `POST /api/generations` (idempotency key)  
2. Worker creates BytePlus task, stores D1 row, returns immediately  
3. Browser polls `GET /api/generations/:id` (never talks to BytePlus)  
4. Cron every **2 minutes** also polls pending jobs  
5. On success: stream provider MP4 → R2; archive last frame; record usage/cost  

---

## R2 layout

```
projects/{projectId}/
  characters/{characterId}/{assetId}.ext
  episodes/{episodeId}/scenes/{sceneId}/
    inputs/{assetId}.ext
    generations/{generationId}/video.mp4
    generations/{generationId}/last-frame.jpg
```

---

## Cloudflare production resources

| Resource | Name |
|----------|------|
| Worker | `nepar-series-studio` |
| D1 | `nepar-series-studio-db` |
| R2 | `nepar-series-studio-media` |
| Cron | `*/2 * * * *` |
| Domain | `studio.nepar.hr` |

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| BytePlus setup required | `BYTEPLUS_API_KEY` secret |
| Account requires funding | Add funds in header popover |
| Signed media 403 | `MEDIA_SIGNING_SECRET`, clock skew, Access bypass for `/media/signed/*` |
| Jobs stuck queued | Cron trigger, Worker logs, provider status |
| Video missing later | Confirm `archived=1` and R2 key present |

---

## Out of scope (MVP)

Higgsfield, MuAPI, Kling, Veo, dubbing, public signup, Stripe, timeline editor, prompt auto-rewrite.

---

© NEPAR — internal use only.
