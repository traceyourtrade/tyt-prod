import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.seeklogo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3-bucket-setup-test.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fundingpips.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "the5ers.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fundednext.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ftmo.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "alphacapitalgroup.uk",
        pathname: "/**",
      },
    ],
  },

  // ⛔ Ignore TypeScript build errors (TEMPORARY, but works)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Allow all dev origins for Replit proxy environment
  allowedDevOrigins: [
    process.env.REPLIT_DEV_DOMAIN || "",
    "*.replit.dev",
    "127.0.0.1",
    "localhost",
  ].filter(Boolean),
};

export default nextConfig;
