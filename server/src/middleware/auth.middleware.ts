import type { RequestHandler } from "express";
import {
  AuthenticationError,
  findSessionUser,
} from "../services/auth.service.js";

export const sessionCookieName = "taskflow_session";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Sign in to access this resource.");
    this.name = "AuthenticationRequiredError";
  }
}

export function getAuthenticatedUser(request: Express.Request) {
  if (!request.user) throw new AuthenticationRequiredError();
  return request.user;
}

export function getSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`));

  return pair?.slice(sessionCookieName.length + 1) || null;
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = getSessionToken(request.headers.cookie);
    if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) {
      next(new AuthenticationRequiredError());
      return;
    }

    const user = await findSessionUser(token);
    if (!user) {
      next(new AuthenticationRequiredError());
      return;
    }

    request.user = user;
    next();
  } catch (error: unknown) {
    next(error);
  }
};

export const requireTrustedOrigin: RequestHandler = (request, _response, next) => {
  if (request.method === "GET" || request.method === "HEAD") {
    next();
    return;
  }

  const origin = request.get("origin");
  const expectedOrigin = process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";
  if (!origin || origin !== expectedOrigin) {
    next(
      new AuthenticationError(
        "Request origin is not allowed.",
        403,
        "ORIGIN_NOT_ALLOWED",
      ),
    );
    return;
  }
  next();
};

export function setSessionCookie(
  response: import("express").Response,
  token: string,
): void {
  const secure = process.env["NODE_ENV"] === "production";
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(
  response: import("express").Response,
): void {
  const secure = process.env["NODE_ENV"] === "production";
  response.clearCookie(sessionCookieName, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  });
}
