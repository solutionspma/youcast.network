// src/lib/env.ts

export const IS_PRODUCTION_DATA =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_USE_REAL_DATA === "true";

export function assertProductionData(context: string) {
  if (!IS_PRODUCTION_DATA) {
    console.warn(`[${context}] Running with mock data - NOT PRODUCTION SAFE`);
  }
}

export function requireProductionData(context: string) {
  if (!IS_PRODUCTION_DATA) {
    throw new Error(`[${context}] MUST use real data in production mode`);
  }
}
