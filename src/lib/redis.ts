import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export async function storeGapAnalysis(
  userId: string,
  gapAnalysis: string
): Promise<void> {
  // Store for 7 days — auto expires
  await redis.set(
    `gapanalysis:${userId}`,
    gapAnalysis,
    { ex: 60 * 60 * 24 * 7 }
  );
}

export async function getGapAnalysis(
  userId: string
): Promise<string | null> {
  return await redis.get(`gapanalysis:${userId}`);
}