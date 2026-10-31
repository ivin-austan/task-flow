import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import type { z } from "zod";

type ValidatedHandler<T> = (
  request: Request,
  response: Response,
  next: NextFunction,
  value: T,
) => Promise<void>;

function validate<TSchema extends z.ZodType>(
  schema: TSchema,
  source: "body" | "query" | "params" | "bodyAndParams",
  handler: ValidatedHandler<z.infer<TSchema>>,
): RequestHandler {
  return async (request, response, next) => {
    try {
      const input =
        source === "body"
          ? request.body
          : source === "query"
            ? request.query
            : source === "params"
              ? request.params
              : { body: request.body, params: request.params };
      const value = await schema.parseAsync(input);
      await handler(request, response, next, value);
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const validateBody = <TSchema extends z.ZodType>(
  schema: TSchema,
  handler: ValidatedHandler<z.infer<TSchema>>,
) => validate(schema, "body", handler);

export const validateQuery = <TSchema extends z.ZodType>(
  schema: TSchema,
  handler: ValidatedHandler<z.infer<TSchema>>,
) => validate(schema, "query", handler);

export const validateParams = <TSchema extends z.ZodType>(
  schema: TSchema,
  handler: ValidatedHandler<z.infer<TSchema>>,
) => validate(schema, "params", handler);

export const validateBodyAndParams = <TSchema extends z.ZodType>(
  schema: TSchema,
  handler: ValidatedHandler<z.infer<TSchema>>,
) => validate(schema, "bodyAndParams", handler);
