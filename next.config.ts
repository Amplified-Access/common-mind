import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // Datasets now live under Research; the playground lives inside Models.
      { source: "/datasets", destination: "/research#datasets", permanent: true },
      { source: "/playground", destination: "/models#try", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
