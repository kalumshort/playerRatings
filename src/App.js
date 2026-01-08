import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "./Components/Theme/ThemeContext";

// --- Hooks, Context & Utils ---
import { useAuth } from "./Providers/AuthContext";
import useGroupData from "./Hooks/useGroupsData";
import useGlobalData from "./Hooks/useGlobalData";
import { GroupListener, UserDataListener } from "./Firebase/FirebaseListeners";

// --- Redux Selectors & Actions ---
import { selectSquadLoad } from "./Selectors/squadDataSelectors";
import { selectFixturesLoad } from "./Selectors/fixturesSelectors";
import { fetchFixtures, fetchTeamSquad } from "./Hooks/Fixtures_Hooks";
import {
  setCurrentGroup,
  updateGroupData,
} from "./redux/Reducers/groupReducer";

// --- UI Components ---
import { GlobalContainer } from "./Containers/GlobalContainer";
import { Spinner } from "./Containers/Helpers";
import Header from "./Containers/Header";
import HomePage from "./Containers/HomePage";
import { Box, Typography, Button } from "@mui/material";
import SignUpButton from "./Components/Auth/SignUpButton";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./Firebase/Firebase";
import Footer from "./Containers/Footer/Footer";
import ContactForm from "./Containers/Footer/ContactForm";
import PrivacyPolicy from "./Containers/Footer/PrivacyPolicy";
import TermsOfService from "./Containers/Footer/TermsOfService";
import useUserData from "./Hooks/useUserData";

// --- Lazy Load Pages ---
const GroupHomePage = lazy(() => import("./Containers/GroupHomePage"));
const GlobalGroupSelect = lazy(() => import("./Containers/GlobalGroupSelect"));
const ProfileContainer = lazy(() => import("./Containers/ProfileContainer"));
const PlayerStatsContainer = lazy(() =>
  import("./Containers/PlayerStatsContainer")
);
const GroupDashboard = lazy(() => import("./Containers/GroupDashboard"));
const GroupPublicPage = lazy(() => import("./Containers/GroupPublicPage"));
const SchedulePage = lazy(() => import("./Containers/SchedulePage"));
const Fixture = lazy(() => import("./Components/Fixtures/Fixture"));
const PlayerPage = lazy(() => import("./Components/PlayerStats/PlayerPage"));

// --- 1. Custom Hook: Data Loader (OPTIMIZED) ---
const useAppDataLoader = (currentYear) => {
  const dispatch = useDispatch();
  const { currentGroup } = useGroupData();

  // Optimized: Get loading states to prevent double-fetching
  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  useEffect(() => {
    if (currentGroup) {
      const clubId = currentGroup.groupClubId;
      console.log(
        `[DataLoader] 🔍 Check Triggered for Club ID: ${clubId} | Year: ${currentYear}`
      );

      // Check Squad
      if (!squadLoaded) {
        console.log(`[DataLoader] 🟢 Fetching Squad...`);
        dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
      } else {
        console.log(`[DataLoader] 🟡 Squad already loaded. Skipping.`);
      }

      // Check Fixtures
      if (!fixturesLoaded) {
        console.log(`[DataLoader] 🟢 Fetching Fixtures...`);
        dispatch(fetchFixtures({ clubId: clubId, currentYear }));
      } else {
        console.log(`[DataLoader] 🟡 Fixtures already loaded. Skipping.`);
      }
    } else {
      console.log(`[DataLoader] ⚪ Skipped. No currentGroup available.`);
    }
  }, [dispatch, currentGroup, currentYear, squadLoaded, fixturesLoaded]);
};

// --- 2. Dynamic Listeners Component ---
const DynamicListeners = ({ user }) => {
  const { currentGroup } = useGroupData();

  useEffect(() => {
    console.log(
      `[DynamicListeners] Mounted. Listening for Group: ${
        currentGroup?.groupClubId || "None"
      }`
    );
  }, [currentGroup]);

  return (
    <>
      {currentGroup.groupClubId && (
        <GroupListener groupId={currentGroup.groupClubId} />
      )}
    </>
  );
};

