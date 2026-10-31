import type { NextFunction, Request, Response } from "express";
import type {
  CreateTaskBody,
  TaskIdParams,
  TaskListQuery,
  UpdateTaskBody,
} from "../validators/task.validator.js";
import {
  createTask,
  getDashboardStatistics,
  getTask,
  listTasks,
  removeTask,
  updateTask,
} from "../services/task.service.js";
import { getAuthenticatedUser } from "../middleware/auth.middleware.js";

export async function list(
  _request: Request,
  response: Response,
  _next: NextFunction,
  query: TaskListQuery,
): Promise<void> {
  response.json(await listTasks(query, getAuthenticatedUser(_request).email));
}

export async function getById(
  _request: Request,
  response: Response,
  _next: NextFunction,
  params: TaskIdParams,
): Promise<void> {
  response.json({
    data: await getTask(params.id, getAuthenticatedUser(_request).email),
  });
}

export async function create(
  _request: Request,
  response: Response,
  _next: NextFunction,
  body: CreateTaskBody,
): Promise<void> {
  response.status(201).json({
    data: await createTask(body, getAuthenticatedUser(_request).email),
  });
}

export async function update(
  _request: Request,
  response: Response,
  _next: NextFunction,
  values: { params: TaskIdParams; body: UpdateTaskBody },
): Promise<void> {
  response.json({
    data: await updateTask(
      values.params.id,
      values.body,
      getAuthenticatedUser(_request).email,
    ),
  });
}

export async function remove(
  _request: Request,
  response: Response,
  _next: NextFunction,
  params: TaskIdParams,
): Promise<void> {
  await removeTask(params.id, getAuthenticatedUser(_request).email);
  response.status(204).end();
}

export async function dashboard(request: Request, response: Response): Promise<void> {
  response.json({
    data: await getDashboardStatistics(getAuthenticatedUser(request).email),
  });
}
