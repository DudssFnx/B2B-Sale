import "dotenv/config";
import { defineConfig } from "drizzle-kit";


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./shared/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
