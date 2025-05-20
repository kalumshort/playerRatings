// import React from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { increment, decrement, incrementByAmount } from "./redux/counterSlice";

// function App() {
//   const count = useSelector((state) => state.counter.value);
//   const dispatch = useDispatch();

//   return (
//     <div style={{ textAlign: "center", marginTop: "50px" }}>
//       <h1>Redux Counter</h1>
//       <h2>{count}</h2>
//       <button onClick={() => dispatch(increment())}>Increment</button>
//       <button onClick={() => dispatch(decrement())}>Decrement</button>
//       <button onClick={() => dispatch(incrementByAmount(5))}>
//         Increment by 5
//       </button>
//     </div>
//   );
// }

// export default App;
import React, { useEffect } from "react";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Header from "./Containers/Header";
import GroupHomePage from "./Containers/GroupHomePage";
import { GlobalContainer } from "./Containers/GlobalContainer";
import Fixture from "./Components/Fixtures/Fixture";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllPlayersSeasonOverallRating,
  fetchFixtures,
  fetchTeamSquad,
} from "./Hooks/Fixtures_Hooks";
import { Spinner } from "./Containers/Helpers";

import PlayerStatsContainer from "./Containers/PlayerStatsContainer";
import { useIsMobile } from "./Hooks/Helper_Functions";
import MobileHeader from "./Containers/MobileHeader";
import PlayerPage from "./Components/PlayerStats/PlayerPage";
import { selectSquadLoad } from "./Selectors/squadDataSelectors";
import { selectFixturesLoad } from "./Selectors/fixturesSelectors";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./Firebase/Firebase";
import { fetchUserData } from "./Firebase/Auth_Functions";
import { useAuth } from "./Providers/AuthContext";

import ProfileContainer from "./Containers/ProfileContainer";
import HomePage from "./Containers/HomePage";
import useGroupData from "./Hooks/useGroupsData";
import { GroupListener, UserDataListener } from "./Firebase/FirebaseListeners";
import ScheduleContainer from "./Containers/ScheduleContainer";
import { selectPlayerRatingsLoad } from "./Selectors/selectors";
import GroupDashboard from "./Containers/GroupDashboard";

function App() {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { user, userLoading } = useAuth();

  const { squadLoaded } = useSelector(selectSquadLoad);
  const { fixturesLoaded } = useSelector(selectFixturesLoad);

  const { activeGroup, groupDataLoaded } = useGroupData();

  const { loaded: userDataLoaded } = useSelector((state) => state.userData);
  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad
  );

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user && !userDataLoaded) {
  //       // Fetch user data if the user is signed in and data is not loaded yet
  //       console.log("User signed in, fetching user data.");
  //       dispatch(fetchUserData(user.uid));
  //     }
  //     // No need to clear user data here when user is signed out
  //   });

  //   // Cleanup the listener when the component unmounts or the effect dependencies change
  //   return () => unsubscribe();
  // }, [dispatch, userDataLoaded]); // Dependencies: dispatch and userDataLoaded

  useEffect(() => {
    if (user) {
      if (!squadLoaded && groupDataLoaded) {
        dispatch(fetchTeamSquad(activeGroup.groupClubId));
      }
    }
  }, [dispatch, squadLoaded, groupDataLoaded, activeGroup, user]);

  useEffect(() => {
    if (user) {
      if (!fixturesLoaded && groupDataLoaded) {
        dispatch(fetchFixtures(activeGroup.groupClubId));
      }
    }
  }, [dispatch, fixturesLoaded, groupDataLoaded, activeGroup, user]);

  useEffect(() => {
    if (user) {
      if (!playerSeasonOverallRatingsLoaded && groupDataLoaded) {
        dispatch(fetchAllPlayersSeasonOverallRating(activeGroup.groupId));
      }
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    activeGroup,
    groupDataLoaded,
    user,
  ]);

  if (userLoading) {
    return <Spinner />;
  }

  // index.js or App.js
  // if ("serviceWorker" in navigator) {
  //   window.addEventListener("load", () => {
  //     navigator.serviceWorker.register("/service-worker.js");
  //   });
  // }

  return (
    <GlobalContainer>
      <Router>
        {user && <UserDataListener userId={user.uid} />}
        {user && activeGroup && <GroupListener groupId={activeGroup.groupId} />}

        {(user && !userDataLoaded) ||
        (user && !fixturesLoaded) ||
        (user && !squadLoaded) ? (
          <div style={{ textAlign: "center" }}>
            <Spinner text={"Loading Data..."} />
          </div>
        ) : (
          <>
            {!isMobile && <Header />}
            {isMobile && <MobileHeader />}
            <div style={{ maxWidth: "1400px", margin: "auto" }}>
              <Routes>
                <Route
                  path="/"
                  element={user ? <GroupHomePage /> : <HomePage />}
                />
                <Route path="/profile" element={<ProfileContainer />} />
                <Route
                  path="/season-stats"
                  element={
                    user ? <PlayerStatsContainer /> : <ProfileContainer />
                  }
                />
                <Route
                  path="/group-dashboard"
                  element={user ? <GroupDashboard /> : <ProfileContainer />}
                />
                <Route
                  path="/schedule"
                  element={user ? <ScheduleContainer /> : <ProfileContainer />}
                />
                <Route
                  path="/fixture/:matchId"
                  element={user ? <Fixture /> : <ProfileContainer />}
                />
                <Route
                  path="/players/:playerId"
                  element={user ? <PlayerPage /> : <ProfileContainer />}
                />
              </Routes>
            </div>
          </>
        )}
      </Router>
      <div style={{ height: "50px" }}></div>
    </GlobalContainer>
  );
}

export default App;
