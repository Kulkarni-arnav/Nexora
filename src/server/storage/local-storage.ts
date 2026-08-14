import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AppError } from "@/server/validation/errors";
import type { StorageProvider } from "./types";

const STORAGE_ROOT =
  process.env.STORAGE_LOCAL_ROOT ?? path.join(process.cwd(), "storage");

function safeResolve(key: string): string {
  const normalized = path.normalize(key).replace(/^([/\\])+/, "");
  const resolved = path.resolve(STORAGE_ROOT, normalized);
  const rootWithSep = STORAGE_ROOT.endsWith(path.sep)
    ? STORAGE_ROOT
    : `${STORAGE_ROOT}${path.sep}`;
  if (resolved !== STORAGE_ROOT && !resolved.startsWith(rootWithSep)) {
    throw new AppError("Invalid storage key", "INVALID_STORAGE_KEY", 400);
  }
  return resolved;
}

export class LocalStorageProvider implements StorageProvider {
  async put(key: string, data: Buffer): Promise<void> {
    const target = safeResolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data, { mode: 0o600, flag: "w" });
  }

  async get(key: string): Promise<Buffer | null> {
    const target = safeResolve(key);
    try {
      return await fs.readFile(/* turbopackIgnore: true */ target);
    } catch (error) {
      if (isFileNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const target = safeResolve(key);
    try {
      await fs.unlink(target);
    } catch (error) {
      if (!isFileNotFound(error)) {
        throw error;
      }
    }
  }

  async deletePrefix(prefix: string): Promise<void> {
    const target = safeResolve(prefix);
    try {
      const stat = await fs.stat(/* turbopackIgnore: true */ target);
      if (!stat.isDirectory()) {
        await fs.rm(target, { force: true });
        return;
      }
      await fs.rm(target, { recursive: true, force: true });
    } catch (error) {
      if (!isFileNotFound(error)) {
        throw error;
      }
    }
  }
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "ENOENT"
  );
}
