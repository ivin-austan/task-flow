import { z } from "zod";
import { apiRequest } from "./api.client";
import type { AuthUser } from "../types/auth.types";

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
});
const userResponseSchema = z.object({
  data: z.object({ user: userSchema }),
});
const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
});

export async function registerAccount(
  email: string,
  password: string,
): Promise<string> {
  const response = messageResponseSchema.parse(
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  );
  return response.data.message;
}

const verificationRequests = new Map<string, Promise<string>>();

export function verifyAccount(token: string): Promise<string> {
  const existing = verificationRequests.get(token);
  if (existing) return existing;

  const request = apiRequest("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
    .then((response) => messageResponseSchema.parse(response).data.message)
    .catch((error: unknown) => {
      verificationRequests.delete(token);
      throw error;
    });
  verificationRequests.set(token, request);
  return request;
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = userResponseSchema.parse(
    await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  );
  return response.data.user;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = userResponseSchema.parse(await apiRequest("/auth/me"));
  return response.data.user;
}

export async function signOut(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}
