import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    return [
      // The playground lives inside Models.
      { source: "/playground", destination: "/models#try", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
