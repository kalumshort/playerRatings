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
import { fetchFixtures } from "./Hooks/Fixtures_Hooks";
import Spinner from "./Containers/Helpers";

import PlayerStatsContainer from "./Containers/PlayerStatsContainer";
import { useIsMobile } from "./Hooks/Helper_Functions";
import MobileHeader from "./Containers/MobileHeader";

function App() {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const { loaded, loading } = useSelector((state) => ({
    loaded: state.fixtures.loaded,
    loading: state.fixtures.loading,
  }));

  useEffect(() => {
    if (!loaded) {
      dispatch(fetchFixtures());
    }
  }, [dispatch, loaded]);

  if (!loaded || loading) {
    return <Spinner />;
  }

  return (
    <GlobalContainer>
      <Router>
        {!isMobile && <Header />}
        {isMobile && <MobileHeader />}
        <Routes>
          <Route path="/" element={<FixturesContainer />} />
          <Route path="/player-stats" element={<PlayerStatsContainer />} />
          <Route path="/fixture/:matchId" element={<Fixture />} />
        </Routes>
      </Router>
      <div style={{ height: "50px" }}></div>
    </GlobalContainer>
  );
}

export default App;
