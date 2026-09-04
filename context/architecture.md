# Architecture

## Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Database Access | `mysql2` (Node.js) | Connection pooling and executing raw, parameterized SQL queries |
| Database | MySQL | Relational data, triggers, procedures, and ACID transactions

 |
| Authentication | NextAuth.js / JWT | Session management and role-based access control (RBAC)

 |
| Styling | Tailwind CSS 3.4 + shadcn/ui | UI primitives and utility-first styling |
| Forms & Validation | React Hook Form + Zod | Client and server-side schema validation |
| Client State | Zustand 5.0 | Lightweight global state (e.g., active branch context) |
| Charts | Recharts | Admin dashboard analytics |
| Notifications | Sonner | System toasts and transaction feedback |
| Language | TypeScript (Strict) | End-to-end type safety |

---

## Folder Structure

```text
/
├── app/
│   ├── layout.tsx                     → Root layout (Inter font, Sonner Toaster provider)
│   ├── page.tsx                       → Public landing page (MedSync overview)
│   ├── globals.css                    → Tailwind v3 base, components, and utilities
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx               → Unified login for all roles
│   ├── (patient)/                     → Patient portal routes[cite: 1]
│   │   ├── layout.tsx                 → Top navigation layout
│   │   ├── dashboard/page.tsx         → Upcoming appointments and running balance
│   │   ├── appointments/page.tsx      → Doctor search and slot booking
│   │   └── billing/page.tsx           → Invoices, payments, and insurance claims
│   ├── (doctor)/                      → Doctor portal routes[cite: 1]
│   │   ├── layout.tsx                 → Desktop sidebar layout
│   │   ├── dashboard/page.tsx         → Today's schedule and active ticket queue
│   │   └── consultations/
│   │       └── [id]/page.tsx          → Clinical entry (symptoms, treatments, Rx)
│   ├── (front-desk)/                  → Front Desk portal routes[cite: 1]
│   │   ├── layout.tsx                 → Branch-scoped sidebar layout
│   │   ├── dashboard/page.tsx         → Daily branch queue overview
│   │   ├── registration/page.tsx      → New patient registration
│   │   ├── appointments/page.tsx      → Scheduling and emergency walk-ins
│   │   └── billing/
│   │       ├── page.tsx               → Invoice list and claim submission
│   │       └── [id]/payment/page.tsx  → Record Cash, Card, or Bank payments
│   └── (admin)/                       → Admin portal routes[cite: 1]
│       ├── layout.tsx                 → Multi-branch management layout
│       ├── dashboard/page.tsx         → Global KPI metrics
│       ├── staff/page.tsx             → Employee and doctor provisioning
│       ├── services/page.tsx          → Treatment catalogue pricing
│       └── reports/page.tsx           → Financial and operational analytics
├── actions/                           → Next.js Server Actions (Raw PostgreSQL execution)
│   ├── auth.ts                        → Login validation and JWT generation
│   ├── appointments.ts                → Booking transactions and Walk-in generation
│   ├── billing.ts                     → Invoice creation, payments, and claims
│   ├── clinical.ts                    → Consultation records and prescriptions
│   └── admin.ts                       → Report aggregations and staff mutations
├── components/
│   ├── ui/                            → shadcn/ui primitives (button, dialog, select, etc.)
│   ├── layout/                        → PatientNavbar.tsx, SidebarNav.tsx
│   ├── forms/                         → WalkInForm.tsx, PaymentForm.tsx (React Hook Form + Zod)
│   ├── billing/                       → InvoiceReceipt.tsx, ClaimStatusBadge.tsx
│   ├── clinical/                      → TreatmentPicker.tsx, AllergyWarning.tsx
│   └── shared/                        → DataTable.tsx, MetricCard.tsx
├── hooks/
│   ├── use-auth.ts                    → Client session and RBAC accessors
│   ├── use-branch-store.ts            → Zustand store for Front Desk active branch
│   └── use-queue.ts                   → Real-time queue ticket counters
├── lib/
│   ├── db.ts                          → Neon PostgreSQL connection pool (@neondatabase/serverless)
│   ├── auth.ts                        → Session validation utilities
│   ├── utils.ts                       → tailwind-merge and clsx helpers (cn)
│   └── date.ts                        → date-fns formatting wrappers
├── types/
│   ├── database.ts                    → TypeScript interfaces mapping strictly to PostgreSQL tables
│   └── index.ts                       → Shared application types
├── middleware.ts                      → JWT role-based route protection
├── tailwind.config.ts                 → Tailwind v3 theme and shadcn variables
├── components.json                    → shadcn/ui configuration
├── postcss.config.mjs                 → PostCSS configuration
├── next.config.ts                     → Next.js compiler settings
├── tsconfig.json                      → Strict TypeScript configuration
└── package.json                       → Project dependencies (pg, next, react, zustand, etc.)
```

