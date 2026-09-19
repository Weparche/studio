export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  APP_NAME: string;
  APP_VERSION: string;
  BYTEPLUS_BASE_URL: string;
  BYTEPLUS_MODEL: string;
  BYTEPLUS_BILLING_MODE: string;
  BYTEPLUS_TOKEN_PRICE_NO_VIDEO: string;
  BYTEPLUS_TOKEN_PRICE_WITH_VIDEO: string;
  BYTEPLUS_BILLING_CENTER_URL: string;
  BYTEPLUS_ADD_FUNDS_URL: string;
  BYTEPLUS_CONSOLE_URL: string;
  DEFAULT_RESOLUTION: string;
  DEFAULT_ASPECT_RATIO: string;
  DEFAULT_DURATION: string;
  DEFAULT_GENERATE_AUDIO: string;
  DEFAULT_RETURN_LAST_FRAME: string;
  BYTEPLUS_API_KEY?: string;
  MEDIA_SIGNING_SECRET?: string;
  SESSION_SECRET?: string;
  STUDIO_PASSWORD?: string;
  BYTEPLUS_FUNDED_BUDGET_USD?: string;
  BYTEPLUS_LOW_BALANCE_USD?: string;
  BYTEPLUS_DAILY_BUDGET_USD?: string;
  BYTEPLUS_MONTHLY_BUDGET_USD?: string;
  GIT_COMMIT?: string;
  DEPLOYED_AT?: string;
}

export function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "1" || value.toLowerCase() === "true";
}
