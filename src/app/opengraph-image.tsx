import { ImageResponse } from "next/og";

/**
 * The site had no OG image at all, so every share of 11votes.com previewed as
 * plain text.
 *
 * Generated rather than authored: there is no asset to keep in sync, and the
 * 871 KB logo PNG would have to be inlined as base64 to be usable here. Colours
 * are the theme's dark surface (#09090B) and primary (#93BFEC).
 */
// Deliberately NOT `runtime = "edge"`. Edge disables static generation for the
// route, which made this image re-render on every crawler request. Node lets
// Next bake it once at build time.
export const alt = "11Votes — Fan Player Ratings, Predictions & Consensus XI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090B",
          // Mirrors the pitch/spotlight wash used across the app.
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(147,191,236,0.22) 0%, #09090B 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 8,
            color: "#93BFEC",
            marginBottom: 24,
          }}
        >
          11VOTES
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 900,
            color: "#FAFAFA",
            letterSpacing: -3,
            lineHeight: 1,
          }}
        >
          OWN YOUR
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 900,
            color: "#B9A3CC",
            letterSpacing: -3,
            lineHeight: 1.1,
          }}
        >
          CLUB&apos;S PULSE
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#A1A1AA",
            marginTop: 32,
          }}
        >
          Predict · Pick the XI · Rate every player
        </div>
      </div>
    ),
    size,
  );
}
