import type { Metadata } from "next";

import { OrbLab } from "./orb-lab";

// Temporary: a bench for tuning the speech orb. Delete once its settings
// are fixed in ParticleOrb's defaults.
export const metadata: Metadata = {
  title: "Orb lab",
  robots: { index: false, follow: false },
};

const OrbLabPage = () => <OrbLab />;

export default OrbLabPage;
