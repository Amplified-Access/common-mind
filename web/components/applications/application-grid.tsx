import { Arrow } from "@/components/system/arrow";
import { CmsLogo } from "@/components/system/cms-logo";
import { FRAME, FRAME_PANELS } from "@/components/system/framed-card";
import { TagChain } from "@/components/system/tag-chain";
import { getContent } from "@/lib/content";
import { cn } from "@/lib/utils";

// Each application as a framed card that links to its site: the logo on a
// dark panel lit by a fine grid from the right edge, as the model cards are,
// and the application's own description below it.
async function ApplicationGrid() {
  const { applications } = await getContent();
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {applications.map((app) => (
        <li key={app.name} className="flex">
          <a
            href={app.href}
            target="_blank"
            rel="noreferrer"
            className={cn("group flex flex-1 transition-colors hover:border-signal/60", FRAME)}
          >
            <div className={cn("flex min-w-0 flex-1 flex-col", FRAME_PANELS)}>
              <div className="relative isolate flex h-56 items-center justify-center bg-[#0b0a07]">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-grid [--grid-line:rgb(255_255_255/0.09)] mask-[radial-gradient(260px_115px_at_100%_50%,#000,rgb(0_0_0/0.45)_40%,rgb(0_0_0/0.12)_75%,transparent)]"
                />
                <CmsLogo
                  image={app.logo}
                  size={app.logoSize}
                  alt={app.name}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-5 bg-surface-warm p-6 sm:p-8">
                <h2 className="text-[1.75rem] leading-tight tracking-[-0.01em] transition-colors group-hover:text-signal">
                  {app.name}
                </h2>
                <p className="max-w-md text-sm text-pretty text-subtle">{app.description}</p>
                <TagChain tags={app.tags} size="sm" uppercase className="pt-1" />
                <span className="mt-auto inline-flex items-center gap-2 pt-4 font-mono text-xs text-signal">
                  {app.domain}
                  <Arrow className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}

export { ApplicationGrid };
