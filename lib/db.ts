// lib/db.ts
// Singleton Neon serverless SQL client.
// Import `sql` wherever you need parameterized queries — in Server Actions only.
// Never import this file from a "use client" component.

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);
