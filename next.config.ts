import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "sports-phinf.pstatic.net" },
      { protocol: "https", hostname: "phinf.pstatic.net" },
      { protocol: "https", hostname: "search.pstatic.net" },
      { protocol: "https", hostname: "ssl.pstatic.net" },
    ],
  },
};

export default nextConfig;
