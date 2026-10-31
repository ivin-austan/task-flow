import { ZodError } from "zod";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { TaskNotFoundError } from "../services/task.service.js";
import {
  AuthenticationError,
  EmailDeliveryUnavailableError,
} from "../services/auth.service.js";
import { AuthenticationRequiredError } from "./auth.middleware.js";

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: { code: "NOT_FOUND", message: "The requested API route was not found." },
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  void _next;
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof TaskNotFoundError) {
    response.status(404).json({
      error: { code: "TASK_NOT_FOUND", message: error.message },
    });
    return;
  }

  if (error instanceof AuthenticationError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof EmailDeliveryUnavailableError) {
    response.status(503).json({
      error: { code: "EMAIL_DELIVERY_UNAVAILABLE", message: error.message },
    });
    return;
  }

  if (error instanceof AuthenticationRequiredError) {
    response.status(401).json({
      error: { code: "UNAUTHENTICATED", message: error.message },
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body must contain valid JSON." },
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    response.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the 32kb limit." },
    });
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }
  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "The server could not complete the request.",
    },
  });
};
