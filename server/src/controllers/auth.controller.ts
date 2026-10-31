import type { NextFunction, Request, Response } from "express";
import {
  AuthenticationError,
  createSession,
  deleteSession,
  getSessionLifetimeMs,
  registerUser,
  verifyEmail,
} from "../services/auth.service.js";
import {
  clearSessionCookie,
  getAuthenticatedUser,
  getSessionToken,
  setSessionCookie,
} from "../middleware/auth.middleware.js";
import type {
  LoginBody,
  RegisterBody,
  VerifyEmailBody,
} from "../validators/auth.validator.js";

export async function register(
  _request: Request,
  response: Response,
  _next: NextFunction,
  body: RegisterBody,
): Promise<void> {
  await registerUser(body.email, body.password);
  response.status(202).json({
    data: {
      message: "If this address can be registered, a verification email has been sent.",
    },
  });
}

export async function verify(
  _request: Request,
  response: Response,
  _next: NextFunction,
  body: VerifyEmailBody,
): Promise<void> {
  await verifyEmail(body.token);
  response.json({ data: { message: "Email verified. You can now sign in." } });
}

export async function login(
  _request: Request,
  response: Response,
  _next: NextFunction,
  body: LoginBody,
): Promise<void> {
  const { token, user } = await createSession(body.email, body.password);
  setSessionCookie(response, token);
  response.json({ data: { user, expiresInMs: getSessionLifetimeMs() } });
}

export async function currentUser(request: Request, response: Response): Promise<void> {
  response.json({ data: { user: getAuthenticatedUser(request) } });
}

export async function logout(request: Request, response: Response): Promise<void> {
  const token = getSessionToken(request.headers.cookie);
  if (!token) {
    throw new AuthenticationError("You are not signed in.", 401, "UNAUTHENTICATED");
  }

  await deleteSession(token);
  clearSessionCookie(response);
  response.status(204).end();
}
