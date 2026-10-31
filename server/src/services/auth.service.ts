import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { db } from "../prisma/db.js";
import type { AuthenticatedUser } from "../types/auth.types.js";
import { sendVerificationEmail } from "./email-alert.service.js";

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const verificationLifetimeMs = 30 * 60 * 1000;

export class AuthenticationError extends Error {
  readonly status: 400 | 401 | 403 | 503;
  readonly code: string;

  constructor(
    message: string,
    status: 400 | 401 | 403 | 503,
    code: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
    this.status = status;
    this.code = code;
  }
}

export class EmailDeliveryUnavailableError extends Error {
  constructor() {
    super("Email delivery is not configured. Contact the administrator.");
    this.name = "EmailDeliveryUnavailableError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    saltHex === undefined ||
    hashHex === undefined ||
    !/^[a-f0-9]{32}$/.test(saltHex) ||
    !/^[a-f0-9]{128}$/.test(hashHex)
  ) {
    throw new Error("Stored password hash has an unsupported format.");
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), 64)) as Buffer;
  return timingSafeEqual(actual, expected);
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
}): AuthenticatedUser {
  return { id: user.id, email: user.email };
}

export async function registerUser(email: string, password: string): Promise<void> {
  const existing = await db.orm.public.User.first({ email });
  if (existing?.emailVerifiedAt) return;

  if (!process.env["SMTP_USER"] || !process.env["SMTP_PASSWORD"]) {
    throw new EmailDeliveryUnavailableError();
  }

  const passwordHash = existing?.passwordHash ?? (await hashPassword(password));
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + verificationLifetimeMs).toISOString();

  if (existing) {
    await db.orm.public.User.where((record) => record.id.eq(existing.id)).update({
      passwordHash,
      verificationTokenHash: tokenHash,
      verificationExpiresAt: expiresAt,
    });
  } else {
    await db.orm.public.User.create({
      email,
      passwordHash,
      verificationTokenHash: tokenHash,
      verificationExpiresAt: expiresAt,
    });
  }

  try {
    await sendVerificationEmail(email, token);
  } catch (error: unknown) {
    console.error("Verification email delivery failed.", error);
    throw new AuthenticationError(
      "The verification email could not be sent. Please try again.",
      503,
      "EMAIL_DELIVERY_FAILED",
    );
  }

}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const user = await db.orm.public.User.first({ verificationTokenHash: tokenHash });

  if (
    user === null ||
    user.verificationExpiresAt === null ||
    new Date(user.verificationExpiresAt).getTime() <= Date.now()
  ) {
    throw new AuthenticationError(
      "This verification link is invalid or has expired. Register again to get a new link.",
      400,
      "INVALID_VERIFICATION_TOKEN",
    );
  }

  await db.orm.public.User.where((record) => record.id.eq(user.id)).update({
    emailVerifiedAt: new Date().toISOString(),
    verificationTokenHash: null,
    verificationExpiresAt: null,
  });
}

export async function createSession(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthenticatedUser }> {
  const user = await db.orm.public.User.first({ email });
  if (user === null) {
    await hashPassword(password);
    throw new AuthenticationError(
      "Email or password is incorrect.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw new AuthenticationError(
      "Email or password is incorrect.",
      401,
      "INVALID_CREDENTIALS",
    );
  }
  if (user.emailVerifiedAt === null) {
    throw new AuthenticationError(
      "Verify your email address before signing in. Register again to receive a fresh link.",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }

  const token = randomBytes(32).toString("base64url");
  await db.orm.public.AuthSession.create({
    tokenHash: hashToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + sessionLifetimeMs).toISOString(),
  });

  return { token, user: toAuthenticatedUser(user) };
}

export async function findSessionUser(token: string): Promise<AuthenticatedUser | null> {
  const tokenHash = hashToken(token);
  const session = await db.orm.public.AuthSession.first({ tokenHash });
  if (session === null) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await db.orm.public.AuthSession.where((record) =>
      record.tokenHash.eq(tokenHash),
    ).delete();
    return null;
  }

  const user = await db.orm.public.User.first({ id: session.userId });
  if (user === null || user.emailVerifiedAt === null) return null;
  return toAuthenticatedUser(user);
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.orm.public.AuthSession.where((record) =>
    record.tokenHash.eq(tokenHash),
  ).delete();
}

export function getSessionLifetimeMs(): number {
  return sessionLifetimeMs;
}
