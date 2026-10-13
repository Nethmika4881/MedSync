# MedSync

MedSync is a clinic management system for Sri Lankan clinics with separate portals for patients, doctors, front desk staff, and administrators. It supports registration, queue based appointments, consultations, prescriptions, billing, insurance, reports, and complaints.

> **Academic project notice:** MedSync is a university demonstration project. It must not be used with real patient data without a full security, privacy, and regulatory review.

**Live application:** [medsync-uom-ewephsdhgzcedhax.indiasouthcentral-01.azurewebsites.net](https://medsync-uom-ewephsdhgzcedhax.indiasouthcentral-01.azurewebsites.net/)

**Repository:** [github.com/Nethmika4881/MedSync](https://github.com/Nethmika4881/MedSync)

## Main Features

| Portal     | Main features                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Patient    | Registration, doctor search, appointment booking and rescheduling, medical records, prescriptions, billing, insurance, and complaints |
| Doctor     | Daily queue, consultations, treatments, prescriptions, patient history, schedules, profile settings, and notifications                |
| Front desk | Patient registration, branch appointments, check in, live queue, billing, payments, receipts, and claim tracking                      |
| Admin      | Branches, staff, doctors, schedules, fees, treatments, insurance packages, complaints, reports, and settings                          |

## Architecture

```mermaid
flowchart LR
    U[Patients and staff] --> APP[Next.js application]
    APP --> AUTH[Middleware and server actions]
    AUTH --> DB[(PostgreSQL)]
    AUTH --> REDIS[(Redis sessions)]
    DB --> F[Flyway migrations]
    GH[GitHub Actions] --> AZ[Azure App Service]
    GH --> DB
```

The application uses the Next.js App Router and TypeScript. Server actions contain the backend logic. PostgreSQL is accessed through parameterised SQL with `pg`, and Redis stores authenticated sessions.

Important clinic rules are enforced with database constraints, transactions, functions, procedures, views, triggers, and row locks. These rules prevent problems such as appointment overbooking, overlapping schedules, and more than one active consultation for a doctor.

## Technology

| Area           | Technology                                        |
| -------------- | ------------------------------------------------- |
| Application    | Next.js 15, React 19, TypeScript 5                |
| Interface      | Tailwind CSS, shadcn/ui, Radix UI                 |
| Forms          | React Hook Form, Zod                              |
| Database       | PostgreSQL, `pg`, Flyway                          |
| Sessions       | Redis                                             |
| Reports        | Recharts, jsPDF                                   |
| Testing        | Playwright                                        |
| Infrastructure | Docker Compose, GitHub Actions, Azure App Service |

## Getting Started

You need Node.js 22, npm, Git, Docker, and Docker Compose.

### 1. Clone and install

```bash
git clone https://github.com/Nethmika4881/MedSync.git
cd MedSync
npm install
```

### 2. Create local configuration

```bash
cp .env.example .env
cp docker-compose.yml.example docker-compose.yml
cp flyway.conf.example flyway.conf
```

Use these values with the default local Docker setup:

```env
DATABASE_URL="postgresql://flyway_user:local_dev_password@localhost:5432/mydb"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Start the services

```bash
docker compose up -d
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional demonstration data

```bash
docker exec -i medsync-db psql -U flyway_user -d mydb < Database/mock_data_seed.sql
```

Use the demonstration data only in local or demonstration environments.

## Environment Variables

| Variable              | Required | Purpose                                               |
| --------------------- | -------: | ----------------------------------------------------- |
| `DATABASE_URL`        |      Yes | PostgreSQL connection string                          |
| `REDIS_URL`           |      Yes | Redis connection string                               |
| `NEXT_PUBLIC_APP_URL` |       No | Public application URL                                |
| `DB_PASSWORD`         |       No | Local Docker database password                        |
| `PLAYWRIGHT_BASE_URL` |       No | Address of an existing application used by Playwright |
| `PLAYWRIGHT_PORT`     |       No | Port for the Playwright local server                  |

Never commit local environment files, production credentials, or cloud secrets.

## Database

Flyway migrations are stored in `Database/` and use the format `V<number>__<description>.sql`. They create the schema and add later rules for appointments, consultations, profiles, notifications, billing, and administration.

```bash
# Apply migrations with Docker Compose
docker compose up flyway

# View migration output
docker compose logs flyway
```

## Project Structure

```text
MedSync/
├── app/                  # Pages for all four portals
├── components/           # Shared interface components
├── lib/actions/          # Server actions and backend logic
├── lib/server/           # Server authentication, validation, and SQL
├── Database/             # Flyway migrations and demonstration data
├── redis/                # Redis connection
├── e2e/                  # Playwright tests
└── .github/workflows/    # Database and deployment automation
```

## Commands

| Command            | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the development server         |
| `npm run build`    | Create a production build            |
| `npm start`        | Start the production server          |
| `npm run lint`     | Run lint checks                      |
| `npm test`         | Run Playwright tests                 |
| `npm run test:e2e` | Run the end to end test suite        |
| `npm run migrate`  | Run the configured migration command |

## Security and Testing

MedSync includes password hashing with unique salts, Redis sessions, secure cookies, middleware route protection, server role checks, branch access checks, parameterised SQL, Zod validation, database transactions, security headers, and environment based secrets.

The Playwright suite covers patient registration, login, logout, protected routes, invalid credentials, valid credentials, and responsive navigation.

```bash
npx playwright install chromium
npm run test:e2e
```

The tests require working `DATABASE_URL` and `REDIS_URL` values.

## Deployment and CI/CD

| Workflow                | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `database-pr-check.yml` | Validate migration names and test migrations on pull requests |
| `neon-migrations.yml`   | Run controlled development or production database migrations  |
| `main_medsync-uom.yml`  | Build and deploy the application to Azure App Service         |

Deployment credentials and database connection values are stored as GitHub Actions secrets.

## Team and Contributions

The points below summarize each member's main areas of ownership based on the implemented features and Git history. Team members also reviewed, fixed, and integrated work across the whole system.

### [Kumarasiri I. D. N. (240370X) (@Nethmika4881)](https://github.com/Nethmika4881)

- Created the repository foundation, application structure, routes, shared interface components, and early responsive screens
- Built authentication, patient registration, validation, password security, Redis sessions, middleware, and role-based routing
- Developed admin features for staff, doctors, schedules, fees, patient access and auditing, reports, revenue, and branch summaries
- Set up Flyway, PostgreSQL, Docker, Redis, shared database access, and database rules requiring managers for active branches
- Created the three CI/CD workflows, managed Azure delivery, integrated team branches, and resolved build and migration conflicts

### [Pinnapola P. A. H. D. (240515A) (@Hiruna4587)](https://github.com/Hiruna4587)

- Created the initial healthcare schema and added constraints and triggers that protect important data
- Built treatment catalogue management and treatment query features
- Developed branch management, branch analytics, the admin dashboard, settings, and notifications
- Implemented complaints and insurance package management
- Built admin reports, performance measures, insurance and treatment reports

### [Perara B. N. D. (240496M) (@nadildinulaka145-blip)](https://github.com/nadildinulaka145-blip)

- Built the front desk layout, navigation, loading states, and recoverable error screens
- Developed dashboard measures, charts, quick actions, and the live patient queue
- Connected patient search and patient details to PostgreSQL and built transactional registration
- Implemented scheduled and walk-in appointments with live slot selection and check-in actions
- Built invoice, payment, receipt, and insurance claim workflows and corrected front desk routing issues

### [Rakumar K. (240540U) (@Koshi2004)](https://github.com/Koshi2004)

- Designed doctor related tables, triggers, functions, views, and stored procedures
- Built the doctor data layer and connected doctor screens to live PostgreSQL data
- Developed the dashboard, patient queue, schedules, working hours, profiles, and settings
- Built the consultation workspace with treatment selection, notes, follow ups, and completion rules
- Implemented prescriptions, medication and allergy safety, multiple doctor specializations, and database protections against overlapping doctor time slots in V35

### [Gunawardena N. N. De. A. (240205) (@NethmiNadeeshani2005)](https://github.com/NethmiNadeeshani2005)

- Built patient navigation, branch-aware state, branch selection during authentication, and the patient application layout
- Developed the searchable doctor directory with multiple filters
- Implemented safe appointment booking with slot locking, ticket limits, and collision prevention
- Built appointment history, rescheduling, dashboard data, grouped prescription views, and medical records
- Developed billing, invoice, insurance, claim, payment, refund, and credit request experiences
