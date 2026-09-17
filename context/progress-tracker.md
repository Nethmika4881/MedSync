# MedSync — Full Feature Progress Tracker

> **Last updated:** 2026-09-17  
> **Phase:** Phase 1 — Foundation (UI complete, database not yet connected)  
> **Active branch:** `chore/bug/extra-roles-removed`  
> **Roles in system:** `admin` · `doctor` · `patient` · `receptionist` (front reception)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented (UI + logic complete) |
| 🟡 | UI built, **not connected to database / backend** — runs on mock data only |
| ❌ | Not yet built — does not exist in the codebase |
| 🔧 | Partially built — stub or placeholder exists, incomplete |

---

## Status at a Glance

| Portal | Pages Built | Pages DB-Connected | Pages Missing |
|--------|------------|-------------------|---------------|
| **Admin** | 9 / 9 | 0 / 9 | — |
| **Doctor** | 2 / 4 | 0 / 2 | dashboard, consultation workspace |
| **Front Reception** | 4 / 6 | 0 / 4 | dashboard, walk-in generator |
| **Patient** | 3 / 6 | 0 / 3 | dashboard, appointments history, billing |
| **Shared / Core** | layout done | 0% | Auth, DB schema, middleware |

---

## TEAM RESPONSIBILITY BREAKDOWN

---

### 👤 Person 1 — Infrastructure & Authentication (Shared Core)
**Owns:** Database schema, authentication, middleware, environment setup

---

#### Phase 1 — Core Infrastructure

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.1 | Project initialization — Next.js 15, Tailwind v3, shadcn/ui | ✅ | Complete. App directory restructured into role-based route groups. |
| 1.2 | **Neon PostgreSQL Database Schema** — all tables, constraints, triggers, stored procedures | ❌ | **Not started.** This is the single most critical blocker. No table, no migration, no SQL file exists. Blocks everyone else. |
| 1.3 | **NextAuth.js / JWT Authentication** — login form, session management, middleware role routing | ❌ | Not started. `app/login/page.tsx` is a stub. `AuthGuard` uses a fake Zustand store only. |
| 1.4 | **Middleware role-routing** — protect `/dashboard`, `/appointments`, etc. by role | ❌ | Not started. All route groups are currently unprotected — anyone can visit any URL if they know it. |
| 1.5 | Environment setup — `.env.local` with `DATABASE_URL`, `NEXTAUTH_SECRET` | ❌ | Not configured. No `.env` file exists in the project. |
| 1.6 | Shared UI component library registry (`ui-registry.md`, `ui-tokens.md`) | 🔧 | Tailwind tokens exist in `globals.css`. `ui-registry.md` not written yet. |

**Concrete next steps for Person 1:**
1. Write raw SQL schema file (`db/schema.sql`) with all tables
2. Create `.env.local` with Neon connection string
3. Implement NextAuth credentials provider with `pg` raw SQL lookup
4. Write `middleware.ts` that reads the JWT role and redirects if unauthorized

---

### 👤 Person 2 — Patient Portal
**Owns:** All pages under `app/(patient)/` and patient-facing booking experience

---

#### Phase 2 — Patient Portal

| # | Feature | Page/File | Status | Notes |
|---|---------|-----------|--------|-------|
| 2.1 | Patient portal layout — top-nav header, no sidebar | `(patient)/layout.tsx` | ✅ | Layout renders correctly with AuthGuard. |
| 2.2 | **Patient dashboard** — upcoming appointments, active prescriptions, balance summary | `(patient)/dashboard/page.tsx` | ❌ | **Page does not exist.** Patients land on admin dashboard. |
| 2.3 | Find Doctors directory — search, filter by specialty/branch/availability | `(patient)/find-doctors/page.tsx` | 🟡 | UI fully built. Reads from `lib/mockData/doctors.ts`. Not DB-connected. |
| 2.4 | **Booking modal** — multi-step: doctor → date/time → confirm | `components/catms/BookingModal` | 🟡 | UI built with step wizard. Writes to Zustand only. No DB write. |
| 2.5 | Patient appointment history & rescheduling | ❌ | No appointment history page under `(patient)/`. Not built. |
| 2.6 | Medical records viewer — conditions, allergies, consultation history | `(patient)/records/page.tsx` | 🟡 | UI complete. Reads from Zustand. Not DB-connected. |
| 2.7 | Prescriptions viewer — medications, dosage, refill request | `(patient)/prescriptions/page.tsx` | 🟡 | UI built. Reads from `pharmacyStore`. Refill action is a no-op. |
| 2.8 | Patient billing & invoice history | ❌ | No billing page under `(patient)/`. Not built. |
| 2.9 | Insurance claim status tracking for patients | ❌ | Not built. |
| 2.10 | **Download PDF** for consultation records | `(patient)/records/page.tsx` (button exists) | 🔧 | Button exists in UI but is a no-op. No PDF generation implemented. |

