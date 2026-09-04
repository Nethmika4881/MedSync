# Progress Tracker

Update this file after every completed feature. Any AI agent or team member reading this should immediately know what is done, what is in progress, and what is next across all five team portfolios.

---

## Current Status

**Phase:** Phase 1 — Foundation & Database Setup
**Last completed:** App directory restructured into role-based route groups (`(admin)`, `(patient)`, `(doctor)`, `(front-desk)`)
**Next:** Neon PostgreSQL Database Schema & Raw SQL Migrations

---

## Progress

### Phase 1 — Foundation & Core Infrastructure (Shared)

* [x] 01 Project Initialization (Next.js 15, Tailwind v3, shadcn/ui setup) — App directory restructured into role-based route groups
* [ ] 02 Neon PostgreSQL Database Schema & Constraints (Triggers, Functions, Procedures)
* [ ] 03 NextAuth.js / JWT Authentication Setup & Middleware Role Routing
* [ ] 04 Shared Layout Components & UI Registry Setup (`ui-tokens.md`, `ui-rules.md`)

---

### Phase 2 — Patient Portal (Assigned Team Member: Frontend & Self-Service Flow)

* [ ] 05 Patient Layout & Top Navigation Bar UI
* [ ] 06 Patient Dashboard (Upcoming Appointments, Active Prescriptions, Balance Cards)
* [ ] 07 Find Doctors Directory UI & Multi-Parameter Filter Controls
* [ ] 08 Multi-Step Booking Modal (Specialist selection, date/time picker, visit type)
* [ ] 09 Server Action: Patient Appointment Booking with Optimistic Concurrency Control
* [ ] 10 Patient Appointment History & Rescheduling Workflow
* [ ] 11 Patient Medical Records & Consultation History Viewer
* [ ] 12 Patient Prescriptions Viewer & Refill Request Interface
* [ ] 13 Patient Billing & Invoice History Page (Paid/Unpaid breakdown)
* [ ] 14 Insurance Claim Status Tracking View for Patients

---

### Phase 3 — Doctor Portal (Assigned Team Member: Clinical Interaction Flow)

* [ ] 15 Doctor Portal Desktop Sidebar Layout & Navigation
* [ ] 16 Doctor Dashboard & Today's Schedule Queue View
* [ ] 17 Doctor Working Hours & Branch Allocation Settings Page
* [ ] 18 Active Consultation Workspace UI (Symptoms, Diagnosis, and Notes entry)
* [ ] 19 Treatment Catalogue Picker & Procedure Line-Item Attachment
* [ ] 20 Medication Prescription Form & Real-Time Patient Allergy Safety Check (`SAFE-1`)
* [ ] 21 Consultation Completion Action (Locking records & triggering automated invoice generation)

---

### Phase 4 — Front Desk Portal (Assigned Team Member: Branch Operations & Point of Sale)

* [ ] 17 Front Desk Branch-Scoped Sidebar Layout & Active Branch Zustand Store
* [ ] 18 Front Desk Daily Queue & Counter Check-In Dashboard
* [ ] 19 Patient Registration Form (Demographics, Emergency Contacts, Insurance link)
* [ ] 20 Daily Branch Appointment Scheduling Sheet & Slot Verification
* [ ] 21 Emergency Walk-In Generator (Dynamic time-slot creation bypassing standard scheduling)
* [ ] 22 Completed Appointment Invoice Management Table
* [ ] 23 Payment Processing Form (Cash, Card, Bank Transfer with zero-balance validation)
* [ ] 24 Insurance Claim Submission & Status Management Interface (`Submitted`, `Approved`, `Rejected`)
* [ ] 25 Overpaid Invoice Refund / Credit Task Generator (`REQ-32`)

---

### Phase 5 — Admin Portal & Reporting (Assigned Team Members [2]: Global Management & Database Layer)

* [ ] 26 Admin Multi-Branch Management Layout & Global KPI Dashboard
* [ ] 27 Branch Management & Room Allocation Directory
* [ ] 28 Employee Provisioning & Staff Role Management (`Doctor`, `FrontDesk`, `Admin`)
* [ ] 29 Doctor Specialization & Fee Configuration Panel (`consultation_fee`)
* [ ] 30 Treatment Catalogue Management (CRUD for base prices and categories)
* [ ] 31 Insurance Package Management (Annual limits and co-payment terms)
* [ ] 32 Report Generation: Branch-Wise Daily Appointment Summary (`REQ-35`)
* [ ] 33 Report Generation: Doctor-Wise Billed vs. Collected Revenue (`REQ-36`, via Stored Procedure)
* [ ] 34 Report Generation: Outstanding Patient Balance Debtor List (`REQ-37`, via SQL Function)
* [ ] 35 Report Generation: Treatment Category Volume & Insurance vs. Out-of-Pocket Ratios

---

## Decisions Made During Build

* **No ORMs:** All database operations will be written in raw, parameterized SQL queries using `pg` / Neon driver to satisfy advanced database module requirements.
* **Database-Driven Logic:** Double-booking prevention and invoice balance recalibration are fully offloaded to PostgreSQL triggers rather than handled in application logic.

---

## Notes

* Front Desk operations are strictly scoped to the staff member's active branch using Zustand and raw SQL `branch_id` filters.
* Doctor consultation notes are logically isolated and restricted from Front Desk visibility.