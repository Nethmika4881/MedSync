**UI Registry**

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

**How to Use**

Before building any component:

1. Check if a similar component already exists here.
2. If yes — match its exact classes and structural tokens.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component — update this file with the component name, file path, and exact classes used.

---

**Components**

Below are the foundational UI components extracted from the initial mocked UI. As new features are built and shadcn/ui primitives are customized, append them to this list.

**Status Badge (Pill)**

* **File:** `components/shared/StatusBadge.tsx`
* **Purpose:** Displays states like Paid, Due, Cancelled, or Available.
* **Base Classes:** `inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium`
* **Variant Classes:**
* Success/Available: `bg-primary-muted text-primary`
* Warning/Due: `bg-warning/15 text-warning`
* Destructive/Cancelled: `bg-destructive/15 text-destructive`



**Metric Card**

* **File:** `components/dashboard/MetricCard.tsx`
* **Purpose:** High-level dashboard counters (e.g., Upcoming Appointments, Outstanding Bills).
* **Base Classes:** `bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-2`
* **Value Typography:** `text-3xl font-bold text-foreground`
* **Label Typography:** `text-sm font-normal text-muted-foreground`

**Doctor Profile Card**

* **File:** `components/appointments/DoctorCard.tsx`
* **Purpose:** Displays doctor specialization, experience, and fee in the Find Doctors directory.
* **Base Classes:** `bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col`
* **Avatar:** `h-12 w-12 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center`
* **Book Button:** `bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 mt-auto`

**Two-Tone Booking Modal**

* **File:** `components/shared/TwoToneModal.tsx` (Custom wrapper around shadcn `<Dialog>`)
* **Purpose:** Complex multi-step flows like Appointment Booking and Confirmations.
* **Modal Container Classes:** `rounded-2xl overflow-hidden shadow-lg bg-card border-none`
* **Header Classes:** `bg-primary text-primary-foreground p-6 relative`
* **Content Classes:** `bg-card p-6`
* **Close Button:** `absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground bg-black/10 rounded-full p-1`

**Sidebar Navigation Item**

* **File:** `components/layout/SidebarNav.tsx`
* **Purpose:** Main routing links for staff and admin portals.
* **Base Classes:** `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors`
* **Active State:** `bg-primary text-primary-foreground font-medium`
* **Inactive State:** `text-foreground hover:bg-muted font-normal`

**Data Table Row**

* **File:** `components/shared/DataTable.tsx`
* **Purpose:** Invoice, Patient, and Report lists.
* **Header Row Classes:** `border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground pb-3`
* **Body Row Classes:** `border-b border-border py-4 text-sm text-foreground hover:bg-muted/50 transition-colors`