import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom"; // Removed useNavigate, useLocation
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
import { Box, Typography, Button } from "@mui/material"; // Added Typography, Button
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

// --- 1. Custom Hook: Data Loader ---
const useAppDataLoader = (currentYear) => {
  const dispatch = useDispatch();
  const { currentGroup } = useGroupData();

  useEffect(() => {
    if (currentGroup) {
      const clubId = currentGroup.groupClubId;
      console.log(
        `[DataLoader] Fetching fixtures/squad for Club ID: ${clubId}`
      );
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
      dispatch(fetchFixtures({ clubId: clubId, currentYear }));
    }
  }, [dispatch, currentGroup, currentYear]);
};

// --- 2. Dynamic Listeners Component ---
const DynamicListeners = ({ user }) => {
  const { currentGroup } = useGroupData();

  return (
    <>
      {currentGroup.groupClubId && (
        <GroupListener groupId={currentGroup.groupClubId} />
      )}
    </>
  );
};

// --- REMOVED NavigationSync ---
// It creates circular logic with the RouteGuard. Rely on standard Routes.

// --- 3. Main Layout ---
const MainLayout = () => (
  <>
    <Header />
    <Box sx={{ maxWidth: "1400px", margin: "auto" }}>
      <Suspense fallback={<Spinner text="Loading..." />}>
        <Outlet />
      </Suspense>
    </Box>
    {/* <BackfillButton /> */}
    <Footer />
  </>
);

// --- 4. Home Route Controller ---
const HomeRouteController = ({
  user,
  userLoading,
  groupDataLoaded,
  userHomeGroup,
}) => {
  if (userLoading) return <Spinner text="Verifying User..." />;
  if (!user) return <HomePage />;
  if (!groupDataLoaded) return <Spinner text="Loading club preferences..." />;

  // If we have a home group, send them there.
  // Note: If ClubRouteGuard denies access, it will handle the UI,
  // so we won't bounce back here.
  if (userHomeGroup?.slug) {
    console.log("[HomeRouteController] Redirecting to:", userHomeGroup.slug);
    return <Navigate to={`/${userHomeGroup.slug}`} replace />;
  }

  return <GlobalGroupSelect />;
};

// --- 5. Club Shell ---
const ClubShell = ({ user }) => {
  const { currentYear } = useGlobalData();
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

// --- 6. Route Guard (THE FIX) ---
const ClubRouteGuard = ({ children }) => {
  const { clubSlug } = useParams();
  const dispatch = useDispatch();
  const { userData } = useUserData();
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState("PENDING"); // PENDING, GRANTED, DENIED

  useEffect(() => {
    const fetchGroupContext = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "groups"),
          where("slug", "==", clubSlug)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error("Group not found for slug:", clubSlug);
          setAccessStatus("DENIED");
          setLoading(false);
          return;
        }

        const groupDoc = querySnapshot.docs[0];
        // Ensure groupId is a string for comparison
        const groupData = { ...groupDoc.data(), groupId: String(groupDoc.id) };

        // --- STRICTER PERMISSION CHECK ---
        const isPublic = groupData.visibility === "public";

        // Ensure user.groups is an array and compare Strings
        const hasUserAccess =
          userData?.groups && Array.isArray(userData.groups)
            ? userData.groups.map(String).includes(String(groupData.groupId))
            : false;

        if (isPublic || hasUserAccess) {
          console.log("[ClubRouteGuard] Access GRANTED");
          dispatch(
            updateGroupData({ groupId: groupData.groupId, data: groupData })
          );
          dispatch(setCurrentGroup(groupData));
          setAccessStatus("GRANTED");
        } else {
          console.warn(
            "[ClubRouteGuard] Access DENIED. User groups:",
            userData?.groups,
            "Target Group:",
            groupData.groupId
          );
          setAccessStatus("DENIED");
        }
      } catch (error) {
        console.error("Error in Guard:", error);
        setAccessStatus("DENIED");
      } finally {
        setLoading(false);
      }
    };
    if (clubSlug) fetchGroupContext();
  }, [clubSlug, dispatch, userData]);

  if (loading) return <Spinner text="Verifying Club Access..." />;

  // STOP THE BOUNCE: If denied, show a message instead of redirecting to "/"
  if (accessStatus === "DENIED") {
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

  return children;
};

function App() {
  const { user, userLoading } = useAuth();
  const { userHomeGroup, groupDataLoaded, currentGroup } = useGroupData();
  const { loaded: userDataLoaded } = useSelector((state) => state.userData);
  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  const isGroupDataReady = !!(userDataLoaded && fixturesLoaded && squadLoaded);

  return (
    <ThemeProvider accentColor={currentGroup?.accentColor || "#7FD880"}>
      <GlobalContainer>
        {user && <UserDataListener userId={user.uid} />}
        <Router>
          {/* REMOVED NavigationSync */}

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
                      <Spinner text="Loading..." />
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
