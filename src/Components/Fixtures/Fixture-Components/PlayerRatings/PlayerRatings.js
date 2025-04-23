import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";

import { Button, ButtonGroup, Paper } from "@mui/material";

import {
  getRatingClass,
  missingPlayerImg,
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
import { fetchMatchPlayerRatings } from "../../../../Hooks/Fixtures_Hooks";
import { useAlert } from "../../../HelpfulComponents";
import useGroupData from "../../../../Hooks/useGroupsData";
import RatingLineup from "./RatingLineup";

import MOTMPopover from "./MotmPlayerPopper";
import { useAuth } from "../../../../Providers/AuthContext";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";

export default function PlayerRatings({ fixture }) {
  const dispatch = useDispatch();
  const showAlert = useAlert();
  const { activeGroup } = useGroupData();
  const { user } = useAuth();

  const groupClubId = Number(activeGroup.groupClubId);
  const groupId = activeGroup.groupId;

  const motmPercentages = useSelector(
    selectMotmPercentagesByMatchId(fixture.id)
  );

  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  const isMatchRatingsSubmittedLocal = useLocalStorage(
    `userMatchRatingSubmited-${fixture.id}`
  );

  const isMatchRatingsSubmittedDatabase = usersMatchData?.ratingsSubmitted;

  const isMatchRatingsSubmitted =
    isMatchRatingsSubmittedLocal || isMatchRatingsSubmittedDatabase;

  console.log("isMatchRatingsSubmitted", isMatchRatingsSubmitted);

  const lineup =
    fixture.lineups.find((team) => team.team.id === groupClubId)?.startXI || [];

  // const isPostMatch = fixture?.fixture?.status?.short === "FT";

  const substitutedPlayerIds = fixture?.events
    .filter((item) => item.type === "subst" && item.team?.id === groupClubId)
    .map((item) => item.player);

  const players = lineup.map(({ player }) => ({
    id: player.id,
    name: player.name,
    grid: player.grid,
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
      showAlert("Missing Some Ratings", "error");

      return;
    }
    const storedUsersMatchMOTM = localStorage.getItem(
      `userMatchMOTM-${fixture.id}`
    );

    if (!storedUsersMatchMOTM) {
      showAlert("Missing your MOTM");

      console.log("Missing Your MOTM");
      return;
    }

    await handleMatchMotmVote({
      matchId: fixture.id,
      playerId: String(storedUsersMatchMOTM),
      value: 1,
      groupId: groupId,
      userId: user.uid,
    });

    setLocalStorageItem(`userMatchRatingSubmited-${fixture.id}`, true);
    dispatch(fetchMatchPlayerRatings(fixture.id));
  };

  return fixture?.fixture?.status?.elapsed > 80 ? (
    isMatchRatingsSubmitted ? (
      <SubmittedPlayerRatings
        motmPercentages={motmPercentages}
        combinedPlayers={combinedPlayers}
        fixture={fixture}
        isMatchRatingsSubmitted={isMatchRatingsSubmitted}
        handleRatingsSubmit={handleRatingsSubmit}
        usersMatchPlayerRatings={usersMatchData?.players}
      />
    ) : (
      <PlayerRatingsItems
        combinedPlayers={combinedPlayers}
        fixture={fixture}
        isMatchRatingsSubmitted={isMatchRatingsSubmitted}
        handleRatingsSubmit={handleRatingsSubmit}
        groupId={groupId}
        userId={user.uid}
        usersMatchPlayerRatings={usersMatchData?.players}
      />
    )
  ) : (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "200px",
      }}
    >
      Ratings will open at minute 80
    </div>
  );
}

