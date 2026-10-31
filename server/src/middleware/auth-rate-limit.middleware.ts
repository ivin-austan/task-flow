import type { RequestHandler } from "express";

const windowMs = 15 * 60 * 1000;
const limit = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

export const authRateLimit: RequestHandler = (request, response, next) => {
  const now = Date.now();
  const ip = request.ip ?? "unknown";
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    if (attempts.size >= 10_000) {
      for (const [key, value] of attempts) {
        if (value.resetAt <= now) attempts.delete(key);
      }
    }
    if (!current && attempts.size >= 10_000) {
      response.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many account requests. Try again in 15 minutes.",
        },
      });
      return;
    }
    attempts.set(ip, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (current.count >= limit) {
    response.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many account requests. Try again in 15 minutes.",
      },
    });
    return;
  }

  current.count += 1;
  next();
};
