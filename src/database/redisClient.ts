import { createClient } from 'redis';
import pino from 'pino';

const logger = pino();

class RedisClient {
  private client: any;
  private isConnected = false;

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err: any) => {
        logger.error('Redis Client Error:', err);
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('✅ Redis disconnected');
      }
    } catch (error) {
      logger.error('❌ Redis disconnection failed:', error);
    }
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string) {
    return this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string) {
    return this.client.setEx(key, seconds, value);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async hget(hash: string, field: string) {
    return this.client.hGet(hash, field);
  }

  async hset(hash: string, field: string, value: string) {
    return this.client.hSet(hash, field, value);
  }

  isConnected(): boolean {
    return this.isConnected;
  }
}

export const redisClient = new RedisClient();