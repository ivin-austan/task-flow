import "dotenv/config";
import { app } from "./app.js";
import { db } from "./prisma/db.js";

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

async function start(): Promise<void> {
  try {
    await db.connect();
    await db.orm.public.Task.aggregate((aggregate) => ({
      taskCount: aggregate.count(),
    }));
  } catch (error: unknown) {
    console.error("Database connection failed.", error);
    process.exitCode = 1;
    return;
  }

  console.log("Connected to the database.");
  const server = app.listen(port, () => {
    console.log(`Task API listening on http://localhost:${port}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} received; shutting down.`);
    server.close(async (error) => {
      if (error) {
        console.error("HTTP server shutdown failed.", error);
        process.exitCode = 1;
      }
      try {
        await db.close();
      } catch (shutdownError: unknown) {
        console.error("Database shutdown failed.", shutdownError);
        process.exitCode = 1;
      }
    });
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

void start();