**Concrete next steps for Person 2 (after Person 1 sets up DB):**
1. Create `(patient)/dashboard/page.tsx`
2. Create `(patient)/appointments/page.tsx` (history + rescheduling)
3. Create `(patient)/billing/page.tsx`
4. Replace all `mockData` reads with Server Actions using raw SQL

---

### 👤 Person 3 — Doctor Portal
**Owns:** All pages under `app/(doctor)/` and clinical consultation workspace

---

#### Phase 3 — Doctor Portal

| # | Feature | Page/File | Status | Notes |
|---|---------|-----------|--------|-------|
| 3.1 | Doctor portal layout — sidebar + header | `(doctor)/layout.tsx` | ✅ | Layout complete with AuthGuard and Sidebar. |
| 3.2 | **Doctor dashboard** — today's schedule summary, KPI cards | `(doctor)/dashboard/page.tsx` | ❌ | **Page does not exist.** Doctors land on shared dashboard which is admin-oriented. |
| 3.3 | My Schedule — time-grid agenda view with patient queue | `(doctor)/schedule/page.tsx` | 🟡 | UI complete with agenda grid. Reads from Zustand filtered by `doctorId`. Not DB-connected. |
| 3.4 | Consultations queue — today's checked-in patients, safety banners | `(doctor)/consultations/page.tsx` | 🟡 | UI complete. Allergy/condition safety banners visible. Reads from mock stores. |
| 3.5 | **Active consultation workspace** — symptom entry, diagnosis, notes form | ❌ | **"Start Consultation" button exists but goes nowhere.** Full workspace not built. |
| 3.6 | **Medication prescription form** — drug picker, dosage, real-time allergy safety check (SAFE-1) | ❌ | Not built. `lib/contraindication.ts` helper exists but is not wired into any UI. |
| 3.7 | **Consultation completion action** — lock record, trigger invoice generation | ❌ | Not built. No server action exists for finalizing a consultation. |
| 3.8 | Treatment catalogue picker (attach treatments to a consultation) | ❌ | Not built. |
| 3.9 | Doctor working hours & branch allocation settings | ❌ | Not built. Doctors use generic shared settings page only. |
| 3.10 | Past consultation records — view/edit modal | `(doctor)/consultations/page.tsx` | 🔧 | Table row exists with View/Edit button but button is a no-op. |

**Concrete next steps for Person 3:**
1. Create `(doctor)/dashboard/page.tsx` with doctor-specific KPIs
2. Build the active consultation workspace with diagnosis/symptom form inputs
3. Build prescription form with `lib/contraindication.ts` wired in
4. Wire "Consultation Complete" to a Server Action that generates an invoice

---

### 👤 Person 4 — Front Reception Portal
**Owns:** All pages under `app/(front-desk)/` — appointments, patients, billing

---

#### Phase 4 — Front Reception Portal

