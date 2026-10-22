import { LabApp } from "@/components/lab-app";

// The signed-in Data Lab, under its own bar.
export default function LabAppLayout({ children }: LayoutProps<"/">) {
  return <LabApp>{children}</LabApp>;
}
