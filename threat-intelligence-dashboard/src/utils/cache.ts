type CacheEntry = {
  data: any;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

export function getCache(key: string) {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache(key: string, data: any, ttlMs: number) {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}
