import "dotenv/config";

interface EnvConfig {
  DATABASE_URL: string;
  REDIS_URL: string;
  AUTH_SECRET: string;
  GEMINI_API_KEY: string;
  STORAGE_ENDPOINT: string;
  STORAGE_ACCESS_KEY: string;
  STORAGE_SECRET_KEY: string;
  STORAGE_BUCKET: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NODE_ENV: string;
}

const requiredServerEnvVars = [
  "DATABASE_URL",
  "REDIS_URL",
  "AUTH_SECRET",
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _optionalServerEnvVars = [
  "GEMINI_API_KEY",
  "STORAGE_ENDPOINT",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_BUCKET",
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _clientEnvVars = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_APP_NAME",
] as const;

function validateEnv(): EnvConfig {
  const missing: string[] = [];

  for (const key of requiredServerEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    AUTH_SECRET: process.env.AUTH_SECRET!,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT ?? "",
    STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY ?? "",
    STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY ?? "",
    STORAGE_BUCKET: process.env.STORAGE_BUCKET ?? "nexora",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "NEXORA AI",
    NODE_ENV: process.env.NODE_ENV ?? "development",
  };
}

export const env = validateEnv();

export type ServerEnv = Pick<
  EnvConfig,
  | "DATABASE_URL"
  | "REDIS_URL"
  | "AUTH_SECRET"
  | "GEMINI_API_KEY"
  | "STORAGE_ENDPOINT"
  | "STORAGE_ACCESS_KEY"
  | "STORAGE_SECRET_KEY"
  | "STORAGE_BUCKET"
  | "NODE_ENV"
>;

export type ClientEnv = Pick<
  EnvConfig,
  "NEXT_PUBLIC_APP_URL" | "NEXT_PUBLIC_APP_NAME"
>;

export function getClientEnv(): ClientEnv {
  return {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  };
}