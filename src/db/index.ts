import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

/**
 * Whether a real database is configured. When false, the data-access layer
 * falls back to the built-in static catalog so the app still runs.
 */
export const isDbConfigured = Boolean(databaseUrl && databaseUrl.length > 0);

// Reuse the connection across hot reloads / serverless invocations.
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

function createClient() {
  if (!databaseUrl) return undefined;
  return (
    globalForDb.client ??
    postgres(databaseUrl, { prepare: false, max: 1 })
  );
}

const client = createClient();
if (client && process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = client
  ? drizzle(client, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export { schema };
