import type {
  AspectRatio,
  Character,
  Episode,
  Generation,
  GenerationMode,
  Project,
  Resolution,
  Scene,
} from "@shared/types";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "invalid_json", "Invalid JSON response");
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const data = await parseJson<T & { error?: string; message?: string }>(res);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error ?? "error",
      data.message ?? `Request failed (${res.status})`,
    );
  }

  return data;
}

export interface AuthStatus {
  required: boolean;
  authenticated: boolean;
}

export interface TreeResponse {
  projects: Project[];
  episodes: Episode[];
  scenes: Scene[];
}

export interface SceneDetail extends Scene {
  project_id: string;
  episode_name: string;
  episode_number: number;
  project_name: string;
}

export interface GenerationsResponse {
  generations: Generation[];
  summary: {
    total: number;
    selected: number;
    generating: number;
    failed: number;
  };
}

export interface GenerationDetailResponse {
  generation: Generation;
  references: Array<{
    id: string;
    generation_id: string;
    asset_id: string;
    role: string;
    tag: string;
    sort_order: number;
    character_id: string | null;
    label: string;
  }>;
  generatedLastFrameAssetId: string | null;
}

export interface CreateGenerationBody {
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

export interface CreateGenerationResponse {
  generation: Generation;
  reused?: boolean;
  estimatedCostUsd?: number;
}

export interface PromptSnippet {
  id: string;
  project_id: string | null;
  title: string;
  body: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderStatus {
  provider: string;
  model: string;
  configured: boolean;
  status: string;
  billingMode: string;
  rates: Record<string, number>;
  consoleUrl?: string;
  billingCenterUrl?: string;
  addFundsUrl?: string;
}

export interface ProviderBilling {
  source: string;
  authoritative: boolean;
  availableBalance: number | null;
  estimatedRemaining: number | null;
  trackedSpend: number;
  monthSpend: number;
  monthGeneratedSeconds: number;
  lowBalance: boolean;
  lowBalanceThreshold: number;
  rates: Record<string, number>;
  model: string;
  billingMode: string;
  addFundsUrl?: string;
  billingCenterUrl?: string;
  updatedAt: string;
  note: string;
}

export interface UsageStats {
  generations: number;
  successful: number;
  failed: number;
  pending: number;
  generated_seconds: number;
  estimated_spend: number;
}

export interface UsageResponse {
  today: UsageStats;
  month: UsageStats;
  byProject: Array<{ project: string; spend: number; generations: number }>;
  byResolution: Array<{ resolution: string; generations: number; spend: number }>;
}

export interface SettingsResponse {
  byteplus: {
    model: string;
    status: string;
    billingMode: string;
    estimate480p: number;
    estimate720p: number;
  };
  cloudflare: {
    d1: string;
    r2: string;
    cron: string;
  };
  defaults: {
    resolution: string;
    aspectRatio: string;
    duration: number;
    audio: boolean;
  };
}

export const api = {
  authStatus: () => apiFetch<AuthStatus>("/api/auth/status"),
  login: (password: string) =>
    apiFetch<{ ok: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  logout: () =>
    apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  tree: () => apiFetch<TreeResponse>("/api/tree"),
  projects: () => apiFetch<{ projects: Project[] }>("/api/projects"),
  createProject: (body: { name: string; description?: string }) =>
    apiFetch<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createEpisode: (
    projectId: string,
    body: { name: string; episodeNumber: number; description?: string },
  ) =>
    apiFetch<{ episode: Episode }>(`/api/projects/${projectId}/episodes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  createScene: (episodeId: string, body: { title: string; description?: string }) =>
    apiFetch<{ scene: Scene }>(`/api/episodes/${episodeId}/scenes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getScene: (id: string) => apiFetch<{ scene: SceneDetail }>(`/api/scenes/${id}`),
  patchScene: (
    id: string,
    body: {
      title?: string;
      description?: string;
      notes?: string;
      workingPrompt?: string;
      preferredMode?: GenerationMode;
      preferredResolution?: Resolution;
      preferredDuration?: number;
      preferredRatio?: AspectRatio;
      preferredAudio?: boolean;
      preferredReturnLastFrame?: boolean;
    },
  ) =>
    apiFetch<{ scene: Scene }>(`/api/scenes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  generations: (sceneId: string, filter = "all") =>
    apiFetch<GenerationsResponse>(
      `/api/scenes/${sceneId}/generations?filter=${encodeURIComponent(filter)}`,
    ),
  getGeneration: (id: string) =>
    apiFetch<GenerationDetailResponse>(`/api/generations/${id}`),
  createGeneration: (body: CreateGenerationBody) =>
    apiFetch<CreateGenerationResponse>("/api/generations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  favoriteGeneration: (id: string, favorite: boolean) =>
    apiFetch<{ generation: Generation }>(`/api/generations/${id}/favorite`, {
      method: "POST",
      body: JSON.stringify({ favorite }),
    }),
  retryGeneration: (id: string) =>
    apiFetch<CreateGenerationResponse>(`/api/generations/${id}/retry`, {
      method: "POST",
    }),
  deleteGeneration: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/generations/${id}`, { method: "DELETE" }),

  characters: (projectId?: string) =>
    apiFetch<{ characters: Character[] }>(
      projectId
        ? `/api/characters?projectId=${encodeURIComponent(projectId)}`
        : "/api/characters",
    ),
  createCharacter: (body: {
    projectId: string;
    name: string;
    description?: string;
    notes?: string;
  }) =>
    apiFetch<{ character: Character }>("/api/characters", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  uploadAsset: (form: FormData) =>
    apiFetch<{ asset: { id: string }; url: string }>("/api/assets", {
      method: "POST",
      body: form,
      headers: {},
    }),
  assetUrl: (id: string) =>
    apiFetch<{ url: string }>(`/api/assets/${id}/url`),

  promptSnippets: (projectId?: string) =>
    apiFetch<{ snippets: PromptSnippet[] }>(
      projectId
        ? `/api/prompt-snippets?projectId=${encodeURIComponent(projectId)}`
        : "/api/prompt-snippets",
    ),

  usage: () => apiFetch<UsageResponse>("/api/usage"),
  providerStatus: () => apiFetch<ProviderStatus>("/api/provider/status"),
  providerBilling: () => apiFetch<ProviderBilling>("/api/provider/billing"),
  settings: () => apiFetch<SettingsResponse>("/api/settings"),
  testProvider: () =>
    apiFetch<{ ok: boolean; status: string; message?: string }>("/api/provider/test", {
      method: "POST",
    }),
};

export function videoUrl(generationId: string): string {
  return `/media/generation/${generationId}/video`;
}

export function lastFrameUrl(generationId: string): string {
  return `/media/generation/${generationId}/last-frame`;
}
