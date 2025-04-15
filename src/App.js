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
import FixturesContainer from "./Containers/FixturesContainer";
import { GlobalContainer } from "./Containers/GlobalContainer";
import Fixture from "./Components/Fixtures/Fixture";
import { useDispatch, useSelector } from "react-redux";
import { fetchFixtures, fetchTeamSquad } from "./Hooks/Fixtures_Hooks";
import Spinner from "./Containers/Helpers";

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
import { clearUserData } from "./redux/Reducers/userDataReducer";
import ProfileContainer from "./Containers/ProfileContainer";
import HomePage from "./Containers/HomePage";
import useGroupData from "./Hooks/useGroupsData";
import { UserDataListener } from "./Firebase/FirebaseListeners";

function App() {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { squadLoaded, squadError } = useSelector(selectSquadLoad);
  const { fixturesLoaded, fixturesError } = useSelector(selectFixturesLoad);

  const { activeGroup, groupDataLoaded } = useGroupData();

  const { error: userDataError, loaded: userDataLoaded } = useSelector(
    (state) => state.userData
  );

  // Listen for changes in authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !userDataLoaded) {
        // Only fetch user data if not already loaded
        console.log("User signed in, fetching user data.");
        dispatch(fetchUserData(user.uid));
      } else if (!user) {
        // If no user is signed in, clear user data
        console.log("User signed out, clearing user data.");
        dispatch(clearUserData());
      }
    });

    // Cleanup the listener when the component unmounts or the effect dependencies change
    return () => unsubscribe();
  }, [dispatch, userDataLoaded]); // Add userDataLoaded as a dependency

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

  if (user) {
    if (!userDataLoaded) {
      return <Spinner />;
    }
    if (!fixturesLoaded || !squadLoaded) {
      return <Spinner />;
    }
  }

  if (squadError || fixturesError || userDataError) {
    return (
      <div>
        Error: Please refresh, If error still exists please contact support.{" "}
      </div>
    );
  }

  return (
    <GlobalContainer>
      <Router>
        {user && <UserDataListener userId={user.uid} />}
        {!isMobile && <Header />}
        {isMobile && <MobileHeader />}
        <div style={{ maxWidth: "1400px", margin: "auto" }}>
          <Routes>
            <Route
              path="/"
              element={user ? <FixturesContainer /> : <HomePage />}
            />
            <Route path="/profile" element={<ProfileContainer />} />
            <Route
              path="/season-stats"
              element={user ? <PlayerStatsContainer /> : <ProfileContainer />}
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
      </Router>

      <div style={{ height: "50px" }}></div>
    </GlobalContainer>
  );
}

export default App;
