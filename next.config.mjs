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
      // Player photos and club crests. Without this entry these URLs can't be
      // served through next/image at all.
      {
        protocol: "https",
        hostname: "media.api-sports.io",
      },
    ],
  },
  async redirects() {
    return [
      {
        // /private-groups was indexed and linked before the page was renamed.
        // Permanent, so the ranking signals it accumulated follow it across
        // rather than being stranded on a 404.
        source: "/private-groups",
        destination: "/private-clubs",
        permanent: true,
      },
    ];
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
