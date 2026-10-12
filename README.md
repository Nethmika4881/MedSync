# MedSync

MedSync is a multi-branch **Clinic Management System** designed for Sri Lankan clinics. It connects patients, doctors, front-desk staff, and administrators through four role-specific portals and supports the complete clinic journey: registration, queue-based appointment booking, consultation, prescriptions, billing, payments, insurance claims, reporting, and complaints.

> **Academic project notice:** MedSync is a university demonstration project. It is not a production medical service and must not be used to store real patient data without an appropriate security, privacy, and regulatory review.

**Live application:** [medsync-uom-ewephsdhgzcedhax.indiasouthcentral-01.azurewebsites.net](https://medsync-uom-ewephsdhgzcedhax.indiasouthcentral-01.azurewebsites.net/)

**Repository:** [github.com/Nethmika4881/MedSync](https://github.com/Nethmika4881/MedSync)

---

## Table of Contents

- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [How MedSync Works](#how-medsync-works)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database and Migrations](#database-and-migrations)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Roles and Routes](#roles-and-routes)
- [Security](#security)
- [Testing](#testing)
- [Deployment and CI/CD](#deployment-and-cicd)
- [Team and Contributions](#team-and-contributions)
- [License](#license)

---

## Core Features

### Patient portal

- Self-registration, sign-in, sign-out, and protected patient sessions
- Doctor directory with filtering and branch-aware availability
- Online appointment booking using queue tickets rather than rigid appointment times
- Appointment history and transactional rescheduling with a 24-hour guard
- Prescription, treatment, consultation, and medical-record history
- Invoice, payment, outstanding-balance, and insurance-claim views
- Complaint submission and complaint-history tracking
- Dashboard showing upcoming visits, active prescriptions, and account activity

### Doctor portal

- Daily dashboard with queued and completed patients
- Weekly schedules, working hours, and generated clinic sessions
- Consultation workspace for symptoms, diagnoses, notes, treatment orders, prescriptions, and follow-ups
- Medication contraindication and patient-safety information while prescribing
- Patient directory and longitudinal clinical history
- Doctor profile and settings management
- Notification centre with persistent read state
- Rules that prevent overlapping or simultaneous active consultations

### Front-desk portal

- Branch-scoped dashboard, operational metrics, queue, and appointment charts
- Patient registration with validation and multi-table database transactions
- Searchable patient directory and detailed clinical/visit profile
- Scheduled, walk-in, and emergency appointment booking
- Patient check-in and live appointment-status updates
- Branch invoice and payment management
- Payment-method selection and printable receipts
- Insurance-claim status tracking
- Responsive loading, empty, and error states

### Admin portal

- Branch creation, details, analytics, activation, and integrity-aware deactivation
- Staff directory and transactional staff onboarding
- Doctor directory, doctor creation, profiles, schedules, and consultation fees
- Treatment catalogue and per-branch treatment availability
- Insurance provider and package management, including mock provider synchronisation
- Reports for operational KPIs, revenue, outstanding balances, treatments, and insurance
- PDF report export
- Patient-complaint review
- Application and branch settings

---

## System Architecture

```mermaid
flowchart LR
    U[Patient / Doctor / Front Desk / Admin] --> N[Next.js App Router]
    N --> M[Role-aware middleware]
    M --> P[Server and Client Components]
    P --> A[Next.js Server Actions]
    A --> PG[(PostgreSQL)]
    A --> R[(Redis sessions)]
    PG --> F[Flyway migrations, functions, views and triggers]

    G[GitHub] --> CI[GitHub Actions]
    CI --> AZ[Azure App Service]
    CI --> DB[Neon PostgreSQL migrations]
```

The application uses the Next.js App Router. Server components load data, client components provide interactivity, and functions under `lib/actions/` act as the backend. PostgreSQL is accessed through parameterised raw SQL using `pg`; no ORM is used.

---

## How MedSync Works

### Queue-ticket appointments

A doctor's weekly schedule produces dated `time_slot` sessions. Each session has a maximum ticket capacity. When a patient or front-desk employee books a visit, the system safely assigns the next available `queue_number`. Estimated consultation times are derived from the session duration, capacity, and ticket position.

### Database-enforced business rules

Important rules live close to the data in PostgreSQL functions, procedures, views, constraints, and triggers. They protect the system even when several application surfaces update the same records. Examples include:

- Locking a slot while assigning an appointment ticket
- Preventing schedule overlap and overbooking
- Allowing only one active consultation per doctor
- Making completed consultations read-only
- Creating invoice information when a consultation is completed
- Generating dated time slots from weekly doctor schedules
- Protecting branches, doctors, and insurance packages referenced by active records

### Authentication and sessions

Passwords are hashed with Node.js `scrypt` and a per-user random salt. A successful login creates a cryptographically random session ID stored in Redis with a 24-hour expiry. The browser receives `httpOnly`, `sameSite=strict` session cookies, and middleware redirects unauthenticated or wrong-role requests.

### Billing and insurance

Consultation completion produces the data required for billing. Front-desk staff can review branch invoices, collect payments, print receipts, and track insurance claims. Patients receive read-only access to their own invoices, payment history, policies, and claims.

### Clinic timezone

Date-sensitive clinic logic uses the `Asia/Colombo` timezone so queues, schedules, and “today” views remain consistent with Sri Lankan clinic operations.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript 5 |
| Styling and UI | Tailwind CSS 3, shadcn/ui, Radix UI, Lucide React |
| Forms and validation | React Hook Form, Zod |
| Client state | Zustand |
| Charts and reports | Recharts, jsPDF, jspdf-autotable |
| Database | PostgreSQL through `pg` and parameterised raw SQL |
| Database migrations | Flyway 10 |
| Sessions | Redis 7 |
| Testing | Playwright |
| Local infrastructure | Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | Azure App Service; Neon-compatible PostgreSQL migration workflow |

---

## Prerequisites

- **Node.js 22.x** — the version used by CI; Node.js 20+ should also work
- **npm**
- **Docker and Docker Compose** for the recommended local setup
- **Git**

Without Docker, install PostgreSQL 15+, Redis 7+, and Flyway locally.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Nethmika4881/MedSync.git
cd MedSync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create local configuration files

The real local configuration files are ignored by Git. Copy the safe examples:

```bash
cp .env.example .env
cp docker-compose.yml.example docker-compose.yml
cp flyway.conf.example flyway.conf
```

`flyway.conf` is only required when running the Flyway CLI directly.

### 4. Start PostgreSQL, Redis, and Flyway

```bash
docker compose up -d
```

The Compose stack starts:

- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- A one-off Flyway container that applies migrations from `Database/`

Check migration status with:

```bash
docker compose logs flyway
```

### 5. Configure the environment

For the default local Docker configuration:

```env
DATABASE_URL="postgresql://flyway_user:local_dev_password@localhost:5432/mydb"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

If `DB_PASSWORD` was supplied to Docker Compose, use the same password in `DATABASE_URL`.

### 6. Load optional demonstration data

The seed is intentionally separate from the versioned migrations:

```bash
docker exec -i medsync-db psql -U flyway_user -d mydb < Database/mock_data_seed.sql
```

Only use the seed in development or demonstration environments.

### 7. Start the application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the application |
| `REDIS_URL` | Yes | Redis connection string used for login sessions |
| `NEXT_PUBLIC_APP_URL` | No | Public application URL used by the mock insurance-provider synchronisation; defaults to `http://localhost:3000` |
| `DB_PASSWORD` | No | Overrides the default local PostgreSQL password used by Docker Compose |
| `PLAYWRIGHT_BASE_URL` | No | Runs E2E tests against an already-running application |
| `PLAYWRIGHT_PORT` | No | Port used by the Playwright-managed local server; defaults to `3100` |

Never commit `.env`, production database credentials, Redis credentials, or cloud secrets.

---

## Database and Migrations

Flyway migration files live in `Database/` and follow the naming format:

```text
V<number>__<description>.sql
```

| Migration range | Main responsibility |
|---|---|
| V1–V6 | Enums, users, contacts, branches, staff, doctors, schedules, patients, insurance, appointments, clinical data, billing, and claims |
| V7–V16 | Contraindications, appointment states, consultation notes, treatment orders, prescription rules, default records, password salts, and patient self-booking |
| V17–V21 | Doctor-portal triggers, functions, views, procedures, appointment validation, and transactional `book_appointment()` logic |
| V22–V26 | Complaints, branch treatments, doctor-specialisation rules, and doctor-profile editing |
| V27–V30 | Consultation concurrency, generated time slots, notification read state, and admin-side integrity triggers |

Useful commands:

```bash
# Apply migrations through the local Compose stack
docker compose up flyway

# View the Flyway container output
docker compose logs flyway
```

Do not add production accounts, credentials, or environment-specific data to versioned migration files.

---

## Project Structure

```text
MedSync/
├── app/
│   ├── admin/                 # Admin dashboard and management modules
│   ├── doctor/                # Doctor queue, consultations, patients, schedule, settings
│   ├── front-desk/            # Registration, appointments, check-in, billing, claims
│   ├── patient/               # Booking, records, prescriptions, billing, claims, complaints
│   ├── api/mock/insurer/      # Demonstration insurance-provider endpoint
│   ├── login/                 # Sign-in page
│   ├── register/              # Patient registration page
│   └── page.tsx               # Public landing page
├── components/
│   ├── catms/                 # Shared application components
│   ├── doctor/                # Doctor-specific components
│   └── ui/                    # Reusable shadcn/Radix UI primitives
├── lib/
│   ├── actions/               # Server Actions and application backend logic
│   ├── db/                    # Database value helpers
│   ├── server/                # Server-only auth, validation, errors, and SQL modules
│   ├── stores/                # Zustand stores
│   ├── db.ts                  # Shared PostgreSQL connection pool
│   ├── schemas.ts             # Zod validation schemas
│   └── types.ts               # Shared TypeScript types
├── redis/redis.ts             # Redis client and connection lifecycle
├── Database/                  # Flyway migrations and optional demo seed
├── e2e/                       # Playwright end-to-end tests
├── .github/workflows/         # Database checks, migrations, and Azure deployment
├── middleware.ts              # Authentication and role-route protection
├── playwright.config.ts       # E2E test configuration
└── docker-compose.yml.example # Local PostgreSQL, Redis, and Flyway stack
```

Most interactive route folders use a `page.tsx` server component for data loading and a `_client.tsx` client component for browser interactions.

---

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server with Turbopack |
| `npm run build` | Create the production Next.js build |
| `npm start` | Start the production server |
| `npm run lint` | Run the configured Next.js ESLint command |
| `npm test` | Run the Playwright test suite |
| `npm run test:e2e` | Run the Playwright end-to-end suite |
| `npm run migrate` | Run the configured `node-pg-migrate` command |

---

## Roles and Routes

| Role | Base route | Access scope |
|---|---|---|
| Admin | `/admin` | System-wide and branch-level administration |
| Doctor | `/doctor` | The signed-in doctor's patients, queue, consultations, and schedule |
| Front desk | `/front-desk` | Operational data for the employee's assigned branch |
| Patient | `/patient` | The signed-in patient's appointments, clinical records, and billing information |

Middleware checks both the session and role before allowing access to a protected route.

---

## Security

- Password hashing with `scrypt`, unique salts, and timing-safe comparison
- Cryptographically random Redis-backed session identifiers
- `httpOnly`, strict same-site session cookies and secure production cookies
- Role-aware route enforcement in middleware
- Server-side role and branch-scope checks for sensitive actions
- Parameterised PostgreSQL queries
- Zod validation for forms and server inputs
- Transactional writes with rollback for multi-table operations
- Security headers for framing, content types, referrers, permissions, and HSTS
- Content Security Policy reporting configuration
- Secrets stored in environment variables and GitHub Actions secrets

This is still an academic demonstration. A real healthcare deployment would require a formal threat model, audit logging review, data-retention policy, encrypted backups, monitoring, incident response, and compliance assessment.

---

## Testing

The Playwright suite exercises the patient authentication workflow, including registration, session creation, sign-out, protected-route redirects, invalid login, valid login, and responsive navigation.

```bash
# Install the Chromium test browser once
npx playwright install chromium

# Run the E2E suite
npm run test:e2e
```

E2E tests require working `DATABASE_URL` and `REDIS_URL` values. The test creates and removes its own patient record.

---

## Deployment and CI/CD

MedSync includes three GitHub Actions workflows.

| Workflow | Trigger | Responsibility |
|---|---|---|
| `database-pr-check.yml` | Pull requests that modify `Database/**`, or manual dispatch | Validates Flyway filenames and runs every migration against a temporary PostgreSQL 17 service |
| `main_medsync-uom.yml` | Push to `main`, or manual dispatch | Builds the standalone Next.js application with Node.js 22 and deploys it to Azure App Service |
| `neon-migrations.yml` | Manual dispatch | Runs Flyway `info` or `migrate` against development or production PostgreSQL targets, with additional production confirmation guards |

The deployment workflow uses GitHub's Azure identity integration and repository secrets. The application is built using Next.js standalone output so the deployment artifact contains only the required server bundle, static assets, and public files.

Required deployment configuration includes:

- Azure client, tenant, and subscription IDs
- Application `DATABASE_URL` and `REDIS_URL`
- Development and production PostgreSQL JDBC URLs, users, and passwords for Flyway
- Azure App Service runtime configuration

---

## Team and Contributions

### [Kumarasiri I.D.N. (240370X)) (@Nethmika4881)](https://github.com/Nethmika4881)

- Created the repository and established the initial application structure, routes, mock data, shared UI components, and responsive layouts
- Built early appointment-booking, patient-detail, doctor-profile, doctor-registration, billing, pharmacy, and administrative interfaces
- Designed and implemented authentication, patient registration, React Hook Form/Zod validation, password hashing, Redis sessions, logout, middleware, and role-based routing
- Established PostgreSQL/Flyway migration infrastructure, local Docker services, Redis integration, and shared database connectivity
- Built major admin capabilities including staff onboarding and directory management, doctor creation and profiles, doctor fees and schedules, reports, doctor revenue, and branch summaries
- Connected administrative interfaces to live database actions and resolved cross-module schema, routing, migration, and production-build incompatibilities
- Performed security hardening through secure cookies, improved password handling, security headers, server-side role checks, branch scoping, public-data sanitisation, and dependency updates
- Created and maintained three CI/CD pipelines covering database validation, controlled production migrations, and Azure application deployment
- Managed Azure application delivery and production PostgreSQL/Redis connectivity
- Integrated teammates’ pull requests, resolved merge conflicts, corrected migration ordering, and maintained deployable project builds

### [PinnapolamP.A.H.D. (240515A) (@Hiruna4587)](https://github.com/Hiruna4587)

- Created the initial healthcare database schema and later schema constraints
- Built treatment catalogue CRUD and treatment query logic
- Implemented branch management, branch detail views, analytics, alerts, and safe branch deactivation
- Developed the admin dashboard with operational metrics, charts, and branch summaries
- Implemented appointment booking validation and related database behaviour
- Built patient complaint submission, history, and admin-management features
- Implemented insurance package management with searching, filtering, and CRUD operations
- Developed admin reports with KPIs, performance metrics, treatment/insurance reporting, and PDF export
- Enhanced admin settings and responsive theme behaviour
- Added database triggers protecting branch removal, doctor removal, and insurance-package validity

### [Perara B.N.D (240496M) (@nadildinulaka145-blip)](https://github.com/nadildinulaka145-blip)

- Built the front-desk layout, routing, loading skeletons, and recoverable error screens
- Implemented dashboard metrics, live patient queue, appointment-distribution charts, and quick actions
- Connected the patient directory to PostgreSQL and added live search and detailed patient records
- Built transactional patient registration and connected it to a validated form with Zod and toast feedback
- Connected the appointment table to live data and implemented appointment/check-in server actions
- Implemented scheduled, walk-in, and immediate-check-in booking flows using branch doctor schedules
- Connected branch billing to live invoices and payment-processing actions
- Built the payment collection dialog, payment-method selection, and printable receipt view
- Added front-desk insurance-claim status tracking

### [Rakumar K (240540U) (@Koshi2004)](https://github.com/Koshi2004)

- Designed doctor-related schema elements, triggers, functions, views, and stored procedures
- Built the active consultation workspace and treatment catalogue line-item attachment
- Implemented doctor appointment, consultation, patient, catalogue, profile, and schedule data layers
- Connected doctor portal screens to live PostgreSQL data
- Developed the doctor dashboard, daily queue, completed-patient views, and consultation start flow
- Built working-hours, profile, settings, and responsive doctor-navigation experiences
- Implemented prescription and medication workflows, including contraindication and allergy information
- Added clinical workflow protections and fixed consultation-completion and patient-booking defects
- Connected outstanding-balance reporting to live data

### [Gunawardena N.N.De.A (240205) (@NethmiNadeeshani2005)](https://github.com/NethmiNadeeshani2005)

- Built the patient navigation and branch-scoped application layout/state
- Developed the searchable doctor directory and multi-parameter filtering controls
- Implemented transactional patient booking with slot locking and anti-collision database logic
- Added ticket-capacity handling and user feedback for overbooked sessions
- Built appointment history and transactional rescheduling with a 24-hour guard
- Connected the patient dashboard to PostgreSQL for visits, prescriptions, balances, and recent activity
- Implemented patient billing, invoice history, insurance policies, and read-only claim tracking
- Developed payment and insurance-claim interfaces plus overpayment refund/credit task generation

Every portal depends on shared database rules and cross-team integration. The areas above describe primary ownership, not isolated work: contributors also reviewed, fixed, and integrated one another's features throughout development.

---

## License

No license file is currently included. Until a license is added, the project remains **all rights reserved**. Contact the repository owner before using, modifying, or redistributing the source code outside the permitted academic context.
