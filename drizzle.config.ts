import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Match Next.js env precedence: .env.local wins over .env. dotenv keeps the
// first value it finds for a key, so list the higher-priority file first.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});