/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: ".",
  },
  // This explicitly prevents Turbopack from creating hashed modules
  // for the Firebase Admin SDK.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
