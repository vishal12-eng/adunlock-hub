import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let connectionString = process.env.DATABASE_URL;
if (connectionString.includes('channel_binding=require')) {
  connectionString = connectionString.replace('channel_binding=require', 'channel_binding=disable');
}

export const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 10000,
  max: 10,
});
export const db = drizzle(pool, { schema });
