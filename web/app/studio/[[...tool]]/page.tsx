import { NextStudio } from "next-sanity/studio";

import { projectId } from "@/sanity/env";

import config from "../../../sanity.config";

// The Sanity Studio, where editors manage the site's content; see
// docs/cms.md. Editors sign in with their Sanity account, so the route itself
// needs no auth. The Studio runs in the browser only and is loaded by this
// route alone, so it doesn't grow any other page's bundle.
export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!projectId) {
    return (
      <main>
        <h1>The content studio isn&apos;t set up</h1>
        <p>
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
          <code>NEXT_PUBLIC_SANITY_DATASET</code> in <code>web/.env.local</code>{" "}
          (see <code>docs/cms.md</code>), then restart the server.
        </p>
      </main>
    );
  }
  return <NextStudio config={config} />;
}
