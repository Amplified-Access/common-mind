import { LabApp } from "@/components/data-lab/lab-app";

// The signed-in Data Lab: its own bar in place of the site's header and footer.
export default function LabAppLayout({ children }: { children: React.ReactNode }) {
  return <LabApp>{children}</LabApp>;
}
