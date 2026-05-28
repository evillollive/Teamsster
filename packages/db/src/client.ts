import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

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

export const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
