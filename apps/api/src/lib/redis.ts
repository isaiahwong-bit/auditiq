const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = {
  url: redisUrl,
};

// Re-export as IORedis-compatible options for BullMQ
export function getRedisOptions() {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    maxRetriesPerRequest: null as null,
  };
}
