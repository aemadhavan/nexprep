import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the postgres client with serverless-friendly configuration
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1, // Maximum connections for serverless (one per instance)
  max_lifetime: 60 * 30, // Close connections after 30 minutes
});

// Create the drizzle instance with schema
export const db = drizzle(client, { schema });

