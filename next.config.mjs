/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["firebase-admin"],
  // This is the most reliable way to disable Turbopack in v16
  webpack: (config) => {
    return config;
  },
  images: {
    remotePatterns: [{ hostname: "firebasestorage.googleapis.com" }],
  },
};

export default nextConfig;
