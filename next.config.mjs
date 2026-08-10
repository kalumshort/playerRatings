/** @type {import('next').NextConfig} */

const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "player-ratings-ef06c";

/**
 * Content-Security-Policy is shipped in Report-Only mode first: MUI/Emotion
 * inject runtime <style> tags and the Google sign-in popup pulls scripts from
 * apis.google.com, so an enforcing policy needs a round of real-traffic reports
 * before it can be trusted. Watch the browser console, then rename the header
 * to "Content-Security-Policy" once it is clean.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Firebase Auth + Google sign-in
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://media.api-sports.io https://firebasestorage.googleapis.com https://*.googleusercontent.com",
  [
    "connect-src 'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net`,
  ].join(" "),
  `frame-src 'self' https://${FIREBASE_PROJECT_ID}.firebaseapp.com https://accounts.google.com`,
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async rewrites() {
    // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is the custom domain (11votes.com), so
    // the Firebase Auth handler must be proxied through to the Firebase host or
    // signInWithPopup breaks.
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
