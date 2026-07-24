"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  const variants = {
    default: "bg-[var(--brand-primary)] text-white border-transparent",
    secondary: "bg-gray-100 text-gray-700 border-transparent",
    destructive: "bg-[var(--danger-bg)] text-[var(--danger)] border-transparent",
    outline: "text-gray-700 border border-gray-300 bg-transparent",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
