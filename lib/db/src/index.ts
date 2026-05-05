import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function poolSslOption(connectionString: string): pg.PoolConfig["ssl"] | undefined {
  try {
    const u = new URL(connectionString);
    if (u.searchParams.get("sslmode") === "disable") {
      return undefined;
    }
    const host = u.hostname.toLowerCase();
    const needsSsl =
      host.endsWith(".rlwy.net") ||
      host.includes("railway") ||
      host.endsWith(".neon.tech") ||
      host.includes("supabase.co") ||
      u.searchParams.get("sslmode") === "require";
    if (!needsSsl) {
      return undefined;
    }
    return { rejectUnauthorized: false };
  } catch {
    return undefined;
  }
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: poolSslOption(process.env.DATABASE_URL),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
