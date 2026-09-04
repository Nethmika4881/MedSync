# Code Standards

Implementation rules and conventions for Healthora Clinic Management (CATMS). The engineering team and AI collaborators must follow these rules without exception to prevent pattern drift across sessions.

---

## Engineering Mindset

Operating on this codebase requires a senior engineering mindset:

* **Think before implementing** — understand what is being built, the database implications, and the role constraints before writing a single line.
* **Read context files first** — always verify against the project overview and architecture documentation.
* **Scope is sacred** — only build what the current feature requires. Never introduce out-of-scope modules or premature abstractions.
* **Clean over clever** — simple, readable code that junior developers can easily understand is always preferred over complex abstractions.
* **Database integrity first** — never bypass database triggers, stored procedures, or parameterized queries for client-side shortcuts.
* **Failures are expected** — wrap database operations and server actions in try/catch blocks, log errors with descriptive prefixes, and never let unhandled promise rejections crash the application.

---

## TypeScript

* Strict mode enabled in `tsconfig.json` — no exceptions.
* Never use `any` — use `unknown` and properly narrow the type.
* Avoid type assertions (`as SomeType`) unless strictly necessary, and include a comment explaining why.
* All function parameters and return types must be explicitly typed.
* Use `type` for object shapes, maps, and unions; use `interface` only for extendable component props.
* Use `const` by default — only use `let` when reassignment is explicitly required.

---

## Next.js 15 App Router Conventions

* App Router only — no Pages Router.
* React 19 APIs utilized throughout.
* All components are Server Components by default.
* Only add `"use client"` when the component requires:
* React hooks (`useState`, `useReducer`, `useEffect`, `useRef`).
* Browser-only APIs.
* Event listeners (`onClick`, `onChange`, etc.).
* Client-only libraries (e.g., Sonner toasts, Recharts).


* Never add `"use client"` to layout files unless explicitly required by a client context provider.
* Data fetching happens in Server Components or Server Actions — never fetch directly inside Client Components unless using client-side state hooks.
* Route handlers live in `app/api/` and are reserved strictly for external webhooks or public integrations. Internal UI mutations must use Server Actions.
* Server Actions live in `actions/` — never define Server Actions inline inside component files.

---

## Database & Raw SQL Rules (Neon PostgreSQL)

* **No ORMs Allowed:** Prisma, Drizzle, and TypeORM are strictly prohibited. All queries must be written in raw, parameterized SQL using the Neon serverless PostgreSQL driver (`@neondatabase/serverless` or `pg`).
* **Strict Parameterization:** You must **NEVER** concatenate strings to build SQL queries. All dynamic inputs must be passed via positional parameters (e.g., `$1, $2`) to prevent SQL injection (`SEC-7`).
* **Leverage Database Logic:** Application code must not manually calculate invoice due amounts, aggregate queue numbers, or check scheduling conflicts in JavaScript. Rely entirely on the PostgreSQL triggers, functions, and stored procedures defined in the schema.
* **Transaction Management:** Multi-step mutations (such as booking an appointment or recording a payment with invoice updates) must explicitly wrap queries in `BEGIN`, `COMMIT`, and `ROLLBACK` blocks.

---

## File and Folder Naming

* Folders: kebab-case — e.g., `patient-portal`, `appointment-booking`.
* Component files: PascalCase — e.g., `AppointmentCard.tsx`, `InvoiceTable.tsx`.
* Utility files: camelCase — e.g., `db.ts`, `formatters.ts`.
* Type files: camelCase — e.g., `database.ts`, `index.ts`.
* API route files: always `route.ts`.
* Server Action files: camelCase grouped by domain — e.g., `appointments.ts`, `billing.ts`.
* One component per file — never export multiple components from a single file.
* Index files are restricted to component subfolders for clean imports where applicable.

---

## Component Structure

Every component must follow this exact structural order:

```typescript
"use client"; // Include only if client-side hooks/events are required

// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Internal components & lib imports
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency } from "@/lib/utils";

// 3. Type definitions
type Props = {
  invoiceId: string;
  amount: number;
};

// 4. Component definition
export function ComponentName({ invoiceId, amount }: Props) {
  // State hooks
  // Derived values / handlers
  // JSX return
}

```

* Never use default exports for components — always use named exports.
* Component prop types must be defined directly above the component file unless shared across multiple modules.
* No inline styles — all styling must use Tailwind utility classes mapping to semantic tokens from `ui-tokens.md`.

---

## Server Actions Pattern

```typescript
// actions/billing.ts

"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

export async function recordPayment(invoiceId: string, amount: number) {
  try {
    // 1. Validate inputs or session role
    
    // 2. Execute raw parameterized SQL query
    await pool.query(
      `INSERT INTO payment (invoice_id, amount, payment_method) VALUES ($1, $2, 'Cash')`,
      [invoiceId, amount]
    );

    // 3. Revalidate cache and return success
    revalidatePath("/front-desk/billing");
    return { success: true };
  } catch (error) {
    console.error("[actions/billing] Failed to record payment:", error);
    return { success: false, error: "Failed to record payment. Please try again." };
  }
}

```

* Every Server Action must include a try/catch block.
* Every Server Action must return a standardized object: `{ success: boolean, data?: unknown, error?: string }`.
* Always call `revalidatePath` after successful mutations that affect UI data views.
* Never throw unhandled errors from Server Actions — catch them and return the failure state.

---

## Error Handling & Logging

* Never use empty catch blocks — always log or handle the error gracefully.
* Console error statements must always include a bracketed context prefix matching the file/function name: `[components/AppointmentCard]` or `[actions/appointments]`.
* User-facing error messages must be clean and human-readable — never expose raw database exceptions or internal stack traces to the UI.
* API route errors must return a `500` status with a secure generic message.

---

## Import Aliases

* Always use the `@/` path alias for absolute internal imports — never use relative path traversals going up more than one level (`../../`).

```typescript
// Correct
import { Button } from "@/components/ui/button";
import pool from "@/lib/db";
import { cn } from "@/lib/utils";

// Incorrect
import { Button } from "../../../components/ui/button";

```

---

## Comments

* Avoid comments that explain *what* the code does — code must be self-explanatory through clear variable and function naming.
* Comments are permitted only to explain *why* a non-obvious technical or business logic decision was made (e.g., explaining a complex SQL JOIN or trigger dependency).
* Never leave `TODO` or placeholder comments in production code.

---

## Approved Dependencies

Do not install new npm packages without a explicit architectural justification. Before installing anything, verify:

1. Does shadcn/ui or Radix already provide this primitive?
2. Does React 15/16 or Next.js native APIs cover this functionality?
3. Is there a simpler native solution using standard Web APIs?

Approved packages for this project:

* `next`, `react`, `react-dom`
* `@neondatabase/serverless` or `pg` — Neon PostgreSQL database driver
* `zustand` — Client state management
* `react-hook-form`, `@hookform/resolvers`, `zod` — Form handling and validation
* `recharts` — Administrative analytics charts
* `lucide-react` — Icon system
* `sonner` — Toast notification system
* `date-fns` — Date formatting and calculations
* `@radix-ui/react-*` — shadcn/ui headless UI primitives
* `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge` — Styling utilities