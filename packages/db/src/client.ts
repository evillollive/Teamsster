import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const FALLBACK_DATABASE_URL =
  "postgres://teamsster_dev:insecure-dev-password@127.0.0.1:5432/teamsster_dev";

const databaseUrl = process.env.DATABASE_URL ?? FALLBACK_DATABASE_URL;

if (
  process.env.NODE_ENV === "production" &&
  databaseUrl === FALLBACK_DATABASE_URL
) {
  throw new Error("DATABASE_URL must be set in production.");
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
