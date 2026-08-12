import { NextResponse } from "next/server";
import prisma from "@/server/db/client";
import { logger } from "@/server/services/logger";

export async function GET() {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    logger.error("Health check: database connection failed", { error });
  }

  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const { createClient } = await import("redis");
      const client = createClient({ url: redisUrl });
      await client.connect();
      await client.ping();
      await client.quit();
      checks.redis = true;
    }
  } catch (error) {
    logger.error("Health check: redis connection failed", { error });
  }

  const allHealthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}