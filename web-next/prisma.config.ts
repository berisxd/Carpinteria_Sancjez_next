// Prisma config — schema path and migrations directory.
// DATABASE_URL is read at runtime via env("DATABASE_URL") in schema.prisma.
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
