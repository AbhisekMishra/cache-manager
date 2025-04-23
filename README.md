# tbk-cache

A flexible TypeScript caching library that supports multiple storage providers (Memory, Redis, MongoDB) with fallback capabilities.

## Features

- Multiple cache storage options: In-Memory, Redis, and MongoDB
- Fallback mechanism between different cache providers
- TypeScript support with type definitions
- Configurable TTL (Time To Live) for cache entries
- Easy to use API with async/await support

## Installation

```bash
npm install tbk-cache
```

## Usage

### Basic Usage

```typescript
import { CacheManager, CacheType } from 'tbk-cache';

// Set the cache type using environment variable
process.env.CACHE_TYPE = 'REDIS';

const cacheManager = new CacheManager(
  // Redis configuration
  {
    host: 'localhost',
    port: 6379
  },
  // MongoDB configuration (if needed)
  {
    url: 'mongodb://localhost:27017',
    database: 'cache_db',
    collection: 'cache'
  },
  // Optional fallback cache type
  CacheType.MEMORY_CACHE
);

// Using the cache
async function example() {
  // Set a value
  await cacheManager.set('key', { data: 'value' }, { ttl: 3600 }); // TTL in seconds

  // Get a value
  const value = await cacheManager.get('key');

  // Delete a value
  await cacheManager.delete('key');

  // Clear all cache
  await cacheManager.clear();
}
```

### Environment Variables

Set the `CACHE_TYPE` environment variable to one of:
- `MEMORY_CACHE` (default)
- `REDIS`
- `MONGODB`

### Cache Provider Configurations

#### Redis Configuration

```typescript
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}
```

#### MongoDB Configuration

```typescript
interface MongoConfig {
  url: string;
  database: string;
  collection: string;
}
```

## License

MIT