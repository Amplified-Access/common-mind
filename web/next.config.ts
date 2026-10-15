import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Logos and other images edited in the Studio come from Sanity's CDN.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  redirects() {
    return [
      // The playground lives inside Models.
      { source: "/playground", destination: "/models#try", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
