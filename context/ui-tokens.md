This `ui-tokens.md` file defines the visual primitives extracted directly from your MedSync CATMS mockups. It is tailored specifically for your Tailwind CSS v3 and shadcn/ui stack, ensuring every component across the four portals remains visually identical.

# UI Tokens

Design tokens for MedSync Clinic Management (CATMS). All colors, typography, and spacing must use these semantic Tailwind variables. Hardcoded hex values (e.g., `bg-[#10b981]`) and generic color scales (e.g., `text-gray-500`) are strictly prohibited.

---

## globals.css (CSS Variables)

Define these HSL variables in your `@layer base` to power the shadcn/ui theme configuration in `tailwind.config.ts`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Base Backgrounds */
    --background: 210 40% 98%; /* #f8fafc / Very light gray page background */
    --foreground: 222.2 84% 4.9%; /* #0f172a / Dark slate for primary text */

    /* Card & Surface */
    --card: 0 0% 100%; /* #ffffff / Solid white for cards and sidebars */
    --card-foreground: 222.2 84% 4.9%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    /* Brand Primary (MedSync Teal) */
    --primary: 164 78% 38%; /* Teal/Emerald used for active states and primary buttons */
    --primary-foreground: 0 0% 100%; /* White text on primary */
    
    /* Subtle Brand Muted (Light teal for active nav/badges) */
    --primary-muted: 152 76% 96%; /* #ecfdf5 / Used for 'Paid' and 'Available' pill backgrounds */
    
    /* Secondary & Muted */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%; /* #64748b / Slate-500 for subtitles and table headers */

    /* Borders & Inputs */
    --border: 214.3 31.8% 91.4%; /* #e2e8f0 / Slate-200 for card borders and dividers */
    --input: 214.3 31.8% 91.4%;
    --ring: 164 78% 38%; /* Focus ring strictly matches the primary brand teal */

    /* Status Colors */
    --success: 164 78% 38%; /* Matches Primary */
    --success-foreground: 0 0% 100%;
    
    --warning: 38 92% 50%; /* Amber for 'Due' status badges */
    --warning-foreground: 0 0% 100%;
    
    --destructive: 0 84.2% 60.2%; /* Red for errors and cancellations */
    --destructive-foreground: 210 40% 98%;

    /* Radii */
    --radius: 0.5rem; /* 8px default for inputs, pills, and buttons */
    --radius-card: 0.75rem; /* 12px for dashboard cards */
    --radius-modal: 1rem; /* 16px for large dialog modals */
  }
}

```

---

## Color Usage Guide

### Surfaces & Borders

| Element | Tailwind Class | Usage |
| --- | --- | --- |
| **Page Background** | `bg-background` | Outer canvas behind all cards and layouts. |
| **Cards & Sidebar** | `bg-card` | Solid white surface for the sidebar navigation and content cards. |
| **Dividers & Lines** | `border-border` | Subtle lines separating table rows and sidebar sections. |
| **Modal Headers** | `bg-primary` | The top portion of booking/confirmation modals uses a solid teal fill. |

### Brand & Interactive (MedSync Teal)

| Element | Tailwind Class | Usage |
| --- | --- | --- |
| **Primary Buttons** | `bg-primary text-primary-foreground` | "Book Now", "Review", "Confirm Booking". |
| **Active Nav Items** | `bg-primary text-primary-foreground` | Highlights the current route (e.g., "Billing" or "Dashboard") in the sidebar. |
| **Filter Chips** | `bg-primary text-primary-foreground` | Active state for category filters (e.g., "All" vs "Cardiology"). |
| **Modal Steps** | `text-primary` | Numbered progress indicators inside booking modals. |

### Status Badges (Pills)

All status badges must use `rounded-full` (pill shape) with `px-3 py-1`.

| Status | Background Token | Text Token | Example Usage |
| --- | --- | --- | --- |
| **Paid / Available** | `bg-primary-muted` | `text-primary` | Invoice Paid, Doctor Available |
| **Due / Pending** | `bg-warning/15` | `text-warning` | Unpaid Invoices, Pending Approvals |
| **Cancelled** | `bg-destructive/15` | `text-destructive` | Cancelled Appointments |

---

## Typography Hierarchy

| Element | Size & Weight | Tailwind Classes | Color |
| --- | --- | --- | --- |
| **Page Title** | 24px, Bold | `text-2xl font-bold` | `text-foreground` |
| **Section Heading** | 18px, Semibold | `text-lg font-semibold` | `text-foreground` |
| **Card Title** | 16px, Medium | `text-base font-medium` | `text-foreground` |
| **Body Text** | 14px, Normal | `text-sm font-normal` | `text-foreground` |
| **Subtitle / Muted** | 14px, Normal | `text-sm font-normal` | `text-muted-foreground` |
| **Table Headers** | 12px, Bold, Caps | `text-xs font-bold uppercase tracking-wider` | `text-muted-foreground` |
| **Metric Numbers** | 30px, Bold | `text-3xl font-bold` | `text-foreground` |

---

## Component Structural Tokens

**Cards (`<Card>`)**

* **Border:** `border border-border`
* **Shadow:** `shadow-sm`
* **Radius:** `rounded-xl` (Mapped to `--radius-card`)
* **Padding:** `p-6` for standard blocks; `p-4` for dense Doctor profile cards.

**Modals (`<Dialog>`)**

* **Overlay:** `bg-black/40` (Darkens background content).
* **Header Architecture:** Top half of the modal (containing title, subtitle, and close button) utilizes `bg-primary text-primary-foreground`. Bottom half utilizes `bg-card`.
* **Shadow:** `shadow-lg`
* **Radius:** `rounded-2xl` (Mapped to `--radius-modal`)

**Forms & Inputs (`<Input>`, `<Select>`)**

* **Border:** `border border-border`
* **Background:** `bg-card` (White)
* **Radius:** `rounded-md`
* **Focus State:** `focus-visible:ring-1 focus-visible:ring-ring` (Teal outline).