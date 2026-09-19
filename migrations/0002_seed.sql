-- Seed projects, characters, and default snippets
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO projects (id, name, slug, description, created_at, updated_at) VALUES
  ('proj_gricka', 'Grička vještica', 'gricka-vjestica', 'NEPAR Series — Grička vještica', datetime('now'), datetime('now')),
  ('proj_zlatarovo', 'Zlatarovo zlato', 'zlatarovo-zlato', 'NEPAR Series — Zlatarovo zlato', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO episodes (id, project_id, name, episode_number, description, created_at, updated_at) VALUES
  ('ep_gv_01', 'proj_gricka', 'Episode 01', 1, '', datetime('now'), datetime('now')),
  ('ep_gv_02', 'proj_gricka', 'Episode 02', 2, '', datetime('now'), datetime('now')),
  ('ep_zz_01', 'proj_zlatarovo', 'Episode 01', 1, '', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO scenes (id, episode_id, title, description, notes, working_prompt, preferred_mode, preferred_resolution, preferred_duration, preferred_ratio, preferred_audio, preferred_return_last_frame, created_at, updated_at) VALUES
  ('scene_gv_e02_01', 'ep_gv_02', 'Scene 01', '', '', '', 'text', '480p', 15, '9:16', 1, 1, datetime('now'), datetime('now')),
  ('scene_gv_e02_02', 'ep_gv_02', 'Scene 02', '', '', '', 'text', '480p', 15, '9:16', 1, 1, datetime('now'), datetime('now')),
  ('scene_gv_e02_03', 'ep_gv_02', 'Scene 03', '', '', '', 'references', '480p', 15, '9:16', 1, 1, datetime('now'), datetime('now')),
  ('scene_zz_e01_01', 'ep_zz_01', 'Scene 01', '', '', '', 'text', '480p', 15, '9:16', 1, 1, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO characters (id, project_id, name, description, notes, primary_reference_asset_id, created_at, updated_at) VALUES
  ('char_nera', 'proj_gricka', 'Nera', '', '', NULL, datetime('now'), datetime('now')),
  ('char_dvojkovic', 'proj_gricka', 'Dvojković', '', '', NULL, datetime('now'), datetime('now')),
  ('char_krajacic', 'proj_gricka', 'Krajačić', '', '', NULL, datetime('now'), datetime('now')),
  ('char_sinisa', 'proj_gricka', 'Kapetan Siniša', '', '', NULL, datetime('now'), datetime('now')),
  ('char_barbara', 'proj_gricka', 'Barbara Palčić', '', '', NULL, datetime('now'), datetime('now')),
  ('char_dora', 'proj_zlatarovo', 'Dora', '', '', NULL, datetime('now'), datetime('now')),
  ('char_petar', 'proj_zlatarovo', 'Petar', '', '', NULL, datetime('now'), datetime('now')),
  ('char_grga', 'proj_zlatarovo', 'Grga', '', '', NULL, datetime('now'), datetime('now')),
  ('char_pavao', 'proj_zlatarovo', 'Pavao', '', '', NULL, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO prompt_snippets (id, project_id, title, body, sort_order, created_at, updated_at) VALUES
  ('snip_croatian', NULL, 'Croatian dialogue', 'All spoken dialogue must be in natural Croatian.', 1, datetime('now'), datetime('now')),
  ('snip_consistency', NULL, 'Character consistency', 'Keep the character''s facial identity, hairstyle, age, costume and body proportions consistent with the reference image.', 2, datetime('now'), datetime('now')),
  ('snip_cinematic', NULL, 'Cinematic', 'Cinematic feature-film lighting, realistic skin texture, physically plausible movement, natural camera motion and shallow depth of field.', 3, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('default_resolution', '480p', datetime('now')),
  ('default_aspect_ratio', '9:16', datetime('now')),
  ('default_duration', '15', datetime('now')),
  ('default_generate_audio', 'true', datetime('now')),
  ('default_return_last_frame', 'true', datetime('now'));
