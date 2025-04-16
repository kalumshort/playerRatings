import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { selectSquadPlayerById } from "../../Selectors/squadDataSelectors";
import { Paper } from "@mui/material";
import {
  selectPlayerRatingsLoad,
  selectPlayerStatsById,
  selectPlayerStatsLoad,
} from "../../Selectors/selectors";
import {
  fetchPlayerRatingsAllMatches,
  fetchAllPlayersSeasonOverallRating,
} from "../../Hooks/Fixtures_Hooks";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { getRatingClass } from "../../Hooks/Helper_Functions";
import useGroupData from "../../Hooks/useGroupsData";

export default function PlayerPage() {
  const { playerId } = useParams();
  const playerData = useSelector(selectSquadPlayerById(playerId));
  const playerStats = useSelector(selectPlayerStatsById(playerId));
  const previousFixtures = useSelector(selectPreviousFixtures);

  const { playerStatsLoaded } = useSelector(selectPlayerStatsLoad);

  const { ratingsLoaded } = useSelector(selectPlayerRatingsLoad);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!ratingsLoaded) {
      dispatch(fetchPlayerRatingsAllMatches(playerId));
    }
  }, [dispatch, playerId, ratingsLoaded]);

  useEffect(() => {
    if (!playerStatsLoaded) {
      dispatch(fetchAllPlayersSeasonOverallRating());
    }
  }, [dispatch, playerStatsLoaded]);

  return (
    <>
      <Paper className="PlayerPageHeader">
        <img
          src={playerData?.photo}
          className="PlayerPageImg"
          alt={`${playerData.name}`}
        />
        <h2 className="globalHeading">{playerData.name}</h2>
        <h3 className="PlayerPageNumber">{playerData.number}</h3>
      </Paper>
      {!playerStats?.matches && <div className="spinner"></div>}
      {playerStats?.matches && previousFixtures && (
        <>
          <Paper className="containerMargin SeasonRatingContainer">
            <h4 className="subHeadingGlobal">Season Rating</h4>
            <div
              className={`globalBoxShadow PlayerStatsListItemScoreContainer ${getRatingClass(
                playerStats.totalRating / playerStats.totalSubmits
              )}`}
            >
              <h4 className="PlayerStatsListItemScore">
                {(playerStats.totalRating / playerStats.totalSubmits).toFixed(
                  1
                )}
              </h4>
            </div>
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
                  matchPlayerStats={Object.values(playerStats?.matches).find(
                    (match) => match.id === fixture.id
                  )}
                />
              );
            })}
          </Paper>
        </>
      )}
    </>
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
  );
};
