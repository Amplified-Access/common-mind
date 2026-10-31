import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { getContent } from "@/lib/content";
import { site } from "@/lib/site";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { SmoothScroll } from "@/components/common/smooth-scroll";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { HideOnStandalone } from "@/components/layout/hide-on-standalone";
import { Toaster } from "@/components/ui/toaster";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext"],
});

// Plex Mono is not a variable font, so its weights are listed.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getContent();
  return {
    // Pages give their canonical URL as a path; Next resolves it against this.
    // Each page sets its own: one set here would be inherited by every page
    // that didn't, pointing them all at the home page.
    metadataBase: new URL(site.url),
    title: {
      // The statement is a sentence; a title has no full stop.
      default: `${site.name} | ${settings.statement.replace(/\.$/, "")}`,
      template: `%s | ${site.name}`,
    },
    description: settings.tagline,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { settings } = await getContent();
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "dark",
        "antialiased",
        sora.variable,
        plexMono.variable,
        "font-sans",
      )}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SmoothScroll>
          {settings.announcement && (
            <AnnouncementBanner announcement={settings.announcement} />
          )}
          <Header />
          <main className="flex-1">{children}</main>
          <HideOnStandalone>
            <Footer />
          </HideOnStandalone>
          <Toaster />
        </SmoothScroll>
      </body>
    </html>
  );
}
