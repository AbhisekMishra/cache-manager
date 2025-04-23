export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  fallback?: CacheProvider; // Fallback cache provider
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export enum CacheType {
  MEMORY_CACHE = 'MEMORY_CACHE',
  REDIS = 'REDIS',
  MONGODB = 'MONGODB',
  NO_CACHE = 'NO_CACHE'
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface MongoConfig {
  url: string;
  database: string;
  collection: string;
}

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt?: Date;
}