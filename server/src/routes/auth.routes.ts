import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
  requireAuth,
  requireTrustedOrigin,
} from "../middleware/auth.middleware.js";
import { authRateLimit } from "../middleware/auth-rate-limit.middleware.js";
import {
  validateBody,
} from "../middleware/validation.middleware.js";
import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  requireTrustedOrigin,
  authRateLimit,
  validateBody(registerSchema, authController.register),
);
authRouter.post(
  "/verify",
  requireTrustedOrigin,
  authRateLimit,
  validateBody(verifyEmailSchema, authController.verify),
);
authRouter.post(
  "/login",
  requireTrustedOrigin,
  authRateLimit,
  validateBody(loginSchema, authController.login),
);
authRouter.get("/me", requireAuth, authController.currentUser);
authRouter.post("/logout", requireTrustedOrigin, requireAuth, authController.logout);
