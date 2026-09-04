Switching to Neon (PostgreSQL) perfectly complements a Next.js serverless environment. The updated overview below reflects the PL/pgSQL architecture and PostgreSQL's `$1` parameterized querying while maintaining the strict raw SQL constraints.

# Project Overview

## About the Project

The Clinic Appointment and Treatment Management System (CATMS) is a centralized, multi-branch platform designed for MedSync Clinic across its locations in Colombo, Kandy, and Galle. Built using Next.js 15 (App Router), Tailwind CSS v3, and shadcn/ui, the system replaces manual record-keeping with a unified digital ecosystem.

To satisfy strict academic and architectural constraints, the application entirely avoids Object-Relational Mappers (ORMs). All database interactions are executed using raw, parameterized SQL queries via Neon's serverless PostgreSQL driver (or `pg`), leaning heavily on PostgreSQL database triggers (PL/pgSQL), stored procedures, and functions to enforce business logic and data integrity.

---

## The Problem It Solves

Running multi-branch clinical operations on paper and disjointed spreadsheets creates critical failures: overlapping doctor schedules, inaccessible patient medical histories, and disjointed billing.

CATMS shifts the administrative burden to a highly constrained relational database. It ensures a doctor cannot be double-booked across sessions, guarantees treatment costs map flawlessly to itemized invoices, and dynamically calculates outstanding balances without relying on fragile client-side math.

---

## Pages

```text
/                          → Landing page / Unified Login
/patient/dashboard         → Patient upcoming appointments, balance
/patient/appointments      → Booking, rescheduling, and history
/patient/billing           → Invoices, payments, and insurance claims

/doctor/dashboard          → Today's schedule and active queue
/doctor/consultations      → Patient medical history, symptoms, treatments, Rx
/doctor/schedule           → Working hours and branch allocations

/front-desk/dashboard      → Branch daily queue overview
/front-desk/registration   → Registering walk-in or new patients
/front-desk/appointments   → Scheduling and emergency walk-in generator
/front-desk/billing        → Invoice generation, payment recording, claims

/admin/dashboard           → Global overview and analytics
/admin/staff               → Employee and doctor management
/admin/services            → Treatment catalogue and insurance package management
/admin/reports             → Revenue, outstanding balances, and branch analytics

```

---

## Navigation

* **Patient Portal:** Mobile-responsive top navigation bar focusing on self-service health records, bookings, and billing.


* **Doctor Portal:** Desktop-optimized sidebar layout for rapid context switching between active queue tickets and clinical entry.


* **Front Desk Portal:** Branch-scoped desktop sidebar layout optimized for high-volume entry, walk-in creation, and point-of-sale payment recording.


* **Admin Portal:** Multi-branch administrative dashboard with expandable sidebar navigation for system-wide configuration and aggregated financial reports.



---

## Core User Flow

### 1. Patient Onboarding & Self-Service Booking

Patients register accounts with demographic and optional insurance details. They browse doctors by branch and select open slots. Server Actions execute raw SQL transactions with optimistic concurrency control, inserting the appointment and assigning a queue ticket.

### 2. Emergency Walk-In Workflow

Front Desk staff bypass standard booking UIs for acute visits. They select an on-duty doctor, and the system executes a raw PostgreSQL mutation to dynamically generate an immediate time slot, bypassing collisions and adding the patient directly to the doctor's active queue.

### 3. Consultation & Clinical Recording

Doctors open active appointments, review past histories, and record symptoms, diagnoses, and treatments from a predefined catalogue. A strict database constraint ensures medications are cross-referenced with patient allergies before the record is marked completed.

### 4. Invoicing, Payments & Claims

Marking an appointment as completed triggers a raw SQL insertion to auto-generate an itemized invoice. Front Desk staff submit insurance claims or record payments. PostgreSQL database triggers instantly recalculate the invoice's `due_amount` and `status`.

---

## Data Architecture

### Database-Driven Integrity

* **Raw SQL execution:** All Next.js Server Actions use the Neon PostgreSQL client to execute strict, parameterized SQL queries. ORMs are strictly forbidden.
* **Anti-Collision Triggers:** PL/pgSQL triggers actively reject time slot insertions or updates that cause doctor scheduling overlaps.


* **Recalculation Triggers:** Payment insertions fire triggers that aggregate total paid amounts and update invoice statuses (`Unpaid`, `PartiallyPaid`, `Paid`) natively.


* **Stored Procedures & Functions:** Complex reporting (e.g., monthly revenue aggregations, outstanding patient balances) runs directly on the PostgreSQL engine via raw SQL calls.



---

## Features In Scope

* Four isolated, role-based Next.js portals with strict JWT access control.


* Centralized master identity spanning Colombo, Kandy, and Galle branches.


* Session-based scheduling with automated queue numbering and database-level collision prevention.


* Dynamic slot generation for emergency walk-in patients.


* Clinical encounter documentation with allergy safety check validation.


* Automated billing engine snapshotting prices from a unified treatment catalogue.


* Payment collection tracking (Cash, Card, Bank Transfer) with real-time balance triggers.


* Insurance claim lifecycle management (`Submitted`, `Approved`, `Rejected`).


* Filterable operational reporting via raw SQL stored procedures.



---

## Features Out of Scope

* ORMs (Prisma, Drizzle, TypeORM). All queries are raw PostgreSQL.
* Standalone Pharmacy, Inventory, Laboratory, and Messaging portals.
* External SMS or Email notification integrations.


* Direct API integration with external Insurance Provider systems.


* Online payment gateway integrations (Stripe, PayPal).



---

## Target User

* **Patients:** Seeking frictionless appointment booking and invoice checking.
* **Doctors:** Requiring fast desktop interfaces to review histories and log treatments securely.
* **Front Desk Staff:** Handling high-volume check-ins, walk-ins, and payments strictly isolated to their assigned branch.
* **Administrators:** Overseeing multi-branch operations, staff configurations, and complex financial reporting.

---

## Success Criteria

* **ACID Compliance:** All booking and billing mutations utilize raw PostgreSQL `BEGIN`, `COMMIT`, and `ROLLBACK` commands to guarantee data integrity.
* **Zero Double-Booking:** PL/pgSQL database triggers mathematically prevent overlapping appointments.


* **Financial Consistency:** Recalculation triggers eliminate discrepancies between logged payments and remaining invoice balances.


* **Security:** Strict raw SQL parameterization (e.g., `$1, $2`) prevents all SQL injection vulnerabilities (`SEC-7`).