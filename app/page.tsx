// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ----------------------------- Chat widget ----------------------------- */

type ChatMessage = { role: "user" | "assistant"; content: string };

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Ask me anything about childcare energy, water, waste, or NQS 3 & 7.",
    },
  ]);

  // Keep an always-fresh reference to messages for building request payloads
  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change or panel opens
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  // Optional: prevent overlapping requests if user spams "Send"
  const pending = useRef<AbortController | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    // Optimistic append using functional update (safe in concurrent React)
    setBusy(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    // Build the payload from the freshest messages + the new one
    const outgoing = [...messagesRef.current, { role: "user", content: text }];
    const payload = { messages: outgoing.slice(-12) };

    // Abort any in-flight request
    pending.current?.abort();
    const ac = new AbortController();
    pending.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.message || "" },
      ]);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry—something went wrong: ${
              err?.message || "Unknown error"
            }`,
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
      >
        {isOpen ? "Close chat" : "Chat with DeepSeek"}
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 10c0 3.866-3.582 7-8 7-.85 0-1.665-.107-2.427-.308-.313-.083-.64-.05-.925.093L3 18l1.27-3.175c.1-.25.08-.533-.05-.76C3.458 12.988 3 11.54 3 10c0-3.866 3.582-7 8-7s7 3.134 7 7z" />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[360px] overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-semibold">Ask DeepSeek</div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="h-80 space-y-2 overflow-y-auto px-3 py-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-emerald-600 text-white"
                    : "mr-auto bg-slate-100 text-slate-900"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="mr-auto max-w-[80%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                Thinking…
              </div>
            )}
          </div>

          <form onSubmit={onSend} className="flex items-center gap-2 border-t p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about energy, water, NQS…"
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/* ----------------------------- Page content ---------------------------- */

export default function Home() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close on click outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar with logo + sign in menu */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Left: Logo + title */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-lid.svg"
              alt="LID Consulting"
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            <div>
              <div className="text-sm font-semibold tracking-tight">
                LID Consulting
              </div>
              <div className="text-xs text-slate-500">
                Childcare Energy & Sustainability
              </div>
            </div>
          </div>

          {/* Right: Sign in dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <span>Sign in</span>
              {/* chevron */}
              <svg
                className={`h-4 w-4 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.084l3.71-3.853a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg"
              >
                <div className="p-2 text-xs uppercase tracking-wide text-slate-500">
                  Access
                </div>
                <nav className="flex flex-col p-2">
                  <Link
                    href="/snapshot"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                  >
                    Parent Snapshot (Public)
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                  >
                    Client Dashboard
                  </Link>
                  <Link
                    href="/auditor"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                  >
                    Auditor Workspace
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                    role="menuitem"
                  >
                    Admin
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content only (no sign-in tiles) */}
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Reduce OPEX, satisfy NQS 3 &amp; 7, and disclose environmental
          performance with confidence
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          We help childcare <strong>Operators</strong> and{" "}
          <strong>Designers</strong> cut energy &amp; water costs, meet{" "}
          <strong>NQS Quality Areas 3 &amp; 7</strong> obligations with clear
          evidence, and produce<strong> investor-ready sustainability
          disclosures</strong>. Our NEPI-aligned audits, dashboards, and
          DA-ready playbooks reduce rework and accelerate decisions.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Lower OPEX</div>
            <p className="mt-1 text-sm text-slate-600">
              Targeted HVAC tuning, LEDs, controls, procurement and tariffs.
              Typical payback<span className="font-medium"> 12–24 months</span>.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">NQS 3 &amp; 7 support</div>
            <p className="mt-1 text-sm text-slate-600">
              Evidence-first workflows mapped to facilities (3) and
              leadership/governance (7).
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Environmental disclosure</div>
            <p className="mt-1 text-sm text-slate-600">
              Clear, auditable KPIs feeding sustainability reporting and
              parent-friendly snapshots.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-6 text-xs text-slate-500">
        <div className="flex flex-col items-start justify-between gap-3 border-t pt-4 md:flex-row md:items-center">
          <div>
            © {new Date().getFullYear()} LID Consulting — Childcare Energy &
            Sustainability
          </div>
          <div>Evidence-first • NEPI-aligned • Privacy-respecting</div>
        </div>
      </footer>

      {/* Floating chat app */}
      <ChatWidget />
    </main>
  );
}
