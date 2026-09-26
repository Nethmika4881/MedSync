import "server-only";
import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

let connection: Promise<typeof redisClient> | undefined;

export function getRedis() {
  connection ??= redisClient
    .connect()
    .then(() => redisClient)
    .catch((error) => {
      connection = undefined;
      throw error;
    });

  return connection;
}
