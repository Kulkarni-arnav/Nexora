import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { AppError } from "@/server/validation/errors";

export const LLM_MODEL = "gemini-3.6-flash";

export function getLlmClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      "LLM service is not configured",
      "LLM_NOT_CONFIGURED",
      503
    );
  }
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}