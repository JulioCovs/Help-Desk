import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // @replit
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          // @replit no hover because we use hover-elevate
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
          // @replit shadow-xs" - use badge outline variable
        outline: "text-foreground border [border-color:var(--badge-outline)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

const statusClass: Record<string, string> = {
  open: "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
  in_progress: "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  closed: "border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = statusClass[status] ?? statusClass.open;
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold", cls)}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

const priorityClass: Record<string, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-sky-200 bg-sky-50 text-sky-900",
  high: "border-orange-200 bg-orange-50 text-orange-900",
  urgent: "border-red-200 bg-red-50 text-red-900",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const cls = priorityClass[priority] ?? priorityClass.medium;
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold", cls)}>
      {priority}
    </span>
  );
}
