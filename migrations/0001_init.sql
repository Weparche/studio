-- NEPAR Series Studio initial schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes(project_id);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  working_prompt TEXT NOT NULL DEFAULT '',
  preferred_mode TEXT NOT NULL DEFAULT 'text',
  preferred_resolution TEXT NOT NULL DEFAULT '480p',
  preferred_duration INTEGER NOT NULL DEFAULT 15,
  preferred_ratio TEXT NOT NULL DEFAULT '9:16',
  preferred_audio INTEGER NOT NULL DEFAULT 1,
  preferred_return_last_frame INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scenes_episode ON scenes(episode_id);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  primary_reference_asset_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  kind TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  width INTEGER,
  height INTEGER,
  sha256 TEXT,
  original_filename TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);

CREATE TABLE IF NOT EXISTS character_assets (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(character_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_character_assets_character ON character_assets(character_id);

CREATE TABLE IF NOT EXISTS scene_assets (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scene_assets_scene ON scene_assets(scene_id);

CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'byteplus',
  provider_task_id TEXT,
  model TEXT NOT NULL,
  mode TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL,
  resolution TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  generate_audio INTEGER NOT NULL DEFAULT 1,
  return_last_frame INTEGER NOT NULL DEFAULT 1,
  watermark INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_status TEXT,
  seed INTEGER,
  provider_output_url TEXT,
  provider_last_frame_url TEXT,
  r2_video_key TEXT,
  r2_last_frame_key TEXT,
  first_frame_asset_id TEXT REFERENCES assets(id),
  last_frame_asset_id TEXT REFERENCES assets(id),
  billing_mode TEXT NOT NULL DEFAULT 'MODELARK_TOKEN',
  has_video_input INTEGER NOT NULL DEFAULT 0,
  provider_usage_json TEXT,
  video_tokens INTEGER,
  estimated_cost_usd REAL,
  confirmed_cost_usd REAL,
  error_code TEXT,
  error_message TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  archived INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT,
  poll_attempts INTEGER NOT NULL DEFAULT 0,
  next_poll_at TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_generations_idempotency
  ON generations(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generations_scene ON generations(scene_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_provider_task ON generations(provider_task_id);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_generations_pending_poll
  ON generations(status, next_poll_at) WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS generation_references (
  id TEXT PRIMARY KEY,
  generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  role TEXT NOT NULL,
  tag TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  character_id TEXT REFERENCES characters(id),
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_generation_refs_generation ON generation_references(generation_id);

CREATE TABLE IF NOT EXISTS prompt_snippets (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_project ON prompt_snippets(project_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_usage (
  id TEXT PRIMARY KEY,
  generation_id TEXT REFERENCES generations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  billing_mode TEXT NOT NULL,
  resolution TEXT,
  duration INTEGER,
  has_video_input INTEGER NOT NULL DEFAULT 0,
  video_tokens INTEGER,
  estimated_cost_usd REAL,
  confirmed_cost_usd REAL,
  provider_usage_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_usage_created ON provider_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_provider_usage_generation ON provider_usage(generation_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
