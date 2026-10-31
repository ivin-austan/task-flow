import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import {
  defineConfig as definePostgresConfig,
  prisma7Schema,
} from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: definePostgresConfig({
    contract: prisma7Schema("server/prisma/schema.prisma"),
    output: "server/src/generated/prisma8",
    db: {
      connection: process.env["DATABASE_URL"],
    },
  }),
});
