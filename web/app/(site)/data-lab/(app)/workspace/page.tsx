import type { Metadata } from "next";

import { Workspace } from "@/components/data-lab/workspace";

export const metadata: Metadata = {
  title: "Workspace | Data Lab",
};

export default function WorkspacePage() {
  return <Workspace />;
}
