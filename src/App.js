import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
  useParams,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "./Components/Theme/ThemeContext";

// --- Hooks, Context & Utils ---
import { useAuth } from "./Providers/AuthContext";
import useGroupData from "./Hooks/useGroupsData";

import { useDataManager } from "./Hooks/useDataManager"; // ✅ NEW IMPORT
import { GroupListener, UserDataListener } from "./Firebase/FirebaseListeners";

// --- Redux Actions ---
import {
  setActiveGroup,
  groupDataSuccess,
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
import { useGroupAutoRedirect } from "./Hooks/useGroupAutoRedirect";

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

// --- 1. Dynamic Listeners (Unchanged) ---
const DynamicListeners = ({ user }) => {
  const { activeGroup } = useGroupData(); // ✅ Updated to use 'activeGroup' from new hook

  return (
    <>
      {activeGroup?.groupId && <GroupListener groupId={activeGroup.groupId} />}
    </>
  );
};

// --- 2. Main Layout ---
const MainLayout = () => {
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

// --- 3. Home Route Controller ---
const HomeRouteController = ({
  user,
  userLoading,
  groupDataLoaded,
  userHomeGroup,
}) => {
  if (userLoading) return <Spinner text="Verifying User..." />;
  if (!user) return <HomePage />;

  // Wait for initial group sync
  if (!groupDataLoaded) return <Spinner text="Loading club preferences..." />;

  // Redirect to user's home group slug if available
  if (userHomeGroup?.slug) {
    return <Navigate to={`/${userHomeGroup.slug}`} replace />;
  }

  return <GlobalGroupSelect />;
};

// --- 4. Club Shell (Optimized) ---
const ClubShell = ({ user }) => {
  // ✅ REPLACED: useAppDataLoader -> useDataManager
  // This hook now smartly fetches fixtures/squads only if missing from Redux
  useDataManager();

  // 2. Initialize Auto Redirector ✅
  // This sits here quietly watching for changes in your profile
  useGroupAutoRedirect();

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

// --- 5. Route Guard (HEAVILY OPTIMIZED) ---
const ClubRouteGuard = ({ children }) => {
  const { clubSlug } = useParams();
  const dispatch = useDispatch();
  const { allGroups = {} } = useGroupData(); // ← default empty object

  const [accessStatus, setAccessStatus] = useState("PENDING");

  useEffect(() => {
    // Skip if we don't have the slug yet
    if (!clubSlug) {
      setAccessStatus("DENIED");
      return;
    }

    const fetchGroup = async () => {
      try {
        // 1. Try to find in already loaded user groups
        const userGroups = allGroups ? Object.values(allGroups) : [];
        const matchingGroup = userGroups.find(
          (group) => group?.slug === clubSlug
        );

        if (matchingGroup?.groupId) {
          dispatch(
            groupDataSuccess({ [matchingGroup.groupId]: matchingGroup })
          );
          dispatch(setActiveGroup(matchingGroup.groupId));
          setAccessStatus("GRANTED");
          return;
        }

        // 2. Not in user's groups → try public lookup
        const publicQuery = query(
          collection(db, "groups"),
          where("slug", "==", clubSlug),
          where("visibility", "==", "public")
        );

        const querySnapshot = await getDocs(publicQuery);

        if (!querySnapshot.empty) {
          const groupDoc = querySnapshot.docs[0];
          const groupData = groupDoc.data();
          groupData.groupId = groupDoc.id;

          dispatch(groupDataSuccess({ [groupData.groupId]: groupData }));
          dispatch(setActiveGroup(groupData.groupId));
          setAccessStatus("GRANTED");
        } else {
          setAccessStatus("DENIED");
        }
      } catch (error) {
        console.error("Guard Error:", error);
        setAccessStatus("DENIED");
      }
    };

    fetchGroup();
  }, [clubSlug, allGroups, dispatch]);

  if (accessStatus === "PENDING") {
    return <Spinner text="Loading Club..." />;
  }

  if (accessStatus === "DENIED") {
    return (
      <Box sx={{ textAlign: "center", mt: 10, p: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Access Restricted
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
  const { userHomeGroup, groupDataLoaded, activeGroup } = useGroupData(); // Updated destructuring

  return (
    <ThemeProvider accentColor={activeGroup?.accentColor || "#7FD880"}>
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
                <Route path="dashboard" element={<GroupDashboard />} />
              </Route>

              {/* Other Routes */}
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
