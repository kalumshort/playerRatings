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
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://player-ratings-ef06c.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
