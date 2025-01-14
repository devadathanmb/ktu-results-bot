import { TelegramError } from "telegraf";
import { Queue } from "bullmq";
import { Worker } from "bullmq";
import { JobData } from "types/types";
import db from "@/firebase/firestore";
import bot from "@/bot/bot";
import IORedis from "ioredis";
import Logger from "@/utils/logger";

const logger = Logger.getLogger("BULLMQ");

const connection = new IORedis({
  host: "redis-queue-db",
  maxRetriesPerRequest: null,
});

const queue = new Queue<JobData>("notify-user-queue", { connection });

// If there is any issue with initializing the queue, stop the bot and exit the process
queue.on("error", (err: any) => {
  if (
    (err.hasOwnProperty("code") && err.code === "ECONNREFUSED") ||
    err.code === "ENOTFOUND"
  ) {
    logger.error("Error connecting to the queue");
    process.exit(1);
  }
});

const worker = new Worker<JobData, number>(
  "notify-user-queue",
  async (job) => {
    const { chatId, fileLink, captionMsg, fileName } = job.data;

    try {
      if (!fileLink || !fileName) {
        await bot.telegram.sendMessage(chatId, captionMsg, {
          parse_mode: "HTML",
        });
      } else {
        await bot.telegram.sendDocument(chatId, fileLink, {
          caption: captionMsg,
          parse_mode: "HTML",
        });
      }
      return job.data.chatId;
    } catch (error: any) {
      if (error instanceof TelegramError) {
        if (error.code === 429) {
          const retryAfter = error.parameters?.retry_after!;
          logger.debug(
            `Telegram rate limit hit. Pausing broadcast for ${retryAfter}s`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000 + 2000)
          );
          await job.retry();
          return job.data.chatId;
        } else if (error.code === 403 || error.code === 400) {
          try {
            const usersRef = db.collection("subscribedUsers");
            await usersRef.doc(chatId.toString()).delete();
          } catch (error) {
            logger.error(`DB error: ${error}`);
          }
        } else {
          logger.error(`Worker error: ${error}`);
        }
      }
      return job.data.chatId;
    }
  },
  { connection }
);

worker.on("completed", async (_job, result) => {
  logger.info(`Message sent successfully for chatId: ${result}`);
});

worker.on("failed", async (_job, err) => {
  logger.error(`Job failed with error: ${err}`);
});

worker.on("error", (err) => {
  logger.error(`Worker error: ${err}`);
});

export default queue;
