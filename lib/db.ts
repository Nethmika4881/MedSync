// lib/db.ts
// Singleton pg connection pool for local PostgreSQL (Docker).
// Import `pool` in Server Actions only — never from a "use client" component.

import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("[lib/db] DATABASE_URL environment variable is not set");
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default db;
