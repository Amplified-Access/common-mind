import { AuthProvider } from "@/components/data-lab/auth-provider";

// Every Data Lab page shares one sign-in session.
export default function DataLabLayout({ children }: LayoutProps<"/data-lab">) {
  return <AuthProvider>{children}</AuthProvider>;
}
