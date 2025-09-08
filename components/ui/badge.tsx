import * as React from "react";

type Variant = "default" | "secondary" | "outline" | "success" | "warning" | "danger";

const styles: Record<Variant, string> = {
  default: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-800 border border-slate-300",
  outline: "border border-slate-300 text-slate-800",
  success: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  warning: "bg-amber-100 text-amber-800 border border-amber-300",
  danger: "bg-red-100 text-red-800 border border-red-300",
};

export function Badge({
  children,
  className = "",
  variant = "default",
}: { children: React.ReactNode; className?: string; variant?: Variant }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
