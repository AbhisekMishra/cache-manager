import { CacheProvider, CacheOptions, CacheType, RedisConfig, MongoConfig } from './types';
import { MemoryCacheProvider } from './providers/memory-cache';
import { RedisCacheProvider } from './providers/redis-cache';
import { MongoDBCacheProvider } from './providers/mongodb-cache';
import { NoCacheProvider } from './providers/no-cache';
import { logProviderSwitch } from './utils/logger';

export class CacheManager implements CacheProvider {
  private provider: CacheProvider;
  private fallbackProvider?: CacheProvider;

  constructor(
    redisConfig?: RedisConfig,
    mongoConfig?: MongoConfig,
    fallbackType?: CacheType
  ) {
    const cacheType = process.env.CACHE_TYPE as CacheType;
    this.provider = this.createProvider(cacheType, redisConfig, mongoConfig);

    if (fallbackType && fallbackType !== cacheType) {
      this.fallbackProvider = this.createProvider(fallbackType, redisConfig, mongoConfig);
    }
  }

  private createProvider(
    type: CacheType,
    redisConfig?: RedisConfig,
    mongoConfig?: MongoConfig
  ): CacheProvider {
    switch (type) {
      case CacheType.REDIS:
        if (!redisConfig) {
          throw new Error('Redis configuration is required for Redis cache provider');
        }
        return new RedisCacheProvider(redisConfig);

      case CacheType.MONGODB:
        if (!mongoConfig) {
          throw new Error('MongoDB configuration is required for MongoDB cache provider');
        }
        const mongoProvider = new MongoDBCacheProvider(mongoConfig);
        mongoProvider.initialize(); // Initialize MongoDB connection
        return mongoProvider;

      case CacheType.MEMORY_CACHE:
        return new MemoryCacheProvider();

      case CacheType.NO_CACHE:
        return new NoCacheProvider();

      default:
        // Default to no-cache if no specific type is configured
        return new NoCacheProvider();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.provider.get<T>(key);
      if (value !== null) return value;

      if (this.fallbackProvider) {
        logProviderSwitch('primary', 'fallback', 'Primary cache miss');
        const fallbackValue = await this.fallbackProvider.get<T>(key);
        if (fallbackValue !== null) {
          // Sync primary cache with fallback
          await this.provider.set(key, fallbackValue);
          return fallbackValue;
        }
      }

      return null;
    } catch (error) {
      if (this.fallbackProvider) {
        logProviderSwitch('primary', 'fallback', `Primary cache error: ${error.message}`);
        return this.fallbackProvider.get<T>(key);
      }
      throw error;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      await this.provider.set(key, value, options);
      if (this.fallbackProvider) {
        await this.fallbackProvider.set(key, value, options);
      }
    } catch (error) {
      if (this.fallbackProvider) {
        logProviderSwitch('primary', 'fallback', `Primary cache error: ${error.message}`);
        await this.fallbackProvider.set(key, value, options);
      } else {
        throw error;
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.provider.delete(key);
      if (this.fallbackProvider) {
        await this.fallbackProvider.delete(key);
      }
    } catch (error) {
      if (this.fallbackProvider) {
        logProviderSwitch('primary', 'fallback', `Primary cache error: ${error.message}`);
        await this.fallbackProvider.delete(key);
      } else {
        throw error;
      }
    }
  }

  async clear(): Promise<void> {
    try {
      await this.provider.clear();
      if (this.fallbackProvider) {
        await this.fallbackProvider.clear();
      }
    } catch (error) {
      if (this.fallbackProvider) {
        logProviderSwitch('primary', 'fallback', `Primary cache error: ${error.message}`);
        await this.fallbackProvider.clear();
      } else {
        throw error;
      }
    }
  }
}