# Library Docs

Project-specific usage patterns and constraints for third-party libraries utilized in MedSync Clinic Management (CATMS). This file defines the explicit rules for interacting with the Neon PostgreSQL driver, NextAuth.js, Tailwind, and supporting utilities.

---

## Before Using Any Library

Before implementing any feature that relies on a third-party library:

1. **Check package configuration** in `package.json` to ensure the library is installed and aligned with React 19 and Next.js 15.
2. **Review this file** for project-specific usage patterns that override general documentation knowledge.

The order of authority for library patterns is:

```
Project Rules (This file) → Official Documentation → General Training Knowledge

```

---

## Neon PostgreSQL Driver (`@neondatabase/serverless` or `pg`)

### Connection Pool Setup

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

```

### Executing Raw Parameterized Queries

```typescript
// Example Server Action query
import pool from "@/lib/db";

export async function getPatientAppointments(patientId: string) {
  try {
    const query = `
      SELECT a.*, t.available_date, t.start_time, t.end_time 
      FROM appointment a
      JOIN time_slot t ON a.time_slot_id = t.time_slot_id
      WHERE a.patient_id = $1
      ORDER BY t.available_date DESC;
    `;
    const { rows } = await pool.query(query, [patientId]);
    return { success: true, data: rows };
  } catch (error) {
    console.error("[lib/db] Failed to fetch patient appointments:", error);
    return { success: false, error: "Database query failed" };
  }
}

```

**Rules:**

* **Raw SQL Only:** ORMs like Prisma or Drizzle are strictly forbidden. All interactions must use raw SQL.
* **Strict Parameterization:** Always use positional parameters (`$1`, `$2`, etc.) for dynamic variables. Never use string interpolation or concatenation in SQL queries to prevent SQL injection (`SEC-7`).
* **Transaction Handling:** Use explicit `BEGIN`, `COMMIT`, and `ROLLBACK` commands via a client checkout from the pool for multi-step mutations (e.g., walk-in creation or invoice payment settlement).

---

## NextAuth.js / JWT Authentication

### Session Access in Server Components

```typescript
import { auth } from "@/lib/auth"; // NextAuth configuration export

export async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  // Render role-specific data
}

```

**Rules:**

* **Role Validation:** Always check the session user role in Server Actions and Server Components before executing queries.
* **Branch Scoping:** For `FrontDesk` users, always enforce branch isolation by cross-referencing the user's assigned `branch_id` from their session claims.

---

## React Hook Form + Zod

### Client-Side Validation & Server Actions

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  nic: z.string().min(10, "Valid NIC is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function PatientRegistrationForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", nic: "" },
  });

  async function onSubmit(values: FormValues) {
    // Call Server Action
  }

  return (
    // JSX form implementation following shadcn/ui patterns
  );
}

```

**Rules:**

* Always define a corresponding Zod schema for form inputs.
* Validate incoming data payloads on both the client (via Zod resolver) and the server inside the Server Action before executing database mutations.

---

## Sonner (Toast Notifications)

### Triggering Feedback in Client Components

```typescript
"use client";

import { toast } from "sonner";
import { recordPayment } from "@/actions/billing";

async function handlePayment(invoiceId: string, amount: number) {
  const result = await recordPayment(invoiceId, amount);
  
  if (result.success) {
    toast.success("Payment recorded successfully and balance updated.");
  } else {
    toast.error(result.error || "Failed to process payment.");
  }
}

```

**Rules:**

* Use `toast.success()` for confirmed database mutations (e.g., booking created, payment logged).
* Use `toast.error()` for failed actions, displaying a clean, human-readable error message.

---

## Recharts

### Admin Dashboard Analytics

```typescript
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  data: { month: string; revenue: number }[];
};

export function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="1003" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip />
        <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

```

**Rules:**

* Client Components only (`"use client"`).
* Chart bars and lines must use CSS variables matching project tokens (e.g., `fill="var(--primary)"`) rather than hardcoded hex color codes.