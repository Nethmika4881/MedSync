// lib/db.ts
// Singleton Neon serverless SQL clients.
// Import `sql` for simple queries, `pool` for interactive transactions.
// Never import this file from a "use client" component.

import { neon, Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || "postgres://unconfigured:unconfigured@localhost:5432/medsync";

/** HTTP driver — fast one-shot parameterized queries and batched transactions */
export const sql = neon(connectionString);

/** WebSocket pool — required for interactive transactions (BEGIN/COMMIT with mid-tx reads) */
export const pool = new Pool({ connectionString });

