import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThemeProvider } from "./Components/Theme/ThemeContext";

// --- Hooks & Context ---
import { useAuth } from "./Providers/AuthContext";

import useGroupData from "./Hooks/useGroupsData";
import useGlobalData from "./Hooks/useGlobalData";
import { GroupListener, UserDataListener } from "./Firebase/FirebaseListeners";

// --- Redux Selectors & Actions ---
import { selectSquadLoad } from "./Selectors/squadDataSelectors";
import { selectFixturesLoad } from "./Selectors/fixturesSelectors";
import { selectPlayerRatingsLoad } from "./Selectors/selectors";
import {
  fetchAllPlayersSeasonOverallRating,
  fetchFixtures,
  fetchTeamSquad,
} from "./Hooks/Fixtures_Hooks";

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

// --- 1. Custom Hook: Data Loader ---
const useAppDataLoader = (user, activeGroup, currentYear) => {
  const dispatch = useDispatch();
  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);
  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  useEffect(() => {
    if (user && activeGroup) {
      if (!squadLoaded)
        dispatch(
          fetchTeamSquad({ squadId: activeGroup.groupClubId, currentYear })
        );
      if (!fixturesLoaded)
        dispatch(
          fetchFixtures({ clubId: activeGroup.groupClubId, currentYear })
        );
      if (!playerSeasonOverallRatingsLoaded) {
        dispatch(
          fetchAllPlayersSeasonOverallRating({
            groupId: activeGroup.groupId,
            currentYear,
          })
        );
      }
    }
  }, [
    dispatch,
    user,
    activeGroup,
    currentYear,
    squadLoaded,
    fixturesLoaded,
    playerSeasonOverallRatingsLoaded,
  ]);
};

// --- 2. Main Layout (Header Always Visible) ---
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

// --- 3. Home Route Controller (UPDATED) ---
const HomeRouteController = ({
  user,
  userLoading,
  groupDataLoaded,
  activeGroup,
}) => {
  // 1. Wait for Auth Check
  if (userLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner text="Verifying User..." />
      </div>
    );
  }

  // 2. Not Logged In -> Show Home Page
  if (!user) {
    return <HomePage />;
  }

  // 3. Logged In BUT Group Data still loading? -> Wait.
  // This fixes the issue where activeGroup is false simply because it hasn't loaded yet.
  if (!groupDataLoaded) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner text="Loading Group Info..." />
      </div>
    );
  }

  // 4. Everything Loaded -> Now we trust 'activeGroup'
  return activeGroup ? <GroupHomePage /> : <GlobalGroupSelect />;
};

// --- 4. Group Data Guard ---
const GroupRequiredRoute = ({ isReady, children }) => {
  if (!isReady) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner text="Loading Group Data..." />
      </div>
    );
  }
  return children ? children : <Outlet />;
};

function App() {
  const { user, userLoading } = useAuth();
  const { activeGroup, groupDataLoaded } = useGroupData();
  const { currentYear } = useGlobalData();

  // Redux Data
  const { loaded: userDataLoaded } = useSelector((state) => state.userData);
  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  useAppDataLoader(user, activeGroup, currentYear);

  const isGroupDataReady = !!(
    activeGroup &&
    userDataLoaded &&
    fixturesLoaded &&
    squadLoaded
  );

  return (
    <ThemeProvider accentColor={activeGroup?.accentColor || "#7FD880"}>
      <GlobalContainer>
        <Router>
          {/* Background Listeners */}
          {user && <UserDataListener userId={user.uid} />}
          {user && activeGroup && (
            <GroupListener groupId={activeGroup.groupId} />
          )}

          <Routes>
            <Route element={<MainLayout />}>
              {/* --- ROOT PATH --- */}
              <Route
                path="/"
                element={
                  <HomeRouteController
                    user={user}
                    userLoading={userLoading}
                    groupDataLoaded={groupDataLoaded} // Pass this prop
                    activeGroup={activeGroup}
                  />
                }
              />

              {/* --- AUTHENTICATED ROUTES --- */}
              {user && (
                <>
                  <Route path="/profile" element={<ProfileContainer />} />
                  <Route
                    path="/groups/:groupId"
                    element={<GroupPublicPage />}
                  />

                  {/* Deep Links (Require Full Data) */}
                  <Route
                    element={<GroupRequiredRoute isReady={isGroupDataReady} />}
                  >
                    <Route
                      path="/season-stats"
                      element={<PlayerStatsContainer />}
                    />
                    <Route
                      path="/group-dashboard"
                      element={<GroupDashboard />}
                    />
                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/fixture/:matchId" element={<Fixture />} />
                    <Route path="/players/:playerId" element={<PlayerPage />} />
                  </Route>
                </>
              )}

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </GlobalContainer>
    </ThemeProvider>
  );
}

export default App;
