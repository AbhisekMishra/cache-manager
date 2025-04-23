import { CacheProvider, CacheOptions } from '../types';

export class NoCacheProvider implements CacheProvider {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(_key: string, _value: T, _options?: CacheOptions): Promise<void> {
    // No-op
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    // No-op
  }
}