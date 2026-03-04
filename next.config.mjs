/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. This fixes the "workspace root" warning
  turbopack: {
    enabled: false,
  },

  // 2. We remove the 'experimental' and 'webpack' blocks.
  // Turbopack handles server/client isolation automatically
  // via "server-only" and "use client" boundaries.

  serverExternalPackages: ["firebase-admin"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
