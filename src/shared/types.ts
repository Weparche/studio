export type GenerationMode = "text" | "first_frame" | "first_last" | "references";

export type GenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "expired"
  | "cancelled";

export type Resolution = "480p" | "720p";

export type AspectRatio =
  | "9:16"
  | "16:9"
  | "1:1"
  | "4:3"
  | "3:4"
  | "21:9"
  | "adaptive";

export type BillingMode = "MODELARK_TOKEN" | "LAS_DURATION";

export type ReferenceRole =
  | "first_frame"
  | "last_frame"
  | "reference_image"
  | "reference_video"
  | "reference_audio";

export interface MediaReference {
  assetId: string;
  role: ReferenceRole;
  tag: string;
  sortOrder: number;
  characterId?: string | null;
  label?: string;
  url?: string;
}

export interface CreateGenerationInput {
  prompt: string;
  mode: GenerationMode;
  firstFrame?: MediaReference | null;
  lastFrame?: MediaReference | null;
  references: MediaReference[];
  duration: number;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  generateAudio: boolean;
  returnLastFrame: boolean;
  watermark?: boolean;
  seed?: number;
}

export interface ProviderCreateResult {
  providerTaskId: string;
  providerStatus: string;
  raw?: unknown;
}

export interface ProviderStatusResult {
  providerTaskId: string;
  status: GenerationStatus;
  providerStatus: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  seed?: number;
  usage?: {
    completionTokens?: number;
    totalTokens?: number;
    raw?: unknown;
  };
  errorCode?: string;
  errorMessage?: string;
  resolution?: string;
  ratio?: string;
  duration?: number;
  generateAudio?: boolean;
  raw?: unknown;
}

export interface VideoProvider {
  readonly name: string;
  readonly model: string;
  createGeneration(input: CreateGenerationInput): Promise<ProviderCreateResult>;
  getGenerationStatus(providerTaskId: string): Promise<ProviderStatusResult>;
  cancelGeneration?(providerTaskId: string): Promise<void>;
  isConfigured(): boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  project_id: string;
  name: string;
  episode_number: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  episode_id: string;
  title: string;
  description: string;
  notes: string;
  working_prompt: string;
  preferred_mode: GenerationMode;
  preferred_resolution: Resolution;
  preferred_duration: number;
  preferred_ratio: AspectRatio;
  preferred_audio: boolean;
  preferred_return_last_frame: boolean;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string;
  notes: string;
  primary_reference_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string | null;
  kind: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  r2_key: string;
  width: number | null;
  height: number | null;
  sha256: string | null;
  original_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  scene_id: string;
  provider: string;
  provider_task_id: string | null;
  model: string;
  mode: GenerationMode;
  prompt: string;
  duration: number;
  resolution: Resolution;
  aspect_ratio: AspectRatio;
  generate_audio: boolean;
  return_last_frame: boolean;
  watermark: boolean;
  status: GenerationStatus;
  provider_status: string | null;
  seed: number | null;
  provider_output_url: string | null;
  provider_last_frame_url: string | null;
  r2_video_key: string | null;
  r2_last_frame_key: string | null;
  first_frame_asset_id: string | null;
  last_frame_asset_id: string | null;
  billing_mode: BillingMode;
  has_video_input: boolean;
  provider_usage_json: string | null;
  video_tokens: number | null;
  estimated_cost_usd: number | null;
  confirmed_cost_usd: number | null;
  error_code: string | null;
  error_message: string | null;
  is_favorite: boolean;
  archived: boolean;
  idempotency_key: string | null;
  poll_attempts: number;
  next_poll_at: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export const BYTEPLUS_MODEL_ID = "dreamina-seedance-2-5-260628";
export const MIN_DURATION = 4;
export const MAX_DURATION = 30;
export const SUPPORTED_RESOLUTIONS: Resolution[] = ["480p", "720p"];
export const SUPPORTED_RATIOS: AspectRatio[] = [
  "9:16",
  "16:9",
  "1:1",
  "4:3",
  "3:4",
  "21:9",
  "adaptive",
];

/** Official ModelArk frame sizes used for token estimation (Seedance 2.5). */
export const RESOLUTION_PIXELS: Record<Resolution, { width: number; height: number }> = {
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
};

export const FPS = 24;
