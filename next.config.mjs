/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is getting confused by its own virtual graph.
  // We will force it to ignore firebase-admin by NOT referencing it
  // in the bundler config at all.
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