| # | Feature | Page/File | Status | Notes |
|---|---------|-----------|--------|-------|
| 4.1 | Front desk layout — sidebar + header | `(front-desk)/layout.tsx` | ✅ | Layout complete. Branch-scoping not yet implemented. |
| 4.2 | **Front desk dashboard** — daily queue counter, check-in stats | `(front-desk)/dashboard/page.tsx` | ❌ | **Page does not exist.** Receptionist lands on admin dashboard. |
| 4.3 | Appointments list — search, filter, status, cancel, reschedule, check-in | `(front-desk)/appointments/page.tsx` | 🟡 | Very comprehensive UI — filters, status pills, dropdown actions, check-in. Reads from Zustand. No DB writes. |
| 4.4 | New appointment form | `(front-desk)/appointments/new/page.tsx` | 🔧 | Page file exists but content is minimal/stub. |
| 4.5 | Patient list — searchable table of all registered patients | `(front-desk)/patients/page.tsx` | 🟡 | UI complete. Reads from `patientStore`. Not DB-connected. |
| 4.6 | **Patient registration form** — demographics, emergency contacts, insurance link | `(front-desk)/patients/new/page.tsx` | 🔧 | Page file exists. Needs verification if form is functional or stub. |
| 4.7 | Patient detail view | `(front-desk)/patients/[id]/page.tsx` | 🔧 | Dynamic route file exists. Likely stub. |
| 4.8 | Invoices & billing table — invoices, payment status tabs | `(front-desk)/billing/page.tsx` | 🟡 | UI complete with Invoice/Payments/Claims tabs. Reads from `billingStore`. No DB writes. |
| 4.9 | Payment processing form — cash/card/bank transfer | `(front-desk)/billing/payments/page.tsx` | 🔧 | Page exists, needs verification. |
| 4.10 | Insurance claims management — submit, approve, reject | `(front-desk)/billing/claims/page.tsx` | 🔧 | Page exists, needs verification. |
| 4.11 | **Emergency walk-in generator** — bypass scheduling, create instant appointment | ❌ | Not built. |
| 4.12 | Overpaid invoice refund / credit note generator | ❌ | Not built. |
| 4.13 | Branch-scoped filtering (restrict all data to receptionist's `branchId`) | ❌ | Not implemented. Receptionist currently sees all-branch data. |

**Concrete next steps for Person 4:**
1. Create `(front-desk)/dashboard/page.tsx`
2. Verify and complete new appointment + patient registration forms
3. Implement branch-scoping so data is filtered by `branchId`
4. Wire all Zustand mutations to Server Actions with raw SQL

---

### 👤 Person 5 — Admin Portal & Reporting
**Owns:** All pages under `app/(admin)/`, reporting, staff/doctor management, insurance

---

#### Phase 5 — Admin Portal

| # | Feature | Page/File | Status | Notes |
|---|---------|-----------|--------|-------|
| 5.1 | Admin layout — sidebar + header | `(admin)/layout.tsx` | ✅ | Complete. |
| 5.2 | Admin dashboard — KPI cards, revenue chart, upcoming appointments | `(admin)/dashboard/page.tsx` | 🟡 | UI fully built with Recharts. Reads from mock data. Not DB-connected. |
| 5.3 | Doctor directory — searchable list, specialization filter, availability toggle | `(admin)/doctors/page.tsx` | 🟡 | UI complete. Reads from `lib/mockData/doctors.ts`. No DB. |
| 5.4 | Add doctor form | `(admin)/doctors/new/page.tsx` | 🔧 | Page file exists. Likely stub — needs verification. |
| 5.5 | Doctor detail / edit view | `(admin)/doctors/[id]/page.tsx` | 🔧 | Dynamic route file exists. Likely stub. |
| 5.6 | Doctor schedules management | `(admin)/doctors/schedules/page.tsx` | 🟡 | UI built. Reads from mock data. Not DB-connected. |
| 5.7 | Staff management — employee table, department/branch filters | `(admin)/staff/page.tsx` | 🟡 | UI complete. Reads from `employees.ts` mock. Not DB-connected. |
| 5.8 | Branch management — branch directory, rooms, contacts | `(admin)/branches/page.tsx` | 🟡 | UI complete. Reads from `lib/mockData/branches.ts`. Not DB-connected. |
| 5.9 | Treatment catalogue management — CRUD for treatments and prices | `(admin)/treatments/page.tsx` | 🟡 | UI complete. Mutations are Zustand-only. |
| 5.10 | Insurance providers list | `(admin)/insurance/page.tsx` | 🟡 | UI complete. Reads from `lib/mockData/insurance.ts`. Not DB-connected. |
| 5.11 | Insurance packages management | `(admin)/insurance/packages/page.tsx` | 🔧 | Page exists. Needs verification. |
| 5.12 | Reports — Branch-wise appointment summary (charts) | `(admin)/reports/page.tsx` | 🟡 | Charts exist (Recharts). Uses hardcoded mock chart data. No SQL. |
| 5.13 | **Reports — Doctor-wise billed vs. collected revenue** | ❌ | Not built. Required via SQL Stored Procedure. |
| 5.14 | **Reports — Outstanding patient balance debtor list** | ❌ | Not built. Required via SQL Function. |
| 5.15 | **Reports — Treatment category volume & insurance ratios** | ❌ | Not built. |
| 5.16 | Settings page — profile, notifications, security, appearance | `(admin)/settings/page.tsx` | 🟡 | UI fully built with 4 tabs. Save shows toast but is a no-op. Not DB-connected. |
| 5.17 | **Employee provisioning** — add/edit/deactivate staff with role assignment | ❌ | Staff page is read-only. No create/edit form exists. |
| 5.18 | Doctor fee configuration panel — set `consultation_fee` per doctor | ❌ | Not built as a standalone feature. |

**Concrete next steps for Person 5:**
1. Verify and complete stub pages: `doctors/new`, `doctors/[id]`, `insurance/packages`
2. Wire admin dashboard charts to real DB aggregation queries
3. Build the 3 missing report queries as Server Actions (stored procedure + SQL function)
4. Build employee provisioning (add/edit/deactivate) form

---

## SHARED BLOCKERS (Everyone is blocked by these)

> These must be completed by **Person 1** before any other person can connect their UI to a real backend.

| Blocker | Impact |
|---------|--------|
| ❌ No `DATABASE_URL` / `.env.local` configured | App cannot connect to Neon at all |
| ❌ No SQL schema / migration file | No tables exist; no data can be persisted |
| ❌ No NextAuth.js session | All auth is fake Zustand state; cleared on page refresh |
| ❌ No middleware role guard | Any URL is accessible without logging in |
| ❌ No Server Actions written | Every form, button, and mutation only touches in-memory state |

---

## Architecture Decisions (Locked — Do Not Change)

- **No ORMs.** All DB access via raw parameterized SQL using the `pg` / Neon serverless driver.
- **Database-driven logic.** Double-booking prevention and invoice recalculation live in PostgreSQL triggers, not in application code.
- **Branch-scoped Front Desk.** All receptionist queries must include `WHERE branch_id = $1` using the logged-in user's branch.
- **`receptionist` is the role key** for Front Reception. Display label is "Front Reception".

---

## What is 100% NOT built yet (summary)

1. ❌ PostgreSQL database schema (the biggest blocker)
2. ❌ NextAuth login + JWT middleware
3. ❌ Patient dashboard page
4. ❌ Patient appointment history page
5. ❌ Patient billing page
6. ❌ Doctor dashboard page
7. ❌ Active consultation workspace (core clinical flow)
8. ❌ Prescription form with allergy safety check
9. ❌ Consultation completion → invoice generation
10. ❌ Front desk dashboard page
11. ❌ Emergency walk-in appointment generator
12. ❌ Branch-scoped data filtering for receptionist
13. ❌ Three report SQL queries (stored procedures + functions)
14. ❌ Employee provisioning (create/edit/deactivate staff)
15. ❌ Doctor fee configuration panel
16. ❌ Any Server Action connected to a real database

---

## What has UI but zero backend (mock-only — will lose data on refresh)

- Find Doctors directory + Booking Modal
- All appointment actions (check-in, cancel, reschedule)
- Patient records, prescriptions, medical history viewer
- Doctor schedule agenda view
- Admin dashboard charts (hardcoded data)
- Staff / employee table
- Branch directory
- Insurance tables
- Treatment catalogue
- Billing invoices / payments / claims tables
- Settings profile save (button is a no-op)
- All report charts (all hardcoded mock values)
