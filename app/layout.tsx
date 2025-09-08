import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LID Consulting • Childcare Energy & Compliance",
  description:
    "Value-focused dashboards for OPEX reduction, NQS 3 & 7 support, and sustainability disclosure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
