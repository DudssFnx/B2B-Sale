import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida");
}

const isProduction = process.env.NODE_ENV === "production";

// Evita múltiplos pools no serverless
const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

if (!globalForPg.pgPool) {
  globalForPg.pgPool = pool;
}

export const db = drizzle(pool);
