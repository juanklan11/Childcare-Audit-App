import dynamic from "next/dynamic";

const ParentSnapshot = dynamic(() => import("@/components/ParentSnapshot"), {
  ssr: false,
});

export default function Page() {
  return <ParentSnapshot />;
}
