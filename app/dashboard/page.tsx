import dynamic from "next/dynamic";

const NEPIAuditDashboard = dynamic(() => import("@/components/NEPIAuditDashboard"), {
  ssr: false,
});

export default function Page() {
  return <NEPIAuditDashboard />;
}
