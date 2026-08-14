import "server-only";
import { LocalStorageProvider } from "./local-storage";
import type { StorageProvider } from "./types";

let storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storage) {
    storage = new LocalStorageProvider();
  }
  return storage;
}