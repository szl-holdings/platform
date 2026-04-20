import Redis from 'ioredis';
import { logger } from './logger.js';

let _client: Redis | null = null;
let _initialized = false;

export function getRedisClient(): Redis | null {
  if (_initialized) return _client;
  _initialized = true;

  const url = process.env.REDIS_URL ?? process.env.AZURE_REDIS_CONNECTION_STRING;
  if (!url) return null;

  try {
    _client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    _client.on('error', (err: Error) => {
      logger.warn({ err: err.message }, 'Redis connection error');
    });
    logger.info('Redis client initialized');
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Redis client — using DB/LRU cache only');
    _client = null;
  }
  return _client;
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const val = await client.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function redisSet(key: string, data: unknown, ttlMs: number): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(data), 'PX', ttlMs);
  } catch {}
}

export async function redisDel(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch {}
}

export function isRedisAvailable(): boolean {
  const client = getRedisClient();
  return client !== null && client.status === 'ready';
}

export async function pingRedis(): Promise<void> {
  const url = process.env.REDIS_URL ?? process.env.AZURE_REDIS_CONNECTION_STRING;
  if (!url) {
    logger.info('[redis] REDIS_URL not set — cache layer: DB/LRU fallback only');
    return;
  }
  const client = getRedisClient();
  if (!client) {
    logger.warn('[redis] Redis client failed to initialize — cache layer: DB/LRU fallback only');
    return;
  }
  try {
    await client.ping();
    logger.info('[redis] Redis connected — cache layer: Redis primary + DB/LRU fallback');
  } catch (err) {
    logger.warn(
      { err },
      '[redis] Redis ping failed at startup — cache layer: DB/LRU fallback until Redis recovers',
    );
  }
}
