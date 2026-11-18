import type { Metadata } from "next";

import { SignStudio } from "@/components/sign/sign-studio";

// A signing avatar: type or speak English and a 3D signer shows it in a sign
// language: ASL, with KSL and USL as concepts (lib/sign/languages.ts).
// Reached by its address only, while the signs are reviewed.
export const metadata: Metadata = {
  title: "Sign",
  robots: { index: false, follow: false },
};

const SignPage = () => <SignStudio />;

export default SignPage;
