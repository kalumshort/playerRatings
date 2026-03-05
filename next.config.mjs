/** @type {import('next').NextConfig} */
const nextConfig = {
  // REQUIRED: This tells Next.js to create a minimal, standalone folder
  // containing only what is needed for production.
  output: "standalone",

  // Your existing image configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },

  // Turbopack usually works fine without manual path resolution.
  // If you don't specifically need this for a custom monorepo setup,
  // you can simplify it to:
  experimental: {
    turbopack: true,
  },
};

export default nextConfig;
