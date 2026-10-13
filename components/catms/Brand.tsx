import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

export function Brand({ className, markClassName, textClassName }: BrandProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/favicon.ico?v=2"
        width={40}
        height={40}
        alt=""
        aria-hidden="true"
        className={cn("size-8 shrink-0 rounded-lg object-cover", markClassName)}
      />
      <span className={cn("font-bold font-outfit tracking-tight text-slate-900", textClassName)}>
        Med<span className="text-[var(--brand-primary)]">Sync</span>
      </span>
    </span>
  );
}
