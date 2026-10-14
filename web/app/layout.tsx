import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { announcement, site } from "@/lib/site";
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

export const metadata: Metadata = {
  title: {
    default: `${site.name} · ${site.statement}`,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          <AnnouncementBanner {...announcement} />
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
