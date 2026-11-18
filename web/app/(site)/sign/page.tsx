import type { Metadata } from "next";

import { SignStudio } from "@/components/sign/sign-studio";

// A signing avatar: type or speak English and a 3D signer shows it in a sign
// language (ASL for now; lib/sign/languages.ts lists them).
// Reached by its address only, while the signs are reviewed.
export const metadata: Metadata = {
  title: "Sign",
  robots: { index: false, follow: false },
};

const SignPage = () => <SignStudio />;

export default SignPage;
