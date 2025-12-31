import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "./Components/Theme/ThemeContext";

// --- Hooks, Context & Utils ---
import { useAuth } from "./Providers/AuthContext";
import useGroupData from "./Hooks/useGroupsData";
import useGlobalData from "./Hooks/useGlobalData";
import { GroupListener, UserDataListener } from "./Firebase/FirebaseListeners";
import { slugToClub } from "./Hooks/Helper_Functions";

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
import { Box } from "@mui/material";
import SignUpButton from "./Components/Auth/SignUpButton";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./Firebase/Firebase";

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

// --- 1. Custom Hook: Data Loader (URL Aware & Force Refresh) ---
const useAppDataLoader = (currentYear) => {
  const dispatch = useDispatch();
  const { clubSlug } = useParams();

  useEffect(() => {
    const clubConfig = slugToClub[clubSlug];
    if (clubConfig) {
      const clubId = clubConfig.teamId;
      // We force a fetch whenever the clubSlug changes
      // This ensures fixtures and squad data are fresh for the new club context
      console.log(
        `[DataLoader] Fetching fixtures/squad for Club ID: ${clubId}`
      );
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
      dispatch(fetchFixtures({ clubId: clubId, currentYear }));
    }
  }, [dispatch, clubSlug, currentYear]); // Dependency on clubSlug ensures refresh on group switch
};

// --- 2. Dynamic Listeners Component ---
const DynamicListeners = ({ user }) => {
  const { clubSlug } = useParams();
  const clubConfig = slugToClub[clubSlug];
  const groupIdFromUrl = clubConfig?.teamId ? String(clubConfig.teamId) : null;

  return <>{groupIdFromUrl && <GroupListener groupId={groupIdFromUrl} />}</>;
};

// --- 3. Navigation Sync (Force-Home on Change) ---
const NavigationSync = ({ activeGroup, groupDataLoaded }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (groupDataLoaded && activeGroup?.slug) {
      const currentPath = location.pathname;
      const targetSlug = activeGroup.slug;

      const pathSegments = currentPath.split("/").filter(Boolean);
      const currentSlugInUrl = pathSegments[0];

      // If the URL slug doesn't match the active group, reset to the group's home page
      if (currentSlugInUrl !== targetSlug) {
        console.log(
          `[NavSync] Group switch detected. Resetting to /${targetSlug}`
        );
        navigate(`/${targetSlug}`, { replace: true });
      }
    }
  }, [activeGroup, groupDataLoaded, navigate, location.pathname]);

  return null;
};

// --- 4. Main Layout ---
const MainLayout = () => (
  <>
    <Header />
    <Box sx={{ maxWidth: "1400px", margin: "auto" }}>
      <Suspense fallback={<Spinner text="Loading..." />}>
        <Outlet />
      </Suspense>
    </Box>
    <Box sx={{ height: "50px" }} />
  </>
);

// --- 5. Home Route Controller ---
const HomeRouteController = ({
  user,
  userLoading,
  groupDataLoaded,
  userHomeGroup,
}) => {
  if (userLoading) return <Spinner text="Verifying User..." />;
  if (!user) return <HomePage />;
  if (!groupDataLoaded) return <Spinner text="Loading club preferences..." />;

  // Redirect to active group slug if available
  if (userHomeGroup?.slug)
    return <Navigate to={`/${userHomeGroup.slug}`} replace />;

  return <GlobalGroupSelect />;
};

// --- 6. Club Shell (Context Provider for Loader) ---
const ClubShell = ({ user }) => {
  const { currentYear } = useGlobalData();
  // Loader lives here to access useParams() for the clubSlug
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

// --- 7. Route Guard ---
const ClubRouteGuard = ({ children }) => {
  const { clubSlug } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userData);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

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
          setIsValid(false);
          return;
        }

        const groupDoc = querySnapshot.docs[0];
        const groupData = { ...groupDoc.data(), groupId: groupDoc.id };

        if (
          groupData.visibility === "public" ||
          user?.groups?.includes(groupData.groupId)
        ) {
          dispatch(
            updateGroupData({ groupId: groupData.groupId, data: groupData })
          );
          dispatch(setCurrentGroup(groupData));
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (error) {
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };
    if (clubSlug) fetchGroupContext();
  }, [clubSlug, dispatch, user]);

  if (loading) return <Spinner text="Verifying Club Access..." />;
  return isValid ? children : <Navigate to="/" replace />;
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
          {/* NavigationSync handles group-switch redirects based on activeGroup slug */}
          <NavigationSync
            activeGroup={userHomeGroup}
            groupDataLoaded={groupDataLoaded}
          />

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
            </Route>
          </Routes>
        </Router>
      </GlobalContainer>
    </ThemeProvider>
  );
}

export default App;