// --- 3. Main Layout ---
const MainLayout = () => {
  // console.log("[MainLayout] Rendering Layout Wrapper");
  return (
    <>
      <Header />
      <Box sx={{ maxWidth: "1400px", margin: "auto" }}>
        <Suspense fallback={<Spinner text="Loading..." />}>
          <Outlet />
        </Suspense>
      </Box>
      <Footer />
    </>
  );
};

// --- 4. Home Route Controller ---
const HomeRouteController = ({
  user,
  userLoading,
  groupDataLoaded,
  userHomeGroup,
}) => {
  console.log("[HomeRouteController] State Check:", {
    userExists: !!user,
    userLoading,
    groupDataLoaded,
    homeGroupSlug: userHomeGroup?.slug,
  });

  if (userLoading) {
    return <Spinner text="Verifying User..." />;
  }

  if (!user) {
    console.log("[HomeRouteController] 🔴 No User. Showing Public Home Page.");
    return <HomePage />;
  }

  if (!groupDataLoaded) {
    console.log(
      "[HomeRouteController] ⏳ Logged in, but waiting for Group Data..."
    );
    return <Spinner text="Loading club preferences..." />;
  }

  // If we have a home group, send them there.
  if (userHomeGroup?.slug) {
    console.log(
      `[HomeRouteController] 🟢 Redirecting to Home Group: /${userHomeGroup.slug}`
    );
    return <Navigate to={`/${userHomeGroup.slug}`} replace />;
  }

  console.log(
    "[HomeRouteController] 🟡 User has no Home Group. Showing Global Selector."
  );
  return <GlobalGroupSelect />;
};

// --- 5. Club Shell ---
const ClubShell = ({ user }) => {
  const { currentYear } = useGlobalData();

  console.log("[ClubShell] Rendering Shell. Initializing Data Loader...");
  useAppDataLoader(currentYear);

  return (
    <>
      <DynamicListeners user={user} />
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        <Outlet />
        {!user && (
          <Box
            sx={{
              position: "fixed",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
            }}
          >
            <SignUpButton />
          </Box>
        )}
      </Box>
    </>
  );
};

