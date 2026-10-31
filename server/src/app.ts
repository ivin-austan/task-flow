import cors from "cors";
import express from "express";
import helmet from "helmet";
import { taskRouter } from "./routes/task.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { asyncHandler } from "./utils/async-handler.js";
import { db } from "./prisma/db.js";
import { authRouter } from "./routes/auth.routes.js";

export const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: "32kb" }));

app.get(
  "/api/health",
  asyncHandler(async (_request, response) => {
    await db.orm.public.Task.aggregate((aggregate) => ({
      taskCount: aggregate.count(),
    }));
    response.json({ data: { status: "ok" } });
  }),
);
app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRouter);
app.use(notFoundHandler);
app.use(errorHandler);
