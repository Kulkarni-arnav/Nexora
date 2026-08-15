import "server-only";
import { GoogleGenAI } from "@google/genai";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MAX_BATCH_SIZE,
  EMBEDDING_MODEL,
} from "./config";
import type { EmbeddingProvider } from "./types";

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  readonly maxBatchSize: number;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string, model: string = EMBEDDING_MODEL) {
    this.model = model;
    this.dimensions = EMBEDDING_DIMENSIONS;
    this.maxBatchSize = EMBEDDING_MAX_BATCH_SIZE;
    this.client = new GoogleGenAI({ apiKey });
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.client.models.embedContent({
      model: this.model,
      contents: texts.map((text) => text.trim()),
      config: { outputDimensionality: this.dimensions },
    });

    return (response.embeddings ?? []).map(
      (embedding) => embedding.values ?? []
    );
  }
}