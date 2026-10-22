import type { Metadata } from "next";

import { Welcome } from "@/components/welcome";

export const metadata: Metadata = {
  title: "Welcome · Data Lab",
};

export default function WelcomePage() {
  return <Welcome />;
}
