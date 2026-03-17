import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logger } from "./config/logger";

async function start(): Promise<void> {
  await connectDB();

  app.listen(Number(env.PORT), () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

start().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