// --- 6. Route Guard (OPTIMIZED) ---
const ClubRouteGuard = ({ children }) => {
  const { clubSlug } = useParams();
  const dispatch = useDispatch();
  const { userData } = useUserData();
  const { currentGroup } = useGroupData(); // Hook to check if already loaded

  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState("PENDING"); // PENDING, GRANTED, DENIED

  useEffect(() => {
    // 🛑 OPTIMIZATION: If we already have the correct group loaded, stop here.
    if (currentGroup?.slug === clubSlug && accessStatus === "GRANTED") {
      console.log(
        "[ClubRouteGuard] 🛑 Group already loaded & access previously granted. Skipping re-check."
      );
      setLoading(false);
      return;
    }

    const fetchGroupContext = async () => {
      console.group(`[ClubRouteGuard] Checking Access for slug: "${clubSlug}"`);
      setLoading(true);
      try {
        const q = query(
          collection(db, "groups"),
          where("slug", "==", clubSlug)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error("❌ Group not found in Firestore.");
          setAccessStatus("DENIED");
          console.groupEnd();
          setLoading(false);
          return;
        }

        const groupDoc = querySnapshot.docs[0];
        // Ensure groupId is a string for comparison
        const groupData = { ...groupDoc.data(), groupId: String(groupDoc.id) };
        console.log("📄 Group Data Found:", {
          name: groupData.name,
          id: groupData.groupId,
          visibility: groupData.visibility,
        });

        // --- STRICTER PERMISSION CHECK ---
        const isPublic = groupData.visibility === "public";

        // Ensure user.groups is an array and compare Strings
        const userGroups =
          userData?.groups && Array.isArray(userData.groups)
            ? userData.groups.map(String)
            : [];
        const targetGroupId = String(groupData.groupId);

        const hasUserAccess = userGroups.includes(targetGroupId);

        console.log("🔐 Permission Check Details:", {
          isPublic,
          userGroups,
          targetGroupId,
          hasUserAccess,
        });

        if (isPublic || hasUserAccess) {
          console.log("✅ Access GRANTED. Dispatching group data...");
          dispatch(
            updateGroupData({ groupId: groupData.groupId, data: groupData })
          );
          dispatch(setCurrentGroup(groupData));
          setAccessStatus("GRANTED");
        } else {
          console.warn("⛔ Access DENIED. User does not have permission.");
          setAccessStatus("DENIED");
        }
      } catch (error) {
        console.error("🔥 Error in Guard:", error);
        setAccessStatus("DENIED");
      } finally {
        setLoading(false);
        console.groupEnd();
      }
    };

    // If we haven't loaded the group yet, OR if the slug changed, run the logic
    if (currentGroup?.slug !== clubSlug) {
      fetchGroupContext();
    } else {
      // If slugs match but we just mounted, we can just say "Granted" and stop loading
      // (This handles the case where Redux persists but Component remounts)
      setAccessStatus("GRANTED");
      setLoading(false);
    }
  }, [clubSlug, dispatch, userData, currentGroup?.slug, accessStatus]);

  if (loading) {
    // console.log("[ClubRouteGuard] ⏳ UI State: Loading Spinner");
    return <Spinner text="Verifying Club Access..." />;
  }

  // STOP THE BOUNCE: If denied, show a message instead of redirecting to "/"
  if (accessStatus === "DENIED") {
    console.log("[ClubRouteGuard] ⛔ UI State: Access Denied Screen");
    return (
      <Box sx={{ textAlign: "center", mt: 10, p: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Access Restricted
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          You do not have permission to view this group, or it does not exist.
        </Typography>
        <Button variant="outlined" href="/">
          Return to Home
        </Button>
      </Box>
    );
  }

  // console.log("[ClubRouteGuard] ✅ UI State: Rendering Children");
  return children;
};

function App() {
  const { user, userLoading } = useAuth();
  const { userHomeGroup, groupDataLoaded, currentGroup } = useGroupData();
  const { loaded: userDataLoaded } = useSelector((state) => state.userData);
  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  const isGroupDataReady = !!(userDataLoaded && fixturesLoaded && squadLoaded);

  // Log top-level app state changes
  useEffect(() => {
    console.log("[App] 🔄 Global State Update:", {
      userUid: user?.uid,
      userLoading,
      currentGroupSlug: currentGroup?.slug,
      isGroupDataReady,
    });
  }, [user, userLoading, currentGroup, isGroupDataReady]);

  return (
    <ThemeProvider accentColor={currentGroup?.accentColor || "#7FD880"}>
      <GlobalContainer>
        {user && <UserDataListener userId={user.uid} />}
        <Router>
          <Routes>
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={
                  <HomeRouteController
                    user={user}
                    userLoading={userLoading}
                    groupDataLoaded={groupDataLoaded}
                    userHomeGroup={userHomeGroup}
                  />
                }
              />

              <Route
                path="/:clubSlug"
                element={
                  <ClubRouteGuard>
                    <ClubShell user={user} />
                  </ClubRouteGuard>
                }
              >
                <Route index element={<GroupHomePage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="fixture/:matchId" element={<Fixture />} />
                <Route path="players/:playerId" element={<PlayerPage />} />
                <Route path="season-stats" element={<PlayerStatsContainer />} />
                <Route
                  path="dashboard"
                  element={
                    user && isGroupDataReady ? (
                      <GroupDashboard />
                    ) : (
                      <Spinner text="Loading Dashboard Data..." />
                    )
                  }
                />
              </Route>

              {user && (
                <>
                  <Route path="/profile" element={<ProfileContainer />} />
                  <Route
                    path="/groups/:groupId"
                    element={<GroupPublicPage />}
                  />
                </>
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="contact" element={<ContactForm />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
            </Route>
          </Routes>
        </Router>
      </GlobalContainer>
    </ThemeProvider>
  );
}

export default App;
