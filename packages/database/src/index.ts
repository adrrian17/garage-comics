import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const client = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/garage_comics",
);

export const db = drizzle(client, { schema });

export * from "./schema.js";
export { schema };
