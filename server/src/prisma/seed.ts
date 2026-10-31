import "dotenv/config";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { db } from "./db.js";

const seedTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});

const statuses = {
  todo: "TODO",
  "in-progress": "IN_PROGRESS",
  completed: "COMPLETED",
} as const;
const priorities = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
} as const;

async function main(): Promise<void> {
  const existingCount = await db.orm.public.Task.aggregate((aggregate) => ({
    count: aggregate.count(),
  }));
  if (existingCount.count > 0) {
    console.log("Database already has tasks; seed data was not inserted.");
    return;
  }

  const content = await readFile(
    new URL("../../../src/data/tasks.json", import.meta.url),
    "utf8",
  );
  const raw: unknown = JSON.parse(content);
  const tasks = z.array(seedTaskSchema).parse(raw);

  for (const task of tasks) {
    await db.orm.public.Task.create({
      title: task.title,
      description: task.description || null,
      status: statuses[task.status],
      priority: priorities[task.priority],
      dueDate: task.dueDate || null,
    });
  }
  console.log(`Inserted ${tasks.length} sample tasks.`);
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  } finally {
    try {
      await db.close();
    } catch (error: unknown) {
      console.error("Database shutdown failed.", error);
      process.exitCode = 1;
    }
  }
}

void run();
