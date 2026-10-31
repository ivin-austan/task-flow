import "dotenv/config";
import { readFile } from "node:fs/promises";
import { TaskPriority, TaskStatus } from "../src/generated/prisma/client.js";
import { prisma } from "../src/config/database.js";
import { z } from "zod";

const seedTaskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});

const statuses: Record<
  "todo" | "in-progress" | "completed",
  TaskStatus
> = {
  todo: TaskStatus.TODO,
  "in-progress": TaskStatus.IN_PROGRESS,
  completed: TaskStatus.COMPLETED,
};
const priorities: Record<"low" | "medium" | "high", TaskPriority> = {
  low: TaskPriority.LOW,
  medium: TaskPriority.MEDIUM,
  high: TaskPriority.HIGH,
};

async function main(): Promise<void> {
  const existingCount = await prisma.task.count();
  if (existingCount > 0) {
    console.log("Database already has tasks; seed data was not inserted.");
    return;
  }

  const content = await readFile(
    new URL("../../src/data/tasks.json", import.meta.url),
    "utf8",
  );
  const raw: unknown = JSON.parse(content);
  const tasks = z.array(seedTaskSchema).parse(raw);

  await prisma.task.createMany({
    data: tasks.map((task) => ({
      title: task.title,
      description: task.description || null,
      status: statuses[task.status],
      priority: priorities[task.priority],
      dueDate: task.dueDate
        ? new Date(`${task.dueDate}T00:00:00.000Z`)
        : null,
    })),
  });
  console.log(`Inserted ${tasks.length} sample tasks.`);
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
