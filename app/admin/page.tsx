import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Admin — Leads & Providers",
  description: "Admin landing for managing leads and provider records.",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-lid.svg"
              alt="LID Consulting"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <div>
              <div className="text-sm font-semibold tracking-tight">Admin</div>
              <div className="text-xs text-slate-500">Private area • Basic Auth</div>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">At-a-glance</h1>
          <p className="mt-1 text-sm text-slate-600">High-level energy, water, and waste indicators. Detailed evidence sits on the private dashboard.</p>
        </div>
      </main>
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage inbound opportunities (name, contact, phone, url, coordinates).
            </p>
            <Link
              href="/leads"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Open Leads
            </Link>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight">Providers</h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage vendors/utilities and data sources used across the portfolio.
            </p>
            <Link
              href="/providers"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Open Providers
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border bg-emerald-50 p-4 text-sm text-emerald-900">
          Tip: this entire admin area (including /leads and /providers) requires Admin credentials
          (<code>ADMIN_USER</code>/<code>ADMIN_PASS</code>).
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-6 text-xs text-slate-500">
        <div className="flex flex-col items-start justify-between gap-3 border-t pt-4 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} LID Consulting — Admin</div>
          <div>Secure • Role-scoped access</div>
        </div>
      </footer>
    </main>
  );
}
