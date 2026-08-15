export const EMBEDDING_VERSION = 1;

export interface EmbeddingProvider {
  readonly model: string;
  readonly dimensions: number;
  readonly maxBatchSize: number;
  embed(texts: string[]): Promise<number[][]>;
}