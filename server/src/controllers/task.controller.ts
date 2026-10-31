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

export async function list(
  _request: Request,
  response: Response,
  _next: NextFunction,
  query: TaskListQuery,
): Promise<void> {
  response.json(await listTasks(query));
}

export async function getById(
  _request: Request,
  response: Response,
  _next: NextFunction,
  params: TaskIdParams,
): Promise<void> {
  response.json({ data: await getTask(params.id) });
}

export async function create(
  _request: Request,
  response: Response,
  _next: NextFunction,
  body: CreateTaskBody,
): Promise<void> {
  response.status(201).json({ data: await createTask(body) });
}

export async function update(
  _request: Request,
  response: Response,
  _next: NextFunction,
  values: { params: TaskIdParams; body: UpdateTaskBody },
): Promise<void> {
  response.json({ data: await updateTask(values.params.id, values.body) });
}

export async function remove(
  _request: Request,
  response: Response,
  _next: NextFunction,
  params: TaskIdParams,
): Promise<void> {
  await removeTask(params.id);
  response.status(204).end();
}

export async function dashboard(_request: Request, response: Response): Promise<void> {
  response.json({ data: await getDashboardStatistics() });
}
