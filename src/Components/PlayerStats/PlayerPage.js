import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { selectSquadPlayerById } from "../../Selectors/squadDataSelectors";
import { Paper } from "@mui/material";
import {
  selectPlayerRatingsById,
  selectPlayerRatingsLoad,
} from "../../Selectors/selectors";
import {
  fetchPlayerRatingsAllMatches,
  fetchAllPlayersSeasonOverallRating,
} from "../../Hooks/Fixtures_Hooks";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { getRatingClass } from "../../Hooks/Helper_Functions";
import useGroupData from "../../Hooks/useGroupsData";
import useGlobalData from "../../Hooks/useGlobalData";
import PlayerRatingsLineGraph from "./PlayerRatingsLineGraph";

export default function PlayerPage() {
  const { playerId } = useParams();
  const { activeGroup } = useGroupData();
  const globalData = useGlobalData();

  const playerData = useSelector(selectSquadPlayerById(playerId));
  const allPlayerRatings = useSelector(selectPlayerRatingsById(playerId));
  const previousFixtures = useSelector(selectPreviousFixtures);
  const { playerAllMatchesRatingLoaded, playerSeasonOverallRatingsLoaded } =
    useSelector(selectPlayerRatingsLoad);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      fetchPlayerRatingsAllMatches({
        playerId: playerId,
        groupId: activeGroup.groupId,
        currentYear: globalData.currentYear,
      })
    );
  }, [dispatch, playerId, activeGroup.groupId, globalData.currentYear]);

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: activeGroup.groupId,
          currentYear: globalData.currentYear,
        })
      );
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    activeGroup.groupId,
    globalData.currentYear,
  ]);

  if (!playerSeasonOverallRatingsLoaded && !playerAllMatchesRatingLoaded) {
    return <></>;
  }
  const seasonAverageRating =
    allPlayerRatings?.seasonOverall?.totalRating /
    allPlayerRatings?.seasonOverall?.totalSubmits;

  return (
    <div className="PlayerPageContainer">
      <div>
        <Paper className="containerMargin PlayerPageHeader">
          <img
            src={playerData?.photo}
            className="PlayerPageImg"
            alt={`${playerData.name}`}
          />
          <h2 className="globalHeading">{playerData.name}</h2>
          <h3 className="PlayerPageNumber">{playerData.number}</h3>
        </Paper>
        <Paper className="containerMargin">
          <div className="SeasonRatingContainer">
            <h4 className="subHeadingGlobal">Avg. Rating</h4>
            <div
              className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                seasonAverageRating
              )}`}
            >
              <h4 className="PlayerStatsListItemScore">
                {seasonAverageRating.toFixed(1)}
              </h4>
            </div>
          </div>
        </Paper>
      </div>

      {!allPlayerRatings?.matches && <div className="spinner"></div>}
      {allPlayerRatings?.matches && previousFixtures && (
        <div style={{ width: "100%" }}>
          <Paper className="containerMargin " style={{ padding: "10px" }}>
            <PlayerRatingsLineGraph allPlayerRatings={allPlayerRatings} />
          </Paper>

          <Paper className="containerMargin PlayerMatchList">
            {previousFixtures?.map((fixture, index) => {
              const matchTime = new Date(
                fixture.fixture.timestamp * 1000
              ).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              return (
                <PlayerMatchitem
                  key={fixture.id || index}
                  getRatingClass={getRatingClass}
                  fixture={fixture}
                  matchTime={matchTime}
                  matchPlayerStats={Object.values(
                    allPlayerRatings?.matches
                  ).find((match) => match.id === fixture.id)}
                />
              );
            })}
          </Paper>
        </div>
      )}
    </div>
  );
}

const PlayerMatchitem = ({
  fixture,
  matchTime,
  getRatingClass,
  matchPlayerStats,
}) => {
  const { activeGroup } = useGroupData();

  const groupClubId = Number(activeGroup.groupClubId);
  const oponent = Object.values(fixture?.teams).find(
    (team) => team.id !== groupClubId
  );

  return (
    <Link
      to={`/fixture/${fixture.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="PlayerMatchItem">
        <div className="PlayerMatchMeta">
          <span>{matchTime}</span>
          <span>{fixture.league.name}</span>
        </div>
        <div className="PlayerItemData">
          <div className="PlayerItemOponentContainer">
            <img
              src={oponent.logo}
              className="PlayerItemOponentLogo"
              alt={`${oponent.name} logo`}
            />
            <div className="PlayerItemTeamScore">
              <span>{oponent.name}</span>
              <span>
                {fixture.score.fulltime.home} - {fixture.score.fulltime.away}
              </span>
            </div>
          </div>

          {matchPlayerStats ? (
            <div
              className={`globalBoxShadow PlayerStatsListItemScoreContainerSmall ${getRatingClass(
                matchPlayerStats.totalRating / matchPlayerStats.totalSubmits
              )}`}
            >
              <h4 className="PlayerStatsListItemScore">
                {(
                  matchPlayerStats.totalRating / matchPlayerStats.totalSubmits
                ).toFixed(1)}
              </h4>
            </div>
          ) : (
            <div className={` PlayerStatsListItemScoreContainerSmall `}>
              <h4 className="PlayerStatsListItemScore">-</h4>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
