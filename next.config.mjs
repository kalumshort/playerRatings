const nextConfig = {
  turbopack: {
    enabled: false,
  },

  output: "standalone",

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
