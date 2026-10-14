import type { Metadata } from "next";

import { Welcome } from "@/components/data-lab/welcome";

export const metadata: Metadata = {
  title: "Welcome · Data Lab",
};

export default function WelcomePage() {
  return <Welcome />;
}
