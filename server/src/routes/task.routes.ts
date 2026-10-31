import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  validateBody,
  validateBodyAndParams,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware.js";
import {
  createTaskSchema,
  taskIdParamsSchema,
  taskListQuerySchema,
  updateTaskRequestSchema,
} from "../validators/task.validator.js";
import {
  requireAuth,
  requireTrustedOrigin,
} from "../middleware/auth.middleware.js";

export const taskRouter = Router();

taskRouter.use(requireTrustedOrigin, requireAuth);
taskRouter.get(
  "/",
  validateQuery(taskListQuerySchema, taskController.list),
);
taskRouter.get(
  "/dashboard",
  asyncHandler(taskController.dashboard),
);
taskRouter.get(
  "/:id",
  validateParams(taskIdParamsSchema, taskController.getById),
);
taskRouter.post(
  "/",
  validateBody(createTaskSchema, taskController.create),
);
taskRouter.patch(
  "/:id",
  validateBodyAndParams(updateTaskRequestSchema, taskController.update),
);
taskRouter.delete(
  "/:id",
  validateParams(taskIdParamsSchema, taskController.remove),
);
