import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Move from experimental.turbo to top-level turbopack
  turbopack: {
    // 2. Set the application root directory as an absolute path
    root: path.resolve(__dirname),
  },

  // 3. Keep your other standard configs here
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
