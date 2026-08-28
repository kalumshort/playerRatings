import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import ThemeRegistry from "@/components/client/ThemeRegistry";
import StoreProvider from "@/lib/redux/StoreProvider";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer/Footer";
import { getAuthSession } from "@/lib/firebase/getAuth";
import { cookies } from "next/headers";
import { DrawerProvider } from "@/components/client/Header/DrawerContext";
import AppToaster from "@/components/client/AppToaster";
import NavigationLoader from "@/components/client/Widgets/NavigationLoader";
import Analytics from "@/components/client/Analytics";
import { Suspense } from "react";
import { X_HANDLE } from "@/lib/config/brand";
import { getUserHomeSlugServer } from "@/lib/firebase/firebase-admin-queries";

// Configure the fonts
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-jakarta",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-space-mono",
  display: "swap",
});

/**
 * Site-wide metadata defaults. There were none before, which is why
 * `/[clubSlug]/schedule` and `/profile` rendered with no <title> at all.
 *
 * `metadataBase` is what lets relative OG image paths resolve — without it
 * `opengraph-image.tsx` cannot produce an absolute URL and Next warns at build.
 *
 * The `%s | 11Votes` template means no child route should carry its own
 * "| 11Votes" suffix; the homepage opts out with `title.absolute`.
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://11votes.com"),
  title: {
    default: "11Votes — Fan Player Ratings, Predictions & Consensus XI",
    template: "%s | 11Votes",
  },
  description:
    "Predict the result, build the XI, and rate every player. 11Votes turns your club's votes into one matchday consensus.",
  applicationName: "11Votes",
  openGraph: {
    siteName: "11Votes",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    // Attributes shared links to the brand account on X.
    site: X_HANDLE,
    creator: X_HANDLE,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await getAuthSession();
  // The header logo points straight at the fan's own club. Resolved here so
  // it is correct in the first HTML and so the header never has to subscribe
  // to Redux — see getUserHomeSlugServer.
  const homeSlug = userId ? await getUserHomeSlugServer(userId) : null;

  // Read the cookie on the server
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("themeMode")?.value as
    | "light"
    | "dark"
    | undefined;

  // Default to dark if no cookie exists
  const initialTheme = themeCookie || "dark";
  return (
    // Add the font variables to the HTML class list
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${spaceMono.variable}`}
    >
      <body>
        <AuthProvider>
          <StoreProvider>
            <ThemeRegistry initialTheme={initialTheme}>
              <DrawerProvider>
                <Header homeSlug={homeSlug} />
                <Suspense fallback={null}>
                  <NavigationLoader />
                </Suspense>
                <main
                  style={{
                    maxWidth: "1400px",
                    margin: "auto",
                    minHeight: "100vh",
                  }}
                >
                  {children}
                  <AppToaster />
                </main>
                <Footer />
                {/* Inside ThemeRegistry because the consent banner is MUI, and
                    inside Suspense because it reads useSearchParams — without a
                    boundary that would opt every route out of static rendering. */}
                <Suspense fallback={null}>
                  <Analytics />
                </Suspense>
              </DrawerProvider>
            </ThemeRegistry>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
