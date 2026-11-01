import { z } from "zod";

const emailSchema = z
  .email()
  .trim()
  .toLowerCase()
  .max(254);

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(40).max(50),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailSchema>;
