import { CacheProvider, CacheOptions, CacheEntry } from '../types';

import { withTimeout } from '../utils/timeout';

export class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, CacheEntry>;

  constructor() {
    this.cache = new Map<string, CacheEntry>();
  }

  async get<T>(key: string): Promise<T | null> {
    return withTimeout(async () => {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return null;
      }

      if (entry.expiresAt && entry.expiresAt < new Date()) {
        this.cache.delete(key);
        return null;
      }

      return entry.value as T;
    }());
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    return withTimeout(async () => {
      const entry: CacheEntry = {
        key,
        value,
        expiresAt: options?.ttl ? new Date(Date.now() + options.ttl * 1000) : undefined
      };

      this.cache.set(key, entry);
    }());
  }

  async delete(key: string): Promise<void> {
    return withTimeout(async () => {
      this.cache.delete(key);
    }());
  }

  async clear(): Promise<void> {
    return withTimeout(async () => {
      this.cache.clear();
    }());
  }
}