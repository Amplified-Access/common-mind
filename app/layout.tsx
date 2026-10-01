import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { SmoothScroll } from "@/components/common/smooth-scroll";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        geistSans.variable,
        geistMono.variable,
        "font-sans",
      )}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SmoothScroll>
          <AnnouncementBanner
            id="nllb-release-2026-09"
            label="Release"
            message="Swahili-nllb-1.3B: 38.74 BLEU on FLORES-200 at 1.3B parameters"
            linkLabel="Read the model card"
            href="/models/swahili-nllb-1-3b"
          />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
