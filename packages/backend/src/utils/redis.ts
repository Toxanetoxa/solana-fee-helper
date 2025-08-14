import Redis from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

export const redis: RedisType = new (Redis as unknown as { new (url: string): RedisType })(
    process.env.REDIS_URL || 'redis://127.0.0.1:6379'
);
