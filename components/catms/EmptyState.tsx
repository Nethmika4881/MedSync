"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
      )}
      <p className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</p>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
