import type { Env } from "../env";
import { parseNumber } from "../env";
import { calculateCost, defaultPricingConfig, type PricingConfig } from "../../shared/pricing";
import type { Resolution } from "../../shared/types";

export function pricingFromEnv(env: Env): PricingConfig {
  const mode = env.BYTEPLUS_BILLING_MODE === "LAS_DURATION" ? "LAS_DURATION" : "MODELARK_TOKEN";
  return {
    ...defaultPricingConfig(),
    billingMode: mode,
    tokenPriceNoVideoPerMillion: parseNumber(env.BYTEPLUS_TOKEN_PRICE_NO_VIDEO, 10.7),
    tokenPriceWithVideoPerMillion: parseNumber(env.BYTEPLUS_TOKEN_PRICE_WITH_VIDEO, 6.4),
  };
}

export function estimateGenerationCost(
  env: Env,
  input: {
    resolution: Resolution;
    duration: number;
    hasVideoInput: boolean;
    completionTokens?: number;
  },
) {
  return calculateCost(
    {
      resolution: input.resolution,
      durationSeconds: input.duration,
      hasVideoInput: input.hasVideoInput,
      completionTokens: input.completionTokens,
    },
    pricingFromEnv(env),
  );
}

export async function sumSpendSince(db: D1Database, sinceIso: string): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(COALESCE(confirmed_cost_usd, estimated_cost_usd, 0)), 0) AS total
       FROM generations
       WHERE created_at >= ?
         AND status NOT IN ('cancelled')`,
    )
    .bind(sinceIso)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function checkBudgetGuards(
  env: Env,
  estimatedCost: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const daily = parseNumber(env.BYTEPLUS_DAILY_BUDGET_USD, 0);
  const monthly = parseNumber(env.BYTEPLUS_MONTHLY_BUDGET_USD, 0);
  const now = new Date();
  if (daily > 0) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const spent = await sumSpendSince(env.DB, start);
    if (spent + estimatedCost > daily) {
      return { ok: false, message: "Daily generation budget reached." };
    }
  }
  if (monthly > 0) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const spent = await sumSpendSince(env.DB, start);
    if (spent + estimatedCost > monthly) {
      return { ok: false, message: "Monthly generation budget reached." };
    }
  }
  return { ok: true };
}
