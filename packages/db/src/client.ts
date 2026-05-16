import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const FALLBACK_DATABASE_URL =
  "postgres://teamsster:teamsster@127.0.0.1:5432/teamsster";

export const databaseUrl = process.env.DATABASE_URL ?? FALLBACK_DATABASE_URL;
export const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
