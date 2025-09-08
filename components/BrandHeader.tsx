"use client";

import React from "react";

type BrandHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  note?: string;
  className?: string;
};

export default function BrandHeader({
  title,
  subtitle,
  icon,
  note,
  className = "",
}: BrandHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 border-b bg-white/80 backdrop-blur ${className}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{title}</div>
            {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
          </div>
        </div>
        {note ? (
          <div className="hidden items-center gap-4 md:flex text-xs text-slate-500">
            <span>{note}</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
