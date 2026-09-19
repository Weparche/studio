import {
  FPS,
  RESOLUTION_PIXELS,
  type BillingMode,
  type Resolution,
} from "./types";

export interface PricingConfig {
  billingMode: BillingMode;
  tokenPriceNoVideoPerMillion: number;
  tokenPriceWithVideoPerMillion: number;
  /** LAS duration fallback rates if ever needed */
  lasUnitPriceUsdPerSecond?: number;
  las480FactorNoVideo?: number;
  las720FactorNoVideo?: number;
  las480FactorWithVideo?: number;
  las720FactorWithVideo?: number;
}

export interface CostEstimateInput {
  resolution: Resolution;
  durationSeconds: number;
  hasVideoInput: boolean;
  inputVideoSeconds?: number;
  /** When provider returns exact tokens, prefer them */
  completionTokens?: number;
}

export interface CostEstimate {
  billingMode: BillingMode;
  videoTokens: number;
  estimatedCostUsd: number;
  confirmedCostUsd: number | null;
  label: "estimated" | "confirmed";
  formula: string;
}

/**
 * Official ModelArk Seedance token formula:
 * (input_video_duration + output_video_duration) × width × height × fps / 1024
 *
 * Rates (ModelArk list, USD / M tokens):
 * - no video input: $10.70
 * - with video input: $6.40
 *
 * Selected over LAS Enhanced duration billing because ModelArk 480p
 * (~$0.103/s) is cheaper than LAS Seedance 2.5 (~$0.206/s).
 */
export function estimateVideoTokens(input: CostEstimateInput): number {
  if (typeof input.completionTokens === "number" && input.completionTokens > 0) {
    return input.completionTokens;
  }
  const pixels = RESOLUTION_PIXELS[input.resolution];
  const inputSeconds = input.hasVideoInput ? (input.inputVideoSeconds ?? 0) : 0;
  const totalSeconds = inputSeconds + input.durationSeconds;
  return Math.round(
    (totalSeconds * pixels.width * pixels.height * FPS) / 1024,
  );
}

export function calculateCost(
  input: CostEstimateInput,
  config: PricingConfig,
): CostEstimate {
  if (config.billingMode === "LAS_DURATION") {
    return calculateLasCost(input, config);
  }
  return calculateModelArkCost(input, config);
}

function calculateModelArkCost(
  input: CostEstimateInput,
  config: PricingConfig,
): CostEstimate {
  const tokens = estimateVideoTokens(input);
  const pricePerMillion = input.hasVideoInput
    ? config.tokenPriceWithVideoPerMillion
    : config.tokenPriceNoVideoPerMillion;
  const estimatedCostUsd = (tokens / 1_000_000) * pricePerMillion;
  const confirmed =
    typeof input.completionTokens === "number" && input.completionTokens > 0
      ? (input.completionTokens / 1_000_000) * pricePerMillion
      : null;

  return {
    billingMode: "MODELARK_TOKEN",
    videoTokens: tokens,
    estimatedCostUsd: roundMoney(confirmed ?? estimatedCostUsd),
    confirmedCostUsd: confirmed !== null ? roundMoney(confirmed) : null,
    label: confirmed !== null ? "confirmed" : "estimated",
    formula: `(duration × ${RESOLUTION_PIXELS[input.resolution].width}×${RESOLUTION_PIXELS[input.resolution].height}×${FPS} / 1024) × $${pricePerMillion}/M tokens`,
  };
}

function calculateLasCost(
  input: CostEstimateInput,
  config: PricingConfig,
): CostEstimate {
  const unit = config.lasUnitPriceUsdPerSecond ?? 0.303;
  const factor = input.hasVideoInput
    ? input.resolution === "720p"
      ? (config.las720FactorWithVideo ?? 0.9125)
      : (config.las480FactorWithVideo ?? 0.406)
    : input.resolution === "720p"
      ? (config.las720FactorNoVideo ?? 1.525)
      : (config.las480FactorNoVideo ?? 0.6785);
  const seconds =
    (input.hasVideoInput ? (input.inputVideoSeconds ?? 0) : 0) +
    input.durationSeconds;
  const cost = unit * factor * seconds;
  return {
    billingMode: "LAS_DURATION",
    videoTokens: 0,
    estimatedCostUsd: roundMoney(cost),
    confirmedCostUsd: null,
    label: "estimated",
    formula: `${seconds}s × $${unit}/s × factor ${factor}`,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function defaultPricingConfig(): PricingConfig {
  return {
    billingMode: "MODELARK_TOKEN",
    tokenPriceNoVideoPerMillion: 10.7,
    tokenPriceWithVideoPerMillion: 6.4,
  };
}

export function perSecondRate(
  resolution: Resolution,
  hasVideoInput: boolean,
  config: PricingConfig = defaultPricingConfig(),
): number {
  const oneSecond = calculateCost(
    { resolution, durationSeconds: 1, hasVideoInput },
    config,
  );
  return oneSecond.estimatedCostUsd;
}
