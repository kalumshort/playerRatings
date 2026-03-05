"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useAuth } from "@/context/AuthContext";
import useGroupData from "@/Hooks/useGroupData";
import { selectIsUserLoaded } from "@/lib/redux/selectors/userSelectors";

// Components
import { Spinner } from "@/components/ui/Spinner";
import HomePage from "@/components/client/HomePage";
import ClubSelectionPage from "@/components/client/ClubSelectionPage";

interface RootPageProps {
  initialIsLoggedIn: boolean;
  serverUserData: any;
}

export default function RootPage({
  initialIsLoggedIn,
  serverUserData,
}: RootPageProps) {
  const { user, userLoading } = useAuth();
  const { userHomeGroup, groupDataLoaded, groupDataLoading } = useGroupData();
  const userDataLoaded = useSelector(selectIsUserLoaded);
  const router = useRouter();

  // 1. Instant Redirect Effect
  // If the server data already has a slug, we can actually trigger the router
  // immediately even before useAuth is fully ready.
  useEffect(() => {
    const slug = userHomeGroup?.slug || serverUserData?.userHomeGroup?.slug;

    if (user && slug) {
      router.replace(`/${slug}`);
    }
  }, [user, userHomeGroup, serverUserData, router]);

  // 2. Auth Guard
  // If we know from the server they are logged in, we stay in "Syncing" mode
  // instead of showing "Verifying Session"
  if (userLoading) {
    return initialIsLoggedIn ? (
      <Spinner text="Syncing your football profile..." />
    ) : (
      <Spinner text="Verifying session..." />
    );
  }

  // 3. Unauthenticated Guard
  if (!user && !initialIsLoggedIn) {
    return <HomePage />;
  }

  // 4. SMART DATA GUARD
  // We check if we have data from EITHER the Server OR the Redux Store.
  // If serverUserData exists and HAS NO SLUG, we skip the spinner and show the selection page.
  const hasNoSlugOnServer =
    serverUserData && !serverUserData.userHomeGroup?.slug;
  const isSyncingClientData =
    groupDataLoading || !groupDataLoaded || !userDataLoaded;

  if (isSyncingClientData && !hasNoSlugOnServer) {
    return <Spinner text="Syncing your club preferences..." />;
  }

  // 5. Final UI: Club Selection
  // Show this if:
  // A) The server confirmed no slug.
  // B) The client listener finished and confirmed no slug.
  const finalSlug = userHomeGroup?.slug || serverUserData?.userHomeGroup?.slug;

  if (!finalSlug) {
    return <ClubSelectionPage />;
  }

  // 6. Final Fallback
  return <Spinner text="Redirecting to your hub..." />;
}
