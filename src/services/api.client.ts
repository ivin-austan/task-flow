import { z } from "zod";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";
console.log("api", apiBaseUrl);

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(message: string, status: number, code: string, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  try {
    response = await fetch(`${apiBaseUrl}/api${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "The API could not be reached.";
    throw new ApiError(
      `Could not connect to the task API. ${message}`,
      0,
      "NETWORK_ERROR",
      error,
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      "The API returned an unreadable response.",
      response.status,
      "INVALID_RESPONSE",
      undefined,
    );
  }

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(body);
    throw new ApiError(
      parsedError.success
        ? parsedError.data.error.message
        : "The request failed.",
      response.status,
      parsedError.success ? parsedError.data.error.code : "API_ERROR",
      parsedError.success ? parsedError.data.error.details : undefined,
    );
  }

  return body;
}
