import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Logo lab",
  robots: { index: false, follow: false },
};

// A bare screen for trying out the logo: no header or footer, just the mark
// in the middle of the viewport.
const LogoLabPage = () => (
  <main className="flex min-h-dvh items-center justify-center bg-background p-8">
    <Image
      src="/logo-white.svg"
      alt="CommonMind"
      width={225}
      height={37}
      priority
      className="h-16 w-auto"
    />
  </main>
);

export default LogoLabPage;