---

## System Boundaries

| Folder | Owns |
| --- | --- |
| `app/` | Page routing, nested layouts, and Server Component data fetching. Calls raw SQL helper functions. |
| `actions/` | All Server Actions. Form submissions, Zod validation, executing raw SQL queries, and data revalidation. |
| `components/` | Presentation only. No direct database calls, SQL queries, or backend secrets. |
| `lib/` | Third-party client initialization (MySQL pool, Auth) and stateless utility functions. |

---

## Data Flow

### UI Mutations (Server Actions)

```text
User submits React Hook Form in Client Component
        ↓
Zod validates payload on the client
        ↓
Calls async Server Action in actions/
        ↓
Server Action runs Zod validation (Server-side)
        ↓
mysql2 executes raw, parameterized SQL mutation (e.g., INSERT, UPDATE)
        ↓
revalidatePath() clears cache for affected routes
        ↓
Component receives success state & shows Sonner toast

```

### Patient Booking Flow

```text
Patient selects Doctor & Slot
        ↓
Server Action: bookAppointment(slotId)
        ↓
Raw SQL Transaction: START TRANSACTION
        ↓
Raw SQL INSERT: Attempts to insert into appointment table
        ↓
MySQL Anti-Collision Trigger checks for doctor schedule overlap[cite: 1]
        ↓
Raw SQL COMMIT (or ROLLBACK if trigger fails)
        ↓
Page data revalidated; Patient redirected to success view

```

### Invoice & Payment Flow

```text
Doctor completes consultation
        ↓
Server Action executes raw SQL INSERT to generate Invoice based on Treatment Catalogue[cite: 1]
        ↓
Front Desk records payment via Server Action (raw SQL INSERT into payment table)[cite: 1]
        ↓
MySQL triggers recalculate `due_amount` and `status` automatically[cite: 1]
        ↓
Next.js Server Component executes raw SQL SELECT to fetch updated status; UI reflects new balance

```

---

## MySQL Connection Pool Pattern

A single instance of the `mysql2/promise` connection pool must be used to efficiently manage database connections.

```typescript
// lib/db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;

```

---

## Invariants

Rules the implementation must never violate:

* **Strict Parameterization**: You must NEVER concatenate strings to build SQL queries. All inputs must be passed as parameterized arrays using `?` placeholders in `mysql2` to prevent SQL injection (`SEC-7`).


* **No ORMs Allowed**: Prisma, Drizzle, or TypeORM are strictly prohibited. All queries, transactions, and mutations must be written in raw SQL.
* **No API Routes for internal mutations**: All internal form submissions and data updates must use Server Actions (`actions/`).
* **Leverage Database Triggers & Functions**: Application code must not manually calculate invoice `due_amount`, total outstanding balances, or double-booking verifications. The backend logic must rely entirely on the custom MySQL triggers, functions, and stored procedures defined in the database schema (`SAFE-4`, `SAFE-5`).


* **Role Scoping in SQL**: Every `WHERE` clause in a Server Action must explicitly verify the user's role and scope (e.g., Front Desk `SELECT` queries must strictly append `AND branch_id = ?` using the user's active branch).