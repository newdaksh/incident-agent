import { createClient, RedisClientType } from "redis";
import { logger } from "./logger";

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.error("Redis reconnection failed after 3 attempts");
            return false; // Stop reconnecting
          }
          return Math.min(retries * 50, 500);
        },
      },
    });

    redisClient.on("error", (error) => {
      logger.error("Redis connection error:", error);
    });

    redisClient.on("connect", () => {
      logger.info("🔗 Redis connecting...");
    });

    redisClient.on("ready", () => {
      logger.info("⚡ Redis connected and ready");
    });

    redisClient.on("end", () => {
      logger.info("Redis connection ended");
    });

    await redisClient.connect();
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient || !redisClient.isReady) {
    throw new Error(
      "Redis client not available. Redis connection may have failed."
    );
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info("Redis disconnected successfully");
    }
  } catch (error) {
    logger.error("Error disconnecting from Redis:", error);
    throw error;
  }
};

// Helper functions for common Redis operations
export const setCache = async (
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> => {
  try {
    const client = getRedisClient();
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    logger.error("Error setting cache:", error);
    throw error;
  }
};

export const getCache = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (error) {
    logger.error("Error getting cache:", error);
    throw error;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error("Error deleting cache:", error);
    throw error;
  }
};

export const setCacheHash = async (
  key: string,
  field: string,
  value: string
): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.hSet(key, field, value);
  } catch (error) {
    logger.error("Error setting cache hash:", error);
    throw error;
  }
};

export const getCacheHash = async (
  key: string,
  field: string
): Promise<string | undefined> => {
  try {
    const client = getRedisClient();
    return await client.hGet(key, field);
  } catch (error) {
    logger.error("Error getting cache hash:", error);
    throw error;
  }
};
