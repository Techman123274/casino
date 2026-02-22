import type { NextConfig } from "next";

// Standalone server and `next start` listen on process.env.PORT (default 3000). Railway sets PORT.
const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.rapidrole.gg",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
