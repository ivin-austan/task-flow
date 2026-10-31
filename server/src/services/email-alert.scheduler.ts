import { and } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";
import {
  emailDeliveryEnabled,
  getAlertTimeZone,
  sendDueDateAlert,
  sendOverdueAlert,
} from "./email-alert.service.js";

const scanIntervalMs = 60_000;
const retryIntervalMs = 60 * 60_000;
const attemptedAlerts = new Map<string, number>();
const sentAlerts = new Set<string>();

let timer: NodeJS.Timeout | undefined;
let scanInProgress = false;

function getLocalTime(now: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: getAlertTimeZone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

async function sendOnce(
  key: string,
  taskId: string,
  send: () => Promise<void>,
  now: number,
): Promise<void> {
  if (sentAlerts.has(key)) return;
  const lastAttempt = attemptedAlerts.get(key);
  if (lastAttempt !== undefined && now - lastAttempt < retryIntervalMs) return;

  attemptedAlerts.set(key, now);
  try {
    await send();
    sentAlerts.add(key);
  } catch (error: unknown) {
    console.error(`Email alert delivery failed for task ${taskId}.`, error);
  }
}

async function scanDueTasks(): Promise<void> {
  if (scanInProgress) return;
  scanInProgress = true;

  try {
    const now = new Date();
    const nowMs = now.getTime();
    const { date, hour } = getLocalTime(now);
    const tasks = await db.orm.public.Task
      .where((task) =>
        and(
          task.dueDate.isNotNull(),
          task.ownerEmail.isNotNull(),
          task.status.neq("COMPLETED"),
        ),
      )
      .all();

    for (const task of tasks) {
      if (task.dueDate === null) continue;

      if (task.dueDate === date && hour >= 9) {
        await sendOnce(
          `due:${task.id}:${task.dueDate}`,
          task.id,
          () => sendDueDateAlert(task),
          nowMs,
        );
      } else if (task.dueDate < date) {
        await sendOnce(
          `overdue:${task.id}:${date}:${hour}`,
          task.id,
          () => sendOverdueAlert(task),
          nowMs,
        );
      }
    }

    for (const [key, attemptedAt] of attemptedAlerts) {
      if (nowMs - attemptedAt > 48 * 60 * 60_000) {
        attemptedAlerts.delete(key);
        sentAlerts.delete(key);
      }
    }
  } finally {
    scanInProgress = false;
  }
}

export function startEmailAlertScheduler(): void {
  if (!emailDeliveryEnabled()) {
    console.info(
      "Email alerts are disabled. Configure SMTP_USER and SMTP_PASSWORD to enable them.",
    );
    return;
  }
  if (timer) return;

  void scanDueTasks().catch((error: unknown) => {
    console.error("Email alert scheduler failed to scan tasks.", error);
  });
  timer = setInterval(() => {
    void scanDueTasks().catch((error: unknown) => {
      console.error("Email alert scheduler failed to scan tasks.", error);
    });
  }, scanIntervalMs);
  timer.unref();
}

export function stopEmailAlertScheduler(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = undefined;
}
