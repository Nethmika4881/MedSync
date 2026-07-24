"use client";

import React from "react";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";

interface AvatarWithNameProps {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarWithName({ name, subtitle, avatarSrc, size = "md", className }: AvatarWithNameProps) {
  const sizeMap = {
    sm: { avatar: "w-8 h-8 text-xs", name: "text-sm", subtitle: "text-xs" },
    md: { avatar: "w-10 h-10 text-sm", name: "text-sm font-semibold", subtitle: "text-xs" },
    lg: { avatar: "w-12 h-12 text-base", name: "text-base font-semibold", subtitle: "text-sm" },
  };
  const s = sizeMap[size];
  const colorClass = getAvatarColor(name);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center font-bold shrink-0 avatar-shape",
          s.avatar,
          colorClass
        )}
      >
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <p className={cn(s.name, "text-[var(--text-primary)] truncate")}>{name}</p>
        {subtitle && (
          <p className={cn(s.subtitle, "text-[var(--text-muted)] truncate")}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
