"use client";
import * as React from "react";

type Mode = "single"; // keep simple for now

type Ctx = {
  mode: Mode;
  value: string;
  setValue: (v: string) => void;
};
const TG = React.createContext<Ctx | null>(null);

export function ToggleGroup({
  type = "single",
  value,
  onValueChange,
  defaultValue = "",
  className = "",
  children,
}: {
  type?: Mode;
  value?: string;
  onValueChange?: (v: string) => void;
  defaultValue?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as string) : internal;
  const setValue = (v: string) => {
    if (!controlled) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TG.Provider value={{ mode: type, value: current, setValue }}>
      <div className={`inline-flex items-center gap-1 rounded-xl border bg-white p-1 ${className}`}>{children}</div>
    </TG.Provider>
  );
}

export function ToggleGroupItem({
  value,
  children,
  className = "",
}: {
  value: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TG)!;
  const active = ctx.value === value;
  return (
    <button
      onClick={() => ctx.setValue(value)}
      type="button"
      className={[
        "rounded-lg px-3 py-1.5 text-sm transition-colors",
        active ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
