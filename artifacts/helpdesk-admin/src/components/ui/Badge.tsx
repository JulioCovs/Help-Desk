import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    neutral: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "open": return <Badge variant="default">Open</Badge>;
    case "in_progress": return <Badge variant="warning">In Progress</Badge>;
    case "resolved": return <Badge variant="success">Resolved</Badge>;
    case "closed": return <Badge variant="neutral">Closed</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "low": return <Badge variant="neutral">Low</Badge>;
    case "medium": return <Badge variant="default">Medium</Badge>;
    case "high": return <Badge variant="warning">High</Badge>;
    case "urgent": return <Badge variant="error">Urgent</Badge>;
    default: return <Badge variant="neutral">{priority}</Badge>;
  }
}
