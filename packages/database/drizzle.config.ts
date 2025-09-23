import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./src/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://kerberos:kerberos@localhost:5432/garage_comics",
  },
});
