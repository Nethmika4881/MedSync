import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Deterministic pastel background from a name string */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-red-100 text-red-700',
    'bg-indigo-100 text-indigo-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(prefix: string): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${num}`;
}

/**
 * Map doctor specialties to rich Tailwind CSS gradients.
 * Falls back to a deterministic hash if specialty is not explicitly mapped.
 */
export function getSpecialtyGradient(specialty?: string): string {
  if (!specialty) return "from-teal-500 to-emerald-600";

  const normalized = specialty.trim().toLowerCase();

  const specialtyMap: Record<string, string> = {
    cardiology: "from-rose-500 to-red-600",
    cardiologist: "from-rose-500 to-red-600",
    dermatology: "from-amber-500 to-orange-600",
    dermatologist: "from-amber-500 to-orange-600",
    pediatrics: "from-sky-400 to-blue-600",
    pediatrician: "from-sky-400 to-blue-600",
    neurology: "from-purple-500 to-indigo-600",
    neurologist: "from-purple-500 to-indigo-600",
    orthopedics: "from-emerald-500 to-teal-600",
    orthopedic: "from-emerald-500 to-teal-600",
    "general practice": "from-teal-500 to-cyan-600",
    "general practitioner": "from-teal-500 to-cyan-600",
    "internal medicine": "from-teal-500 to-cyan-600",
    dentistry: "from-blue-500 to-cyan-500",
    dentist: "from-blue-500 to-cyan-500",
    ophthalmology: "from-violet-500 to-fuchsia-600",
    ophthalmologist: "from-violet-500 to-fuchsia-600",
    optometry: "from-violet-500 to-fuchsia-600",
    gynecology: "from-pink-500 to-rose-500",
    gynecologist: "from-pink-500 to-rose-500",
    psychiatry: "from-indigo-500 to-violet-600",
    psychiatrist: "from-indigo-500 to-violet-600",
    psychology: "from-indigo-500 to-violet-600",
    oncology: "from-orange-500 to-amber-600",
    oncologist: "from-orange-500 to-amber-600",
    radiology: "from-slate-600 to-gray-800",
    radiologist: "from-slate-600 to-gray-800",
    ent: "from-lime-500 to-emerald-600",
    otolaryngology: "from-lime-500 to-emerald-600",
    gastroenterology: "from-yellow-500 to-amber-600",
    urology: "from-blue-600 to-sky-600",
    pulmonology: "from-cyan-600 to-teal-700",
    endocrinology: "from-fuchsia-500 to-pink-600",
  };

  if (specialtyMap[normalized]) {
    return specialtyMap[normalized];
  }

  // Check for substring matches
  for (const [key, gradient] of Object.entries(specialtyMap)) {
    if (normalized.includes(key)) {
      return gradient;
    }
  }

  // Fallback: deterministic gradient from specialty string
  const fallbackGradients = [
    "from-teal-500 to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
  ];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackGradients[Math.abs(hash) % fallbackGradients.length];
}

