import React, { Suspense, lazy, useEffect } from "react";
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
import { idToClub, slugToClub } from "./Hooks/Helper_Functions";

// --- Redux Selectors & Actions ---
import { selectSquadLoad } from "./Selectors/squadDataSelectors";
import { selectFixturesLoad } from "./Selectors/fixturesSelectors";
import { selectPlayerRatingsLoad } from "./Selectors/selectors";
import { fetchFixtures, fetchTeamSquad } from "./Hooks/Fixtures_Hooks";

// --- UI Components ---
import { GlobalContainer } from "./Containers/GlobalContainer";
import { Spinner } from "./Containers/Helpers";
import Header from "./Containers/Header";
import HomePage from "./Containers/HomePage";

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

// --- 1. Custom Hook: Data Loader (URL Aware) ---
const useAppDataLoader = (currentYear) => {
  const dispatch = useDispatch();
  const { clubSlug } = useParams();

  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  useEffect(() => {
    const clubConfig = slugToClub[clubSlug];
    if (clubConfig) {
      const clubId = clubConfig.teamId;
      if (!squadLoaded)
        dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
      if (!fixturesLoaded)
        dispatch(fetchFixtures({ clubId: clubId, currentYear }));
    }
  }, [dispatch, clubSlug, currentYear, squadLoaded, fixturesLoaded]);
};

// --- 2. Dynamic Listeners Component ---
// This needs to be inside the Router/Routes to use useParams()
const DynamicListeners = ({ user }) => {
  const { clubSlug } = useParams();
  const clubConfig = slugToClub[clubSlug];

  // Use the teamId from the slug mapping as the groupId for the listener
  const groupIdFromUrl = clubConfig?.teamId ? String(clubConfig.teamId) : null;

  return (
    <>
      {/* Global User Data Listener */}

      {/* Club-specific Listener derived from URL Slug */}
      {groupIdFromUrl && <GroupListener groupId={groupIdFromUrl} />}
    </>
  );
};

// --- 3. Main Layout ---
const MainLayout = () => {
  return (
    <>
      <Header />
      <div style={{ maxWidth: "1400px", margin: "auto" }}>
        <Suspense
          fallback={
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <Spinner text="Loading..." />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
      <div style={{ height: "50px" }}></div>
    </>
  );
};

// --- 4. Home Route Controller ---
// --- 3. Home Route Controller (The Logic Engine) ---
const HomeRouteController = ({
  user,
  userLoading,
  groupDataLoaded,
  activeGroup,
}) => {
  // 1. Initial Auth Check: Always the first priority
  if (userLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner text="Verifying User..." />
      </div>
    );
  }

  // 2. Not Logged In -> Immediately show the public HomePage (No slug needed)
  if (!user) {
    return <HomePage />;
  }

  // 3. Logged In -> Now we check for their club data
  // If data is still fetching, show a spinner to prevent "activeGroup" being null falsely
  if (!groupDataLoaded) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner text="Loading your club preferences..." />
      </div>
    );
  }

  // 4. Check for Active Group
  if (activeGroup && activeGroup.groupClubId) {
    // Map the groupClubId (e.g., 33) to its slug (e.g., man-united)
    const clubInfo = idToClub[activeGroup.groupClubId];

    if (clubInfo?.slug) {
      // SUCCESS: Redirect to the specific club slug
      return <Navigate to={`/${clubInfo.slug}`} replace />;
    }
  }

  // 5. Fallback: Logged in but has no club/group selected yet
  return <GlobalGroupSelect />;
};

// --- 5. Club Shell ---
const ClubShell = ({ user }) => {
  const { currentYear } = useGlobalData();
  useAppDataLoader(currentYear);
  return (
    <>
      <DynamicListeners user={user} />
      <Outlet />
    </>
  );
};

function App() {
  const { user, userLoading } = useAuth();
  const { activeGroup, groupDataLoaded } = useGroupData();

  const { loaded: userDataLoaded } = useSelector((state) => state.userData);
  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  const isGroupDataReady = !!(userDataLoaded && fixturesLoaded && squadLoaded);

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
                    activeGroup={activeGroup}
                  />
                }
              />

              {/* All club routes now handle their own group listener via ClubShell */}
              <Route path="/:clubSlug" element={<ClubShell user={user} />}>
                <Route index element={<GroupHomePage />} />
                <Route path="schedule" element={<SchedulePage />} />
                <Route path="fixture/:matchId" element={<Fixture />} />
                <Route path="players/:playerId" element={<PlayerPage />} />

                {user && (
                  <Route
                    element={
                      isGroupDataReady ? (
                        <Outlet />
                      ) : (
                        <Spinner text="Loading Data..." />
                      )
                    }
                  >
                    <Route
                      path="season-stats"
                      element={<PlayerStatsContainer />}
                    />
                    <Route path="dashboard" element={<GroupDashboard />} />
                  </Route>
                )}
              </Route>

              {user && (
                <>
                  {/* Keep UserDataListener active for non-club pages */}
                  <Route
                    path="/profile"
                    element={
                      <>
                        <UserDataListener userId={user.uid} />
                        <ProfileContainer />
                      </>
                    }
                  />
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
