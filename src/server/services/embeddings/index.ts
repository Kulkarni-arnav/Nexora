import "server-only";
import { env } from "@/lib/env";
import { AppError } from "@/server/validation/errors";
import { EMBEDDING_MODEL } from "./config";
import { GeminiEmbeddingProvider } from "./gemini-provider";
import type { EmbeddingProvider } from "./types";

export { EMBEDDING_VERSION } from "./types";
export type { EmbeddingProvider } from "./types";

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      "Embedding service is not configured",
      "EMBEDDING_NOT_CONFIGURED",
      503
    );
  }
  return new GeminiEmbeddingProvider(env.GEMINI_API_KEY, EMBEDDING_MODEL);
}