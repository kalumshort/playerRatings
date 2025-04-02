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

function App() {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const { squadLoaded, squadError } = useSelector(selectSquadLoad);
  const { fixturesLoaded, fixturesError } = useSelector(selectFixturesLoad);

  useEffect(() => {
    if (!squadLoaded) {
      dispatch(fetchTeamSquad("33"));
    }
  }, [dispatch, squadLoaded]);
  useEffect(() => {
    if (!fixturesLoaded) {
      dispatch(fetchFixtures());
    }
  }, [dispatch, fixturesLoaded]);

  if (!fixturesLoaded || !squadLoaded) {
    return <Spinner />;
  }
  if (squadError || fixturesError) {
    return (
      <div>
        Error: Please refresh, If error still exists please contact support.{" "}
      </div>
    );
  }

  return (
    <GlobalContainer>
      <Router>
        {!isMobile && <Header />}
        {isMobile && <MobileHeader />}
        <div style={{ maxWidth: "1400px", margin: "auto" }}>
          <Routes>
            <Route path="/" element={<FixturesContainer />} />
            <Route path="/player-stats" element={<PlayerStatsContainer />} />
            <Route path="/fixture/:matchId" element={<Fixture />} />
            <Route path="/players/:playerId" element={<PlayerPage />} />
          </Routes>
        </div>
      </Router>

      <div style={{ height: "50px" }}></div>
    </GlobalContainer>
  );
}

export default App;
