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
import { slugToClub } from "./Hooks/Helper_Functions";

// --- Redux Selectors & Actions ---
import { selectSquadLoad } from "./Selectors/squadDataSelectors";
import { selectFixturesLoad } from "./Selectors/fixturesSelectors";

import { fetchFixtures, fetchTeamSquad } from "./Hooks/Fixtures_Hooks";

// --- UI Components ---
import { GlobalContainer } from "./Containers/GlobalContainer";
import { Spinner } from "./Containers/Helpers";
import Header from "./Containers/Header";
import HomePage from "./Containers/HomePage";
import { Box } from "@mui/material";
import SignUpButton from "./Components/Auth/SignUpButton";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./Firebase/Firebase";
import {
  setCurrentGroup,
  updateGroupData,
} from "./redux/Reducers/groupReducer";

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
  userHomeGroup,
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
  if (userHomeGroup && userHomeGroup.groupClubId) {
    return <Navigate to={`/${userHomeGroup.slug}`} replace />;
  }

  // 5. Fallback: Logged in but has no club/group selected yet
  return <GlobalGroupSelect />;
};
const ClubRouteGuard = ({ children }) => {
  const { clubSlug } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userData); //

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const fetchGroupContext = async () => {
      console.log(`[Guard] Initiating lookup for slug: "${clubSlug}"`);
      setLoading(true);

      try {
        // 1. Query Firestore for the group with the matching slug
        const q = query(
          collection(db, "groups"),
          where("slug", "==", clubSlug)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn(
            `[Guard] No group found for slug: "${clubSlug}". Redirecting home.`
          );
          setIsValid(false);
          setLoading(false);
          return;
        }

        const groupDoc = querySnapshot.docs[0];
        const groupData = { ...groupDoc.data(), groupId: groupDoc.id };

        console.log(
          `[Guard] Group Found: ${groupData.groupName} (ID: ${groupDoc.id}, Visibility: ${groupData.visibility})`
        );

        // 2. Visibility & Permission Logic
        if (groupData.visibility === "public") {
          console.log(`[Guard] Access Granted: Public group.`);

          dispatch(
            updateGroupData({ groupId: groupData.groupId, data: groupData })
          );
          dispatch(setCurrentGroup(groupData));
          setIsValid(true);
        } else if (groupData.visibility === "private") {
          // Private groups check if the user is a member
          const isMember = user?.groups?.includes(groupData.groupId);

          if (isMember) {
            console.log(
              `[Guard] Access Granted: Private group member verified.`
            );
            dispatch(
              updateGroupData({ groupId: groupData.groupId, data: groupData })
            ); //
            setIsValid(true);
          } else {
            console.warn(
              `[Guard] Access Denied: User is not a member of private group ${groupData.groupId}.`
            );
            setIsValid(false);
          }
        } else {
          console.error(
            `[Guard] Unknown visibility type: ${groupData.visibility}`
          );
          setIsValid(false);
        }
      } catch (error) {
        console.error("[Guard] Critical Error guarding club route:", error);
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    if (clubSlug) {
      fetchGroupContext();
    }
  }, [clubSlug, dispatch, user]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <Spinner text="Verifying Club Access..." />
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return children;
};
// --- 5. Club Shell ---
const ClubShell = ({ user }) => {
  const { currentYear } = useGlobalData();
  useAppDataLoader(currentYear);
  return (
    <>
      <DynamicListeners user={user} />

      {/* Main Content Area */}
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        <Outlet />

        {/* Strategic Call-to-Action: 
            Only show if user is not logged in.
            Centered at the bottom for easy mobile thumb access.
        */}
        {!user && (
          <Box
            sx={{
              position: "fixed",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none", // Allows clicking through the box itself
            }}
          >
            <Box sx={{ pointerEvents: "auto" }}>
              <SignUpButton />
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
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

              {/* All club routes now handle their own group listener via ClubShell */}
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
