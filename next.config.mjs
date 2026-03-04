/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is now native in Next.js 16+.
  // It will automatically handle server-side vs client-side code
  // and tree-shake the Admin SDK out of the browser bundle for you.
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