const PlayerRatingItem = ({
  player,
  fixture,
  isMobile,
  matchRatings,
  readOnly,
  groupId,
  userId,
}) => {
  const playerData = useSelector(selectSquadPlayerById(player.id));

  const storedUsersPlayerRating = useLocalStorage(
    `userPlayerRatings-${fixture.id}-${player.id}`
  );
  const storedUsersMatchMOTM = useLocalStorage(`userMatchMOTM-${fixture.id}`);

  const isMOTM = storedUsersMatchMOTM === String(player?.id);

  // Filter: Goals scored by the player
  const goals = fixture?.events.filter(
    (event) => event.type === "Goal" && event.player?.id === player.id
  );

  // Filter: Assists for goals by the player
  // const assists = fixture?.events.filter(
  //   (event) => event.type === "Goal" && event.assist?.id === player.id
  // );

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

  const playerRatingAverage = matchRatings?.[player.id]?.totalRating
    ? (
        matchRatings[player.id]?.totalRating /
        matchRatings[player.id]?.totalSubmits
      ).toFixed(1)
    : storedUsersPlayerRating;

  const onRatingClick = async (score) => {
    setLocalStorageItem(`userPlayerRatings-${fixture.id}-${player.id}`, score);
    await handlePlayerRatingSubmit({
      matchId: fixture.id,
      playerId: String(player.id),
      rating: score,
      userId: userId,
      groupId: groupId,
    });
  };
  const handleMotmClick = async () => {
    if (readOnly) {
      return;
    }
    if (isMOTM) {
      setLocalStorageItem(`userMatchMOTM-${fixture.id}`, null);
    } else {
      setLocalStorageItem(`userMatchMOTM-${fixture.id}`, String(player.id));
    }
  };

  return (
    <div
      className={`PlayerRatingItem ${isMOTM ? "motm" : ""}`}
      style={{ width: "100%" }}
    >
      <img
        src={playerData?.photo || player.photo || missingPlayerImg}
        className="PlayerRatingImg"
        alt={player.name}
      />

      <div className="PlayerRatingInner">
        <span className="PlayerRatingsNameContainer">
          <h2 className="PlayerRatingName">
            {playerData?.name || player.name}
          </h2>

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

        {!storedUsersPlayerRating ? (
          <div className="PlayerRatingsChoices">
            {Array.from({ length: 10 }, (_, i) => (
              <ButtonGroup
                key={i}
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
        ) : (
          <div className="PlayerRatingsResults">
            <div className="PlayerRatingsCommunityContainer">
              <h2 className="PlayerRatingsCommunityTitle">Your Score</h2>
              <div
                className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                  storedUsersPlayerRating
                )}`}
              >
                <h4 className="PlayerRatingsCommunityScore textShadow">
                  {storedUsersPlayerRating}
                </h4>
              </div>
            </div>

            <div className="PlayerRatingsCommunityContainer">
              <h2 className="PlayerRatingsCommunityTitle">Community Score</h2>
              <div
                className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                  playerRatingAverage
                )}`}
              >
                <h4 className="PlayerRatingsCommunityScore textShadow">
                  {playerRatingAverage}
                </h4>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="PlayerRatingMotm"
        style={{
          cursor: readOnly ? "default" : "pointer",
          pointerEvents: readOnly ? "none" : "auto",
        }}
      >
        {isMOTM ? (
          <StarIcon
            fontSize="large"
            onClick={handleMotmClick}
            color="primary"
          />
        ) : !readOnly ? (
          <StarOutlineIcon fontSize="large" onClick={handleMotmClick} />
        ) : null}
      </div>
    </div>
  );
};

const PlayerRatingsItems = ({
  combinedPlayers,
  fixture,
  isMatchRatingsSubmitted,
  handleRatingsSubmit,
  readOnly,
  groupId,
  userId,
  usersMatchPlayerRatings,
}) => {
  const isMobile = useIsMobile();
  const { activeGroup } = useGroupData();

  console.log("test");

  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));

  if (!combinedPlayers) {
    return <div className="spinner"></div>;
  }
  const coach = fixture.lineups.find(
    (team) => team.team.id === Number(activeGroup.groupClubId)
  )?.coach; // Convert activeGroup.groupClubId to number

  return (
    <div className="PlayerRatingsItemsContainer">
      {combinedPlayers.map((player, rowIndex) => (
        <PlayerRatingItem
          player={player}
          fixture={fixture}
          isMobile={isMobile}
          matchRatings={matchRatings}
          readOnly={readOnly}
          groupId={groupId}
          userId={userId}
        />
      ))}
      <PlayerRatingItem
        player={coach}
        fixture={fixture}
        isMobile={isMobile}
        matchRatings={matchRatings}
        readOnly={readOnly}
        groupId={groupId}
        userId={userId}
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
    </div>
  );
};

const SubmittedPlayerRatings = ({
  motmPercentages,
  fixture,
  usersMatchPlayerRatings,
}) => {
  console.log("testttttt");
  return (
    <>
      <Paper className="PlayerRatingItem motm">
        <MOTMPopover motmPercentages={motmPercentages} />
        <img
          src={motmPercentages[0]?.img}
          className="PlayerRatingImg"
          alt="PlayerRatingImg"
        />
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
              flexDirection: "column",
              alignItems: "center",
              // gap: "10px",
              padding: "10px",
            }}
          >
            <h5 style={{ margin: "0px", color: "grey", fontStyle: "italic" }}>
              MOTM
            </h5>
            <h2 style={{ margin: "5px" }}>{motmPercentages[0]?.name}</h2>
            <h2
              // className="gradient-text"
              style={{ fontSize: "30px", margin: "0px" }}
            >
              {motmPercentages[0]?.percentage}%
            </h2>
          </div>
        </div>
      </Paper>
      <RatingLineup
        fixture={fixture}
        usersMatchPlayerRatings={usersMatchPlayerRatings}
      />

      {/* <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          Squad Ratings
        </AccordionSummary>
        <AccordionDetails>
          <PlayerRatingsItems
            combinedPlayers={combinedPlayers}
            fixture={fixture}
            isMatchRatingsSubmitted={isMatchRatingsSubmitted}
            handleRatingsSubmit={handleRatingsSubmit}
            readOnly={true}
          />
        </AccordionDetails>
      </Accordion> */}
    </>
  );
};
