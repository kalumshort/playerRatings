import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import { forEach } from "lodash";
import { Button, ButtonGroup } from "@mui/material";
import {
  setLocalStorageItem,
  useIsMobile,
  useLocalStorage,
} from "../../../../Hooks/Helper_Functions";
import {
  handleMatchMotmVote,
  handlePlayerRatingSubmit,
} from "../../../../Firebase/Firebase";
import {
  selectMatchRatingsById,
  selectMotmPercentagesByMatchId,
} from "../../../../Selectors/selectors";

import StarOutlineIcon from "@mui/icons-material/StarOutline";
import StarIcon from "@mui/icons-material/Star";

export default function PlayerRatings({ fixture }) {
  const isMobile = useIsMobile();
  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));
  const motmPercentages = useSelector(
    selectMotmPercentagesByMatchId(fixture.id)
  );

  const isMatchRatingsSubmitted = useLocalStorage(
    `userMatchRatingSubmited-${fixture.id}`
  );

  const unitedLineup =
    fixture.lineups.find((team) => team.team.id === 33)?.startXI || [];

  const isPostMatch = fixture?.fixture?.status?.short === "FT";

  const substitutedPlayerIds = fixture?.events
    .filter((item) => item.type === "subst" && item.team?.id === 33)
    .map((item) => item.player);

  const players = unitedLineup.map(({ player }) => ({
    id: player.id,
    name: player.name,
  }));

  // Combine the two arrays
  const combinedPlayers = [
    ...players,
    ...substitutedPlayerIds.map(({ id, name }) => ({ id, name })),
  ];

  const handleRatingsSubmit = async () => {
    const allPlayersRated = combinedPlayers.every(({ id }) => {
      const storedRating = localStorage.getItem(
        `userPlayerRatings-${fixture.id}-${id}`
      );
      return storedRating !== null;
    });

    if (!allPlayersRated) {
      console.log("Missing Some Ratings");
      return;
    }
    const storedUsersMatchMOTM = localStorage.getItem(
      `userMatchMOTM-${fixture.id}`
    );

    if (!storedUsersMatchMOTM) {
      console.log("Missing Your MOTM");
      return;
    }

    await handleMatchMotmVote({
      matchId: fixture.id,
      playerId: String(storedUsersMatchMOTM),
      value: 1,
    });

    setLocalStorageItem(`userMatchRatingSubmited-${fixture.id}`, true);
  };

  return !isMatchRatingsSubmitted ? (
    <>Submitted</>
  ) : (
    <div className="PlayerRatingsItemsContainer">
      {combinedPlayers.map((player, rowIndex) => (
        <PlayerRatingItem
          player={player}
          fixture={fixture}
          isMobile={isMobile}
          matchRatings={matchRatings}
        />
      ))}
      <PlayerRatingItem
        player={{ id: 696969 }}
        fixture={fixture}
        isMobile={isMobile}
        matchRatings={matchRatings}
      />
      {!isMatchRatingsSubmitted && (
        <Button
          onClick={() => handleRatingsSubmit()}
          variant="contained"
          fontSize="large"
          className="PlayerRatingSubmit"
        >
          Submit
        </Button>
      )}
      {isMatchRatingsSubmitted && (
        <div className="PlayerRatingMotmContainer PlayerRatingItem motm">
          <img src={motmPercentages[0].img} className="PlayerRatingImg" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: "1",
              justifyContent: "space-Evenly",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <h2 className="gradient-text">{motmPercentages[0].name}</h2>
              <h2 className="gradient-text" style={{ fontSize: "50px" }}>
                {motmPercentages[0].percentage}%
              </h2>
            </div>
            {/* <div
              style={{
                display: "flex",
                flexDirection: "row",
                fontSize: "10px",
                color: "grey",
                position: "absolute",
                bottom: "2px",
                gap: "2px",
              }}
            >
              {motmPercentages.map((player) => (
                <>
                  <p>
                    {player.name}-{player.percentage}%
                  </p>
                </>
              ))}
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

const PlayerRatingItem = ({ player, fixture, isMobile, matchRatings }) => {
  const playerData = useSelector(selectSquadPlayerById(player.id));

  const storedUsersPlayerRating = useLocalStorage(
    `userPlayerRatings-${fixture.id}-${player.id}`
  );
  const storedUsersMatchMOTM = useLocalStorage(`userMatchMOTM-${fixture.id}`);

  const isMOTM = storedUsersMatchMOTM === String(player.id);

  // Filter: Goals scored by the player
  const goals = fixture?.events.filter(
    (event) => event.type === "Goal" && event.player?.id === player.id
  );

  // Filter: Assists for goals by the player
  const assists = fixture?.events.filter(
    (event) => event.type === "Goal" && event.assist?.id === player.id
  );

  // Filter: Cards received by the player
  const cards = fixture?.events.filter(
    (event) => event.type === "Card" && event.player?.id === player.id
  );

  const yellowCards = cards?.filter(
    (card) => card.detail === "Yellow Card"
  ).length;
  const redCards = cards?.filter((card) => card.detail === "Red Card").length;

  let cardIcon = null;
  if (yellowCards === 2 && redCards === 1) {
    cardIcon =
      "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-yellow-red.svg";
  } else if (yellowCards === 1 && redCards === 0) {
    cardIcon =
      "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-yellow.svg";
  } else if (redCards === 1) {
    cardIcon =
      "https://www.premierleague.com/resources/rebrand/v7.153.31/i/elements/icons/card-red.svg";
  }

  const playerRatingAverage = (
    matchRatings[player.id]?.totalRating / matchRatings[player.id]?.totalSubmits
  ).toFixed(1);

  const onRatingClick = async (score) => {
    setLocalStorageItem(`userPlayerRatings-${fixture.id}-${player.id}`, score);
    await handlePlayerRatingSubmit({
      matchId: fixture.id,
      playerId: String(player.id),
      rating: score,
    });
  };
  const handleMotmClick = async () => {
    if (isMOTM) {
      setLocalStorageItem(`userMatchMOTM-${fixture.id}`, null);
    } else {
      setLocalStorageItem(`userMatchMOTM-${fixture.id}`, String(player.id));
    }
  };
  return (
    <div className={isMOTM ? "PlayerRatingItem motm" : "PlayerRatingItem"}>
      <img src={playerData.img} className="PlayerRatingImg" />

      <div className="PlayerRatingInner">
        <span className="PlayerRatingsNameContainer">
          <h2 className="PlayerRatingName gradient-text">{playerData.name}</h2>
          {goals?.map((goal, index) => (
            <img
              key={index}
              src="https://img.icons8.com/?size=100&id=cg5jSDHEKVtO&format=png&color=000000"
              alt="Goal Icon"
              className="PlayerRatingsIcon"
            />
          ))}
          {cardIcon && (
            <img src={cardIcon} alt="Card Icon" className="PlayerRatingsIcon" />
          )}
        </span>
        {!storedUsersPlayerRating && (
          <div className="PlayerRatingsChoices">
            {Array.from({ length: 10 }, (_, i) => (
              <ButtonGroup
                className="PlayerRatingsButtonGroup"
                aria-label="PlayerRatingsButtonGroup"
                orientation={isMobile ? "vertical" : "horizontal"}
                size="large"
              >
                <Button
                  variant="contained"
                  className="PlayerRatingsButton"
                  onClick={() => onRatingClick(i + 1)}
                >
                  {i + 1}
                </Button>
                {i !== 9 && (
                  <Button
                    variant="outlined"
                    className="PlayerRatingsButton PlayerRatingsButton2"
                    onClick={() => onRatingClick(i + 1.5)}
                  >
                    .5
                  </Button>
                )}
              </ButtonGroup>
            ))}
          </div>
        )}
        {storedUsersPlayerRating && (
          <div className="PlayerRatingsResults">
            <div className="PlayerRatingsCommunityContainer">
              <h2 className="PlayerRatingsCommunityTitle">Your Score</h2>
              <h2 className="PlayerRatingsCommunityScore gradient-text">
                {storedUsersPlayerRating}
              </h2>
            </div>
            <div className="PlayerRatingsCommunityContainer">
              <h2 className="PlayerRatingsCommunityTitle">Community Score</h2>
              <h2 className="PlayerRatingsCommunityScore gradient-text">
                {playerRatingAverage}
              </h2>
            </div>
          </div>
        )}
      </div>
      <div className="PlayerRatingMotm">
        {isMOTM ? (
          <StarIcon
            fontSize="large"
            onClick={() => handleMotmClick()}
            color="primary"
          />
        ) : (
          <StarOutlineIcon fontSize="small" onClick={() => handleMotmClick()} />
        )}
      </div>
    </div>
  );
};
