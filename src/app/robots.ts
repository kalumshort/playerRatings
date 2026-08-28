import { MetadataRoute } from "next";

/**
 * This used to live at `src/app/robots.txt` while containing TypeScript source.
 * Next served that file verbatim, so the live robots.txt was a block of code:
 * no valid `User-agent:` line meant every rule below was ignored, and the
 * malformed `Sitemap:` line meant the sitemap was never declared to crawlers.
 *
 * `?season=` variants are deliberately NOT disallowed. They already render
 * `noindex, follow`, and blocking them here would stop crawlers from ever
 * fetching the page to see that directive.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/profile", // user-specific, nothing to index
        "/api/", // session endpoints
        "/join/", // one-time invite codes
      ],
    },
    sitemap: "https://11votes.com/sitemap.xml",
  };
}
