// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DollarSign, ClipboardCheck, Users } from "lucide-react";

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

  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isOpen]);

  const pending = useRef<AbortController | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setBusy(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const outgoing = [...messagesRef.current, { role: "user", content: text }];
    const payload = { messages: outgoing.slice(-12) };

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
        {isOpen ? "Close chat" : "Chat with Lid Bot"}
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 10c0 3.866-3.582 7-8 7-.85 0-1.665-.107-2.427-.308-.313-.083-.64-.05-.925.093L3 18l1.27-3.175c.1-.25.08-.533-.05-.76C3.458 12.988 3 11.54 3 10c0-3.866 3.582-7 8-7s7 3.134 7 7z" />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[360px] overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-semibold">Ask Lid Bot</div>
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

          <form
            onSubmit={onSend}
            className="flex items-center gap-2 border-t p-2"
          >
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
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header with logo only */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
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
                Simplifying Sustainability
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Childcare Sustainability Audit 
        </h1>
        <p className="mt-3 max-w-3xl mx-auto text-lg text-slate-600">
          Evidence-first audits to cut costs, prove compliance, and build trust
           with parents, staff, investors, and landlords.
        </p>
        <p className="mt-4 max-w-3xl mx-auto text-slate-600">
          Childcare is now a{" "}
          <span className="font-semibold text-emerald-600">$14.6 billion</span>{" "}
          sector in Australia, serving more than{" "}
          <span className="font-semibold text-emerald-600">1.7 million children</span>{" "}
          each year. But providers face mounting challenges: rising fees (up{" "}
          <span className="font-semibold text-rose-600">20–32%</span> since 2018),
          workforce and compliance pressures, and growing expectations for
          environmental disclosure.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-left">
            <DollarSign className="h-6 w-6 text-emerald-600 mb-2" />
            <div className="text-sm font-semibold">Reduce operating costs</div>
            <p className="mt-1 text-sm text-slate-600">
              Energy and water now account for up to{" "}
              <strong>12–15% of OPEX</strong>. Our audits target HVAC, lighting,
              tariffs and procurement with typical paybacks of{" "}
              <span className="font-medium">12–24 months</span>.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-left">
            <ClipboardCheck className="h-6 w-6 text-emerald-600 mb-2" />
            <div className="text-sm font-semibold">Compliance made easy</div>
            <p className="mt-1 text-sm text-slate-600">
              Align operations with <strong>NQS 3 (Physical Environment)</strong>{" "}
              and <strong>NQS 7 (Governance &amp; Leadership)</strong>. We
              translate sustainability actions into assessor-ready evidence.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-left">
            <Users className="h-6 w-6 text-emerald-600 mb-2" />
            <div className="text-sm font-semibold">
              Investor &amp; parent confidence
            </div>
            <p className="mt-1 text-sm text-slate-600">
              With average daily fees at <strong>$123+</strong>, families and
              investors expect transparency. Our dashboards provide{" "}
              <strong>NEPI-aligned KPIs</strong> and{" "}
              <strong>parent-friendly snapshots</strong> that strengthen trust
              and marketability.
            </p>
          </div>
        </div>
      </section>

      {/* CTA buttons */}
      <section className="mx-auto max-w-6xl px-6 pt-6 text-center">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/snapshot"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            Go to Parent Snapshot
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 shadow hover:bg-slate-200"
          >
            Go to Client Dashboard
          </Link>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Parent view: simple, transparent reporting • Client view: detailed
          operational insights
        </p>
      </section>

      {/* Contact Us section */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ready to begin?</h2>
          <p className="mt-3 text-xs text-slate-700">
            <strong>Contact Craig Harris - LID Consulting</strong>
            <br />
            P 03 9016 9486
            <br />
            M 0434 911 404
            <br />
            E{" "}
            <a
              href="mailto:craigharris@lidconsulting.com.au"
              className="text-emerald-600 hover:underline"
            >
              craigharris@lidconsulting.com.au
            </a>
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-6 text-xs text-slate-500">
        <div className="flex flex-col items-start justify-between gap-3 border-t pt-4 md:flex-row md:items-center">
          <div>
            © {new Date().getFullYear()} LID Consulting — Sustainability Audit
          </div>
          <div>Evidence-first • NEPI-aligned • Privacy-respecting</div>
        </div>
      </footer>

      {/* Floating chat app */}

    </main>
  );
}




