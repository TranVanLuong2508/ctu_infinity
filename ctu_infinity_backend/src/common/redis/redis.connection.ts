import { ConnectionOptions } from 'bullmq';

export function createRedisConnection(): ConnectionOptions {
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;
  const tls = process.env.REDIS_TLS === 'true';

  return {
    host,
    port,
    password,
    tls: tls ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}
