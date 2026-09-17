// lib/db.ts
// Singleton Neon serverless SQL clients.
// Import `sql` for simple queries, `pool` for interactive transactions.
// Never import this file from a "use client" component.

import { neon, Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/** HTTP driver — fast one-shot parameterized queries and batched transactions */
export const sql = neon(process.env.DATABASE_URL);

/** WebSocket pool — required for interactive transactions (BEGIN/COMMIT with mid-tx reads) */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

