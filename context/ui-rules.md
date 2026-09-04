**UI Rules**

Concise rules for building the Healthora Clinic Management (CATMS) UI. These constraints ensure visual consistency across all four portals (Patient, Doctor, Front Desk, Admin) and dictate how shadcn/ui primitives should be implemented.

---

**Font**
Always import Inter via `next/font/google` in the root layout.

```typescript
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

```

The `--font-sans` variable must be mapped to your `fontFamily` in `tailwind.config.ts`. Never use system fonts as the primary font.

---

**Layout Systems**
Healthora utilizes two distinct layout patterns based on user role:

* **Patient Portal:** Top navigation bar only. Max-width container (e.g., `max-w-7xl`), centered, with a light gray page background (`bg-background`).
* **Staff Portals (Doctor, Admin, Front Desk):** Fixed left sidebar (`w-64`, `bg-card`, `border-r`) with a fluid main content area.
* **Spacing:** Main content areas must use `p-6` or `p-8`. Gap between major page sections is `gap-6` (24px).

---

**Navigation (Sidebar & Navbar)**

* **Active Item:** Teal background (`bg-primary`), white text (`text-primary-foreground`), `font-medium`, `rounded-md`.
* **Inactive Item:** Transparent background, dark text (`text-foreground`), hover state `hover:bg-muted`.
* **Icons:** Navigation icons scale to `w-5 h-5` and match the text color of the item.

---

**Cards**
Every distinct content section (e.g., Activity Overview, Upcoming Appointments) lives inside a Card.

```css
background: bg-card
border: border border-border
border-radius: rounded-xl
padding: p-6
box-shadow: shadow-sm

```

Never use colored card backgrounds for content containers. Color goes inside cards via badges, buttons, and text.

---

**Typography Hierarchy**
Maintain strict sizing and weight mapping across all pages:

* **Page Title:** `text-2xl font-bold text-foreground` (24px).
* **Section/Card Heading:** `text-lg font-semibold text-foreground` (18px).
* **Body Text:** `text-sm font-normal text-foreground` (14px).
* **Secondary/Muted Text:** `text-sm font-normal text-muted-foreground` (14px). Used for timestamps, descriptions, and labels.

---

**Status Badges (Pills)**
All status indicators must use a pill shape (`rounded-full`) and combine a low-opacity background with vibrant text.

* **Padding/Font:** `px-3 py-1 text-xs font-medium`.
* **Paid/Available:** `bg-primary-muted text-primary`
* **Due/Pending:** `bg-warning/15 text-warning`
* **Cancelled/Error:** `bg-destructive/15 text-destructive`

---

**Buttons**

* **Primary Button:** `bg-primary text-primary-foreground hover:bg-primary/90`. Used for the main action (e.g., "Book Now", "Save Changes").
* **Secondary/Outline Button:** `bg-card border border-border text-foreground hover:bg-muted`. Used for alternative actions (e.g., "Back", "Discard").
* **Radius:** All standard buttons use `rounded-md` (`--radius`).

---

**Forms & Inputs**

* **Inputs/Selects:** `bg-card border border-border text-foreground rounded-md px-3 py-2 text-sm`.
* **Placeholder:** `text-muted-foreground`.
* **Focus State:** Must strictly use `focus-visible:ring-1 focus-visible:ring-ring` (Healthora Teal). Never use default blue browser focus rings.

---

**Tables (Invoices, Appointments)**

* **Headers:** `text-xs font-bold uppercase tracking-wider text-muted-foreground`.
* **Row Dividers:** `border-b border-border` between rows. No alternating background colors.
* **Hover State:** `hover:bg-muted/50` on clickable rows.

---

**Modals (Dialogs)**
Healthora booking and confirmation modals feature a distinctive two-tone architecture:

* **Header Section:** The top half containing the title and close button must use `bg-primary text-primary-foreground`.
* **Content Section:** The bottom half containing the form/details uses `bg-card`.
* **Radius:** Modals are exceptionally rounded using `rounded-2xl` (`--radius-modal`), overlapping the standard card radius.
* **Overlay:** `bg-black/40` backdrop blur.

---

**Tailwind v3 Constraints & Do Nots**

* **No Hardcoded Colors:** Never use raw Tailwind color classes (e.g., `bg-emerald-500`, `text-slate-600`) or hex codes (`bg-[#10b981]`). You must use the semantic tokens defined in `tailwind.config.ts` (e.g., `bg-primary`, `text-muted-foreground`).
* **Configuration:** Colors must be mapped in `tailwind.config.ts` referencing the HSL CSS variables from `globals.css`.
* **No Multiple Font Weights:** Never mix font weights in a single UI element (e.g., a button should be uniformly `font-medium`).
* **No Fixed Positioning:** Never use `fixed` or `absolute` positioning for standard layout elements; rely on flexbox and grid.