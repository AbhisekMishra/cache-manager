import Redis from 'ioredis';
import { CacheProvider, CacheOptions, RedisConfig } from '../types';
import { withTimeout } from '../utils/timeout';

export class RedisCacheProvider implements CacheProvider {
  private client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await withTimeout(this.client.get(key));
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    if (options?.ttl) {
      await withTimeout(this.client.setex(key, options.ttl, serializedValue));
    } else {
      await withTimeout(this.client.set(key, serializedValue));
    }
  }

  async delete(key: string): Promise<void> {
    await withTimeout(this.client.del(key));
  }

  async clear(): Promise<void> {
    await withTimeout(this.client.flushdb());
  }

  async disconnect(): Promise<void> {
    await withTimeout(this.client.quit());
  }
}