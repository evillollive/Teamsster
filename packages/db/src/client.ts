import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const FALLBACK_DATABASE_URL =
  "postgres://teamsster_dev:insecure-dev-password@127.0.0.1:5432/teamsster_dev";

let _db: NeonHttpDatabase<typeof schema> | undefined;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL ?? FALLBACK_DATABASE_URL;

    if (
      process.env.NODE_ENV === "production" &&
      databaseUrl === FALLBACK_DATABASE_URL
    ) {
      throw new Error("DATABASE_URL must be set in production.");
    }

    const sql = neon(databaseUrl);
    _db = drizzle({ client: sql, schema });
  }
  return _db;
}

// Lazy proxy: defers DB connection until first property access at runtime.
// This prevents build-time crashes when DATABASE_URL is not set.
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
