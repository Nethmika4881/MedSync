# MedSync Developer Guide

MedSync is a Next.js clinic management prototype using React, TypeScript, Tailwind CSS, Zustand, and MySQL.

The UI currently uses mock data and client-side state. Demo login is not production authentication.

## Requirements

- Linux, macOS, or Windows
- Bun 1.x
- MySQL 8+

## Setup

Run these commands from the repository's `MedSync` directory.

### 1. Configure MySQL

Start MySQL using the command for your platform:

| Platform | Command |
| --- | --- |
| Linux | `sudo systemctl start mysql` |
| macOS/Homebrew | `brew services start mysql` |
| Windows PowerShell | `Start-Service MySQL80` |

Create the database:

```sql
CREATE DATABASE medsync;
```

Copy the environment template and update the credentials:

```sh
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Required variables:

```text
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=medsync
DB_PORT=3306
```

Load the schema:

```sh
mysql -u root -p medsync < schema/schema.sql
```

If your MySQL service or user has a different name, adjust the commands. Do not commit `.env` or credentials.

### 2. Install and run

```sh
bun install
bun run dev
```

Open <http://localhost:3000> and select a demo role. The app redirects to `/app/dashboard`.

### 3. Production build

```sh
bun run build
bun run start
```

## Commands

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start the development server with Turbopack |
| `bun run lint` | Run linting |
| `bun run build` | Create a production build |
| `bun run start` | Serve the production build |

There is no automated test script yet.

## Structure

```text
app/                    Next.js routes and layouts
  app/                  Authenticated application routes
components/catms/       Feature components
components/ui/          Shared UI primitives
lib/mockData/           Demo domain data
lib/stores/             Zustand stores
schema/schema.sql       MySQL schema
```

The `@/*` alias points to the project root.

## Development Conventions

- Add routes under `app/app/<route>/page.tsx`.
- Add shared feature components under `components/catms`.
- Reuse primitives from `components/ui`.
- Keep seed data in `lib/mockData` and shared state in `lib/stores`.
- Add sidebar entries in `lib/roleNavConfig.ts`.
- Use `"use client"` for components using Zustand or browser APIs.
- Run `bun run lint` and `bun run build` before submitting changes.

## Database Notes

The schema is in `schema/schema.sql`. `lib/db.ts` currently contains development connection defaults; update it to read the `DB_*` variables when using credentials different from the defaults.

Reload the schema with:

```sh
mysql -u root -p medsync < schema/schema.sql
```

## Troubleshooting

### MySQL connection errors

Check that MySQL is running, the `medsync` database exists, `.env` has valid values, and the schema has been loaded.

### Windows MySQL service name

If `MySQL80` is not found, run:

```powershell
Get-Service *mysql*
```

Use the returned service name with `Start-Service`.

### Demo role disappears after refresh

This is expected. The current auth store is in-memory and does not persist sessions.

## Production Readiness

Before deployment, add real authentication, server-side authorization, environment-based database configuration, durable persistence, and automated tests for permissions and clinical safety checks.
