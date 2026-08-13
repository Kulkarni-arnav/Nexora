import { createClient, type RedisClientType } from "redis";
import { env } from "@/lib/env";

let client: RedisClientType | null = null;
let connecting: Promise<boolean> | null = null;

function getClient(): RedisClientType {
  if (!client) {
    client = createClient({ url: env.REDIS_URL });
    client.on("error", (err) => {
      console.error("Redis client error:", err instanceof Error ? err.message : err);
    });
  }
  return client;
}

async function isConnected(): Promise<boolean> {
  const c = getClient();
  if (c.isReady) {
    connecting = null;
    return true;
  }
  if (!connecting) {
    connecting = (async () => {
      try {
        await c.connect();
        return c.isReady;
      } catch (err) {
        console.error("Redis connect failed:", err instanceof Error ? err.message : err);
        return false;
      } finally {
        connecting = null;
      }
    })();
  }
  return connecting;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    if (!(await isConnected())) {
      return { allowed: true };
    }

    const redisKey = `rate-limit:${key}`;
    const count = await getClient().incr(redisKey);
    if (count === 1) {
      await getClient().expire(redisKey, windowSeconds);
    }

    if (count > limit) {
      return { allowed: false };
    }

    return { allowed: true };
  } catch (err) {
    console.error("Rate limit check failed:", err instanceof Error ? err.message : err);
    return { allowed: true };
  }
}