// Unified login page for all CATMS roles (Admin, Doctor, Front Desk, Patient).
// Authentication is handled via NextAuth.js / JWT — see lib/auth.ts.
// This is a stub to be implemented in Phase 1, Task 03:
// "NextAuth.js / JWT Authentication Setup & Middleware Role Routing"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          MedSync Login
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Authentication UI to be implemented in Phase 1 — Task 03.
        </p>
      </div>
    </main>
  );
}
