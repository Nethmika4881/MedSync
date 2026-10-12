# MedSync

A multi branch **Clinic Management System** built for Sri Lankan clinics. MedSync covers the full patient journey: online booking, queue based consultations, prescriptions, billing and insurance claims, with separate portals for each staff role.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Roles and Routes](#roles-and-routes)
- [Team and Contributions](#team-and-contributions)
- [Deployment and CI/CD](#deployment-and-cicd)
- [License](#license)

---

## Features

**Patients**
- Self registration and login
- Find doctors and book an appointment (queue ticket) online
- View appointments, prescriptions, medical records, billing and insurance claims
- Submit complaints to a branch

**Doctors**
- Dashboard, live queue and weekly schedule
- Consultation workspace: symptoms, diagnosis, notes, treatment orders, prescriptions, follow-ups
- Medication contraindication information at prescribing time
- Patient list and history, notifications, editable profile

**Front desk**
- Register patients and book walk-in / emergency appointments
- Check patients in and manage the daily queue
- Invoices, payments and insurance claim tracking per branch

**Admin**
- Manage branches, staff, doctors, schedules and consultation fees
- Treatment catalogue and per-branch treatment availability
- Insurance providers and packages (including a mock provider sync)
- Reports and complaints review

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions), React 19, TypeScript |
| UI | Tailwind CSS 3, shadcn/ui (Radix UI), lucide-react, Recharts |
| Forms / validation | react-hook-form, Zod |
| State | Zustand |
| Database | PostgreSQL (raw SQL via `pg`, no ORM) |
| Migrations | Flyway (`Database/V*__*.sql`) |
| Sessions | Redis |
| PDF export | jsPDF + jspdf-autotable |
| Hosting | Azure App Service (app), Neon (Postgres) |

---

## How It Works

- **Queue-ticket booking.** A doctor's weekly schedule generates `time_slot` sessions (e.g. 09:00–13:00). Each session has `max_tickets`; every booking receives a `queue_number`, and the estimated time is derived from it.
- **Logic lives close to the data.** Much of the business logic is in Postgres: triggers, views and stored procedures. Examples: completed consultations become read-only, a doctor can only run one consultation at a time, schedules cannot overlap, and branches or packages with live bookings or claims cannot be deactivated.
- **Server Actions for everything.** There is no separate REST API. Pages call functions in `lib/actions/` (marked `"use server"`).
- **Auth.** Passwords are hashed with scrypt and a per-user salt. A login creates a random session ID stored in Redis (`session_id:<id>`, 24h TTL) and set as an `httpOnly` cookie. `getCurrentUser()` loads the user from the database for each request.
- **Billing flow.** Completing a consultation (`sp_complete_consultation`) locks the visit and creates the invoice, then front desk records payments and claims can be filed against insurance policies.
- **Timezone.** Clinic "today" is computed in `Asia/Colombo`.

---

## Prerequisites

- **Node.js 22.x** (what CI uses; 20+ should work)
- **npm** (the repo is built with `npm`; `bun.lock` is also present but npm is the supported path)
- **Docker + Docker Compose** (for local Postgres, Redis and Flyway)
- Git

If you prefer not to use Docker, you need PostgreSQL 15+, Redis 7+ and the Flyway CLI installed locally.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Nethmika4881/MedSync.git
cd MedSync
npm install
```

### 2. Create your local config files

These files are git-ignored. Copy them from the provided examples:

```bash
cp docker-compose.yml.example docker-compose.yml
cp flyway.conf.example flyway.conf      # only needed if you run Flyway manually
cp .env.example .env
```

### 3. Start Postgres, Redis and run migrations

```bash
docker compose up -d
```

This starts Postgres (`localhost:5432`), Redis (`localhost:6379`) and runs the Flyway container, which applies every migration in `Database/` automatically. Check that it finished:

```bash
docker compose logs flyway
```

### 4. Configure `.env`

```env
DATABASE_URL="postgresql://flyway_user:local_dev_password@localhost:5432/mydb"
REDIS_URL="redis://localhost:6379"
```

The password above is the default from the compose file. If you set `DB_PASSWORD` in your shell, use that instead.

```bash
docker exec -i medsync-db psql -U flyway_user -d mydb < Database/mock_data_seed.sql
```

### 5. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. The app throws on startup if missing. For Neon, include `?sslmode=require`. |
| `REDIS_URL` | Yes | Redis connection string used for sessions. |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL of the app. Used by the insurance "sync packages" action to call the built-in mock insurer API. Defaults to `http://localhost:3000`. |

---

## Database

Schema changes are managed with **Flyway**. Migrations live in `Database/` and are named `V<number>__<description>.sql`.

Roughly, the history is:

| Migrations | What they add |
|---|---|
| V1–V6 | Enums; users, addresses, contacts; branches, employees, doctors, specializations, schedules; patients and insurance; appointments, consultations, treatments, prescriptions; invoices, payments, claims |
| V7–V16 | Medication details and contraindications, check-in / in-progress statuses, consultation notes, treatment orders, prescription constraints, default branch/admin, password salt, patient self-booking |
| V17–V21 | Doctor-portal triggers, functions, views, stored procedures; appointment triggers and `book_appointment()` |
| V22–V30 | Branch complaints, branch treatments, one specialization per doctor, doctor profile editing, one-consultation-at-a-time rule, time-slot generation from schedules, doctor notification state, admin-side integrity triggers |

---

## Project Structure

```
MedSync/
├── app/                    # Next.js routes, grouped by role
│   ├── admin/              #   branches, doctors, staff, treatments, insurance, reports, settings
│   ├── doctor/             #   dashboard, consultations, patients, schedule, settings
│   ├── front-desk/         #   patients, appointments, billing (claims, payments)
│   ├── patient/            #   dashboard, appointments, find-doctors, prescriptions, records, billing, claims, complaints
│   ├── api/mock/insurer/   #   mock insurance-provider catalogue API
│   ├── login/ register/    #   public auth pages
│   └── page.tsx            #   landing page
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── catms/              # app-level components (Sidebar, Header, BookingModal, ...)
│   └── doctor/             # doctor-specific components
├── lib/
│   ├── actions/            # Server Actions ("use server"): the app's backend
│   ├── server/             # server-only helpers (doctorAuth, SQL query modules, error mapping)
│   ├── stores/             # Zustand stores
│   ├── db.ts               # shared pg Pool
│   ├── schemas.ts          # Zod schemas (register, login, staff, reports)
│   └── types.ts            # shared TypeScript types
├── redis/redis.ts          # Redis client (sessions)
├── Database/               # Flyway migrations + demo seed
├── middleware.ts           # redirects unauthenticated users / wrong-role users
├── .github/workflows/      # CI/CD (see below)
└── docker-compose.yml.example
```

Convention: each page folder has a `page.tsx` (server component that loads data) and a `_client.tsx` (interactive client component).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) on port 3000 |
| `npm run build` | Production build (standalone output) |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint via `next lint` |

---

## Roles and Routes

| Role | Base route | Notes |
|---|---|---|
| Admin | `/admin` | Global or per-branch management |
| Doctor | `/doctor` | Own schedule, queue and consultations only |
| FrontDesk | `/front-desk` | Scoped to their own branch |
| Patient | `/patient` | Own records only |

---

## Team and Contributions

MedSync was built by the team below. Each member's contribution is listed by the area they owned.

| Member | Portal | Contribution |
|---|---|---|
| **Jayawardhana S.A.W.G. (240299L)** | Admin portal | Project initialization, mock data and route structure; Flyway migrations, local Docker Postgres and Redis; authentication, registration, sessions and logout; staff directory and staff creation; admin doctor directory, doctor creation, fees and schedules; admin reports and doctor revenue; Azure App Service and Neon Flyway workflows; database PR check; security audit fixes (password hashing, secure cookies, security headers) |
| **PinnapolamP.A.H.D. (240515A)** | Admin portal | Treatment catalogue CRUD; appointment booking and appointment triggers; branch management and branch analytics; admin dashboard; patient complaints management; insurance packages management; reports (KPIs, PDF export, fixes); admin settings; integrity triggers for branches, doctors and insurance packages (V30) |
| **Perara B.N.D (240496M)** | Front-desk portal | Front-desk layout, loading and error screens; dashboard metrics, live queue and charts; patient directory with live search; patient registration (transaction + Zod validation); appointments, check-in and walk-in booking; billing, payment collection, receipts and insurance claim status |
| **Rakumar K (240540U)** | Doctor portal | Doctor schema and triggers; dashboard and schedule view; working hours; consultation workspace and treatment picker; patients, profile and settings pages; connecting the doctor UI to the database; many frontend/database mismatch fixes; today's queue and completed-patients views |
| **Gunawardena N.N.De.A (240205)** | Patient portal | Doctor directory; transactional live booking and 24h rescheduling; appointment history; prescriptions, medical records, billing and invoices; read-only insurance claim tracking; dashboard metrics |

---

## Deployment and CI/CD

Workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|---|---|---|
| `database-pr-check.yml` | PRs touching `Database/**` | Spins up a temporary Postgres 17 and runs every migration to validate naming and execution |
| `main_medsync-uom.yml` | Push to `main` | Builds the standalone Next.js bundle (Node 22) and deploys to Azure App Service (`medsync-uom`) |
| `neon-migrations.yml` | Manual (`workflow_dispatch`) | Runs Flyway `info` or `migrate` against the Neon **development** or **production** database. Production migrate must run from `main` and requires typing `MIGRATE-PRODUCTION` |

Required GitHub secrets include `DATABASE_URL`, the Azure login secrets, and the Neon JDBC URL / user / password pairs (dev and prod).

> Because the production workflow runs *all* migrations, never place environment-specific accounts or test credentials in `Database/V*.sql`.

---

## License

No license file is included yet. Until one is added, all rights are reserved by the author. If you plan to use or redistribute this code, please contact the maintainer.