import type {
  AspectRatio,
  CreateGenerationInput,
  GenerationMode,
  GenerationStatus,
  MediaReference,
  ProviderCreateResult,
  ProviderStatusResult,
  Resolution,
  VideoProvider,
} from "../../shared/types";
import { BYTEPLUS_MODEL_ID, MAX_DURATION, MIN_DURATION } from "../../shared/types";

export interface BytePlusContentItem {
  type: "text" | "image_url" | "video_url" | "audio_url";
  text?: string;
  image_url?: { url: string };
  video_url?: { url: string };
  audio_url?: { url: string };
  role?: string;
}

export interface BytePlusCreateTaskRequest {
  model: string;
  content: BytePlusContentItem[];
  resolution?: string;
  ratio?: string;
  duration?: number;
  generate_audio?: boolean;
  watermark?: boolean;
  return_last_frame?: boolean;
  seed?: number;
  omni_reference_task_type?: string;
  output_format?: string;
}

export interface BytePlusProviderOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  fetchImpl?: typeof fetch;
}

const STATUS_MAP: Record<string, GenerationStatus> = {
  queued: "queued",
  pending: "queued",
  running: "running",
  processing: "running",
  succeeded: "succeeded",
  success: "succeeded",
  failed: "failed",
  error: "failed",
  cancelled: "cancelled",
  canceled: "cancelled",
  expired: "expired",
};

export function mapProviderStatus(raw: string | undefined): GenerationStatus {
  if (!raw) return "running";
  return STATUS_MAP[raw.toLowerCase()] ?? "running";
}

/**
 * Build the official ModelArk Seedance 2.5 create-task payload.
 * Docs: https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API
 * Model: dreamina-seedance-2-5-260628
 *
 * Modes:
 * - text: content = [{type:text}]
 * - first_frame: role first_frame; ratio MUST be adaptive
 * - first_last: roles first_frame + last_frame; ratio MUST be adaptive
 * - references: roles reference_image; prompt uses @ImageN order
 */
export function buildBytePlusPayload(
  input: CreateGenerationInput,
  model = BYTEPLUS_MODEL_ID,
): BytePlusCreateTaskRequest {
  if (input.duration < MIN_DURATION || input.duration > MAX_DURATION) {
    throw new Error(`Duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds`);
  }

  const content: BytePlusContentItem[] = [];
  const prompt = input.prompt?.trim() ?? "";

  if (prompt) {
    content.push({ type: "text", text: prompt });
  }

  let ratio: AspectRatio | string = input.aspectRatio;
  let omni: string | undefined;

  switch (input.mode) {
    case "text": {
      if (!prompt) throw new Error("Text mode requires a prompt");
      break;
    }
    case "first_frame": {
      if (!input.firstFrame?.url) throw new Error("First frame mode requires a first frame image URL");
      content.push({
        type: "image_url",
        image_url: { url: input.firstFrame.url },
        role: "first_frame",
      });
      // Official constraint: first/last frame modes require ratio=adaptive
      ratio = "adaptive";
      break;
    }
    case "first_last": {
      if (!input.firstFrame?.url) throw new Error("First+last mode requires a first frame image URL");
      if (!input.lastFrame?.url) throw new Error("First+last mode requires a last frame image URL");
      content.push({
        type: "image_url",
        image_url: { url: input.firstFrame.url },
        role: "first_frame",
      });
      content.push({
        type: "image_url",
        image_url: { url: input.lastFrame.url },
        role: "last_frame",
      });
      ratio = "adaptive";
      break;
    }
    case "references": {
      if (!prompt) throw new Error("References mode requires a prompt");
      const refs = [...input.references].sort((a, b) => a.sortOrder - b.sortOrder);
      if (refs.length === 0) throw new Error("References mode requires at least one reference image");
      for (const ref of refs) {
        if (!ref.url) throw new Error(`Missing URL for reference ${ref.tag}`);
        content.push({
          type: "image_url",
          image_url: { url: ref.url },
          role: "reference_image",
        });
      }
      omni = "auto";
      break;
    }
    default: {
      const _exhaustive: never = input.mode;
      throw new Error(`Unsupported mode: ${_exhaustive}`);
    }
  }

  // Optional extra references on first-frame modes when provided
  if (input.mode === "first_frame" || input.mode === "first_last") {
    const extras = [...input.references].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const ref of extras) {
      if (!ref.url) continue;
      content.push({
        type: "image_url",
        image_url: { url: ref.url },
        role: "reference_image",
      });
    }
  }

  const payload: BytePlusCreateTaskRequest = {
    model,
    content,
    resolution: input.resolution,
    ratio,
    duration: input.duration,
    generate_audio: input.generateAudio,
    watermark: input.watermark ?? false,
    return_last_frame: input.returnLastFrame,
    output_format: "mp4",
  };

  if (omni) payload.omni_reference_task_type = omni;
  if (typeof input.seed === "number") payload.seed = input.seed;

  return payload;
}

export class BytePlusSeedanceProvider implements VideoProvider {
  readonly name = "byteplus";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: BytePlusProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.model = options.model || BYTEPLUS_MODEL_ID;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async createGeneration(input: CreateGenerationInput): Promise<ProviderCreateResult> {
    const body = buildBytePlusPayload(input, this.model);
    const res = await this.fetchImpl(`${this.baseUrl}/contents/generations/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const message =
        (data?.error as { message?: string } | undefined)?.message ??
        (typeof data?.message === "string" ? data.message : `BytePlus error ${res.status}`);
      const code =
        (data?.error as { code?: string } | undefined)?.code ??
        (typeof data?.code === "string" ? data.code : String(res.status));
      throw new BytePlusApiError(message, code, res.status, data);
    }

    const id = typeof data.id === "string" ? data.id : null;
    if (!id) throw new BytePlusApiError("BytePlus did not return a task id", "missing_task_id", res.status, data);

    return {
      providerTaskId: id,
      providerStatus: typeof data.status === "string" ? data.status : "queued",
      raw: data,
    };
  }

  async getGenerationStatus(providerTaskId: string): Promise<ProviderStatusResult> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/contents/generations/tasks/${encodeURIComponent(providerTaskId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const message =
        (data?.error as { message?: string } | undefined)?.message ??
        `BytePlus status error ${res.status}`;
      throw new BytePlusApiError(message, "status_error", res.status, data);
    }

    const providerStatus = typeof data.status === "string" ? data.status : "running";
    const content = (data.content ?? {}) as Record<string, unknown>;
    const usage = (data.usage ?? {}) as Record<string, unknown>;
    const error = data.error as { code?: string; message?: string } | undefined;

    return {
      providerTaskId,
      status: mapProviderStatus(providerStatus),
      providerStatus,
      videoUrl: typeof content.video_url === "string" ? content.video_url : undefined,
      lastFrameUrl:
        typeof content.last_frame_url === "string"
          ? content.last_frame_url
          : typeof content.file_url === "string"
            ? content.file_url
            : undefined,
      seed: typeof data.seed === "number" ? data.seed : undefined,
      usage: {
        completionTokens:
          typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
        totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : undefined,
        raw: usage,
      },
      errorCode: error?.code,
      errorMessage: error?.message ?? (typeof data.error === "string" ? data.error : undefined),
      resolution: typeof data.resolution === "string" ? data.resolution : undefined,
      ratio: typeof data.ratio === "string" ? data.ratio : undefined,
      duration: typeof data.duration === "number" ? data.duration : undefined,
      generateAudio: typeof data.generate_audio === "boolean" ? data.generate_audio : undefined,
      raw: data,
    };
  }

  async cancelGeneration(providerTaskId: string): Promise<void> {
    await this.fetchImpl(
      `${this.baseUrl}/contents/generations/tasks/${encodeURIComponent(providerTaskId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );
  }
}

export class BytePlusApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly raw?: unknown,
  ) {
    super(message);
    this.name = "BytePlusApiError";
  }

  isFundingError(): boolean {
    const hay = `${this.code} ${this.message}`.toLowerCase();
    return (
      hay.includes("balance") ||
      hay.includes("fund") ||
      hay.includes("quota") ||
      hay.includes("payment") ||
      hay.includes("insufficient") ||
      this.status === 402
    );
  }
}

export function createBytePlusProvider(env: {
  BYTEPLUS_API_KEY?: string;
  BYTEPLUS_BASE_URL: string;
  BYTEPLUS_MODEL: string;
}): BytePlusSeedanceProvider | null {
  if (!env.BYTEPLUS_API_KEY) return null;
  return new BytePlusSeedanceProvider({
    apiKey: env.BYTEPLUS_API_KEY,
    baseUrl: env.BYTEPLUS_BASE_URL,
    model: env.BYTEPLUS_MODEL,
  });
}

export type { GenerationMode, Resolution, MediaReference };
