"use client";
import * as React from "react";

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
};
const TabsCtx = React.createContext<TabsContextType | null>(null);

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  className = "",
  children,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
  defaultValue?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? (value as string) : internal;

  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  // if neither controlled nor default provided, pick first <TabsTrigger> child on mount
  React.useEffect(() => {
    if (!isControlled && !internal) {
      const first = document.querySelector<HTMLButtonElement>("[data-tabs-trigger]");
      if (first) setInternal(first.dataset.value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TabsCtx.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`inline-flex rounded-xl border bg-white p-1 ${className}`}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  className = "",
}: {
  value: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      data-tabs-trigger
      data-value={value}
      onClick={() => ctx.setValue(value)}
      className={[
        "px-3 py-1.5 text-sm rounded-lg transition-colors",
        active ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-100",
        className,
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}
