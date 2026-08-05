import { createClient } from "redis";

/**
 * Service to handle Redis connections and caching operations gracefully.
 * Provides a fallback mechanism when Redis is unavailable.
 */
class RedisService {
  constructor() {
    this.isConnected = false;

    // ==> Bypass Redis connection in testing environment to prevent errors
    if (process.env.NODE_ENV === "test") {
      return;
    }

    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });


    this.client.on("error", (err) => {
      console.error("Redis Client Error", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("Redis connected successfully");
      this.isConnected = true;
    });

    // Try to connect, but don't crash if it fails
    this.client.connect().catch((err) => {
      console.error("Failed to connect to Redis initially", err);
    });
  }

  /**
   * Retrieve a value from the Redis cache by key.
   *
   * @param {string} key - The cache key to retrieve.
   * @returns {Promise<any|null>} The parsed JSON data if found, or null if missing/disconnected.
   */
  async get(key) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Save a value to the Redis cache with an expiration time.
   *
   * @param {string} key - The cache key to store data under.
   * @param {any} value - The data to store (will be stringified to JSON).
   * @param {number} [expInSeconds=3600] - Expiration time in seconds (default 1 hour).
   * @returns {Promise<void>}
   */
  async set(key, value, expInSeconds = 3600) {
    if (!this.isConnected) return;
    try {
      await this.client.setEx(key, expInSeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete a specific key from the Redis cache.
   *
   * @param {string} key - The cache key to delete.
   * @returns {Promise<void>}
   */
  async del(key) {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a specific pattern.
   *
   * @param {string} pattern - The pattern to match keys against (e.g., 'project:*').
   * @returns {Promise<void>}
   */
  async deleteByPattern(pattern) {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Redis deleteByPattern error for pattern ${pattern}:`, error);
    }
  }
}

export default new RedisService();
