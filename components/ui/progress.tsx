import * as React from "react";

export function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div
        className="h-full bg-emerald-600 transition-[width]"
        style={{ width: `${pct}%` }}
        aria-valuenow={pct}
        role="progressbar"
      />
    </div>
  );
}
