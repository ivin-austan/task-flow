import nodemailer from "nodemailer";
import type { Models } from "../prisma/contract.js";

type TaskRecord = Models.public_Task;

interface EmailAlertConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  timeZone: string;
}

function getEmailAlertConfig(): EmailAlertConfig | null {
  const user = process.env["SMTP_USER"]?.trim() ?? "";
  const password = process.env["SMTP_PASSWORD"]?.replace(/\s/g, "") ?? "";

  if (!user && !password) {
    return null;
  }
  if (!user || !password) {
    throw new Error("Email delivery requires both SMTP_USER and SMTP_PASSWORD.");
  }

  const host = process.env["SMTP_HOST"]?.trim() || "smtp.gmail.com";
  const port = Number(process.env["SMTP_PORT"] ?? 465);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
    throw new Error("SMTP_USER must be a valid email address.");
  }
  const timeZone = process.env["ALERT_TIMEZONE"]?.trim() || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new Error("ALERT_TIMEZONE must be a valid IANA timezone.");
  }

  return { host, port, user, password, timeZone };
}

const config = getEmailAlertConfig();
const transporter = config
  ? nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.password },
    })
  : null;

export function emailDeliveryEnabled(): boolean {
  return config !== null;
}

export function getAlertTimeZone(): string {
  return config?.timeZone ?? "UTC";
}

async function sendEmail(
  recipient: string,
  subject: string,
  text: string,
): Promise<void> {
  if (!config || !transporter) {
    throw new Error("Email delivery is not configured.");
  }

  await transporter.sendMail({
    from: config.user,
    to: recipient,
    subject,
    text,
  });
}

async function sendTaskAlert(
  subject: string,
  task: TaskRecord,
  message: string,
): Promise<void> {
  if (!config || !transporter) return;
  if (!task.ownerEmail) {
    throw new Error(`Task ${task.id} has no owner email for alert delivery.`);
  }

  const details = [
    `Task: ${task.title}`,
    `Status: ${task.status.toLowerCase().replace("_", " ")}`,
    `Priority: ${task.priority.toLowerCase()}`,
    ...(task.dueDate ? [`Due date: ${task.dueDate}`] : []),
    ...(task.description ? [`Description: ${task.description}`] : []),
  ];

  await sendEmail(
    task.ownerEmail,
    `${subject}: ${task.title.replace(/[\r\n]/g, " ")}`,
    `${message}\n\n${details.join("\n")}`,
  );
}

export async function sendVerificationEmail(
  recipient: string,
  token: string,
): Promise<void> {
  if (!config || !transporter) {
    throw new Error("Email delivery is not configured.");
  }
  const origin = process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";
  const verificationUrl = new URL("/", origin);
  verificationUrl.searchParams.set("verifyToken", token);
  await sendEmail(
    recipient,
    "Verify your Taskflow account",
    `Verify your email address by opening this link within 30 minutes:\n\n${verificationUrl.toString()}\n\nIf you did not request this account, you can ignore this email.`,
  );
}

export function sendDueDateAlert(task: TaskRecord): Promise<void> {
  return sendTaskAlert("Task due today", task, "This task is due today.");
}

export function sendOverdueAlert(task: TaskRecord): Promise<void> {
  return sendTaskAlert("Task overdue", task, "This unfinished task is overdue.");
}

export function sendTaskCompletedAlert(task: TaskRecord): Promise<void> {
  return sendTaskAlert("Task completed", task, "You marked this task as completed.");
}
