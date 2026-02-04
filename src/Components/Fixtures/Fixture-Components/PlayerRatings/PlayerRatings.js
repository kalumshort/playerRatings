import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

import {
  setLocalStorageItem,
  useIsMobile,
  useLocalStorage,
} from "../../../../Hooks/Helper_Functions";
import {
  handleMatchMotmVote,
  firebaseUpdateOrSetDoc,
} from "../../../../Firebase/Firebase";
import {
  selectMatchRatingsById,
  selectMotmPercentagesByMatchId,
} from "../../../../Selectors/selectors";

import {
  fetchMatchPlayerRatings,
  fetchUsersMatchData,
} from "../../../../Hooks/Fixtures_Hooks";
import { useAlert } from "../../../HelpfulComponents";
import useGroupData from "../../../../Hooks/useGroupsData";
import RatingLineup from "./RatingLineup";

import { useAuth } from "../../../../Providers/AuthContext";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import useGlobalData from "../../../../Hooks/useGlobalData";

import PlayerRatingsCardStack from "./PlayerRatingsCardStack";
import { useParams } from "react-router-dom";

export default function PlayerRatings({ fixture }) {
  const dispatch = useDispatch();
  const showAlert = useAlert();
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const isWeekOld = useMemo(() => {
    const MS_PER_WEEK = 604800000;
    return Date.now() - fixture.timestamp * 1000 >= MS_PER_WEEK;
  }, [fixture.timestamp]);

  const { activeGroup } = useGroupData();
  const { clubSlug } = useParams();
  const { user } = useAuth();
  const globalData = useGlobalData();

  const storedUsersMatchMOTM = useLocalStorage(`userMatchMOTM-${fixture.id}`);
  const groupClubId = Number(activeGroup?.groupClubId);

  const motmPercentages = useSelector(
    selectMotmPercentagesByMatchId(fixture.id, clubSlug),
  );

  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const isMatchRatingsSubmitted = usersMatchData?.ratingsSubmitted;

  // === PERFORMANCE FIX: MEMOIZE PLAYER CALCULATIONS ===
  const { lineup, combinedPlayers } = useMemo(() => {
    const _lineup =
      fixture.lineups.find((team) => team.team.id === groupClubId)?.startXI ||
      [];

    const substitutedPlayerIds = fixture?.events
      .filter((item) => item.type === "subst" && item.team?.id === groupClubId)
      .map((item) => {
        const newPlayer =
          item.assist &&
          !_lineup.some(
            (lineupPlayer) => lineupPlayer.player.id === item.assist.id,
          )
            ? item.assist
            : item.player;

        return {
          id: newPlayer.id,
          name: newPlayer.name,
        };
      });

    const _players = _lineup.map(({ player }) => ({
      id: player.id,
      name: player.name,
      grid: player.grid,
    }));

    const _coach = fixture.lineups.find(
      (team) => team.team.id === Number(groupClubId),
    )?.coach;

    const _combined = [..._players, ...substitutedPlayerIds, _coach];

    return { lineup: _lineup, combinedPlayers: _combined };
  }, [fixture.lineups, fixture.events, groupClubId]);
  // =======================================================

  // 1. Calculate Missing Votes
  const unratedPlayersCount = useMemo(() => {
    if (!combinedPlayers) return 0;
    const ratedIds = usersMatchData?.players
      ? Object.keys(usersMatchData.players)
      : [];
    // Count how many combinedPlayers IDs are NOT in the ratedIds array
    return combinedPlayers.filter((p) => !ratedIds.includes(String(p.id)))
      .length;
  }, [combinedPlayers, usersMatchData]);

  const allPlayersRated = unratedPlayersCount === 0;

  // Button is enabled if all players are rated. MOTM is optional (triggers popup).
  const isSubmittable = allPlayersRated;

  // 2. Logic to actually send data to Firebase
  const performSubmission = async (motmId) => {
    try {
      if (motmId) {
        // CASE A: With MOTM (Standard)
        await handleMatchMotmVote({
          matchId: fixture.id,
          playerId: String(motmId),
          value: 1,
          groupId: activeGroup.groupId,
          userId: user.uid,
          currentYear: globalData.currentYear,
        });
      } else {
        // CASE B: No MOTM (Manual Override)
        await firebaseUpdateOrSetDoc({
          path: `users/${user.uid}/groups/${activeGroup.groupId}/seasons/${globalData.currentYear}/matches`,
          docId: String(fixture.id),
          data: { ratingsSubmitted: true },
        });
      }

      setLocalStorageItem(`userMatchRatingSubmited-${fixture.id}`, true);

      dispatch(
        fetchMatchPlayerRatings({
          matchId: fixture.id,
          groupId: activeGroup.groupId,
          currentYear: globalData.currentYear,
        }),
      );
      dispatch(
        fetchUsersMatchData({
          matchId: fixture.id,
          groupId: activeGroup.groupId,
          currentYear: globalData.currentYear,
        }),
      );

      setOpenConfirmDialog(false);
    } catch (error) {
      console.error(error);
      showAlert("Error submitting ratings", "error");
    }
  };

  // 3. Handle Button Click
  const handleRatingsSubmitClick = () => {
    if (!allPlayersRated) {
      showAlert(
        `You have ${unratedPlayersCount} players left to rate!`,
        "error",
      );
      return;
    }

    if (!storedUsersMatchMOTM) {
      setOpenConfirmDialog(true);
    } else {
      performSubmission(storedUsersMatchMOTM);
    }
  };

  return (
    <>
      {fixture?.fixture?.status?.elapsed > 80 ? (
        lineup.length === 0 ? (
          <div style={{ textAlign: "center", padding: "10px" }}>
            Missing Lineup
          </div>
        ) : isMatchRatingsSubmitted || !user || isWeekOld ? (
          <SubmittedPlayerRatings
            motmPercentages={motmPercentages}
            fixture={fixture}
            combinedPlayers={combinedPlayers}
            isMatchRatingsSubmitted={isMatchRatingsSubmitted}
            handleRatingsSubmit={handleRatingsSubmitClick}
            usersMatchPlayerRatings={usersMatchData?.players}
          />
        ) : (
          <PlayerRatingsItems
            combinedPlayers={combinedPlayers}
            fixture={fixture}
            isMatchRatingsSubmitted={isMatchRatingsSubmitted}
            handleRatingsSubmit={handleRatingsSubmitClick}
            groupId={activeGroup.groupId}
            userId={user?.uid}
            usersMatchPlayerRatings={usersMatchData?.players}
            currentYear={globalData.currentYear}
            isSubmittable={isSubmittable}
            storedUsersMatchMOTM={storedUsersMatchMOTM}
            unratedPlayersCount={unratedPlayersCount} // Pass counts down
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
      )}

      {/* --- CONFIRMATION DIALOG --- */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        PaperProps={{
          style: {
            backgroundColor: "rgba(20, 20, 20, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "white",
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>
          Submit without Man of the Match?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#aaa" }}>
            You haven't selected a Man of the Match. Do you want to submit your
            player ratings anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Go Back</Button>
          <Button
            onClick={() => performSubmission(null)}
            variant="contained"
            color="primary"
            autoFocus
          >
            Submit Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const PlayerRatingsItems = ({
  combinedPlayers,
  fixture,
  isMatchRatingsSubmitted,
  handleRatingsSubmit,
  readOnly,
  groupId,
  userId,
  usersMatchPlayerRatings,
  currentYear,
  isSubmittable,
  storedUsersMatchMOTM,
  unratedPlayersCount, // New Prop
}) => {
  const isMobile = useIsMobile();
  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));

  if (!combinedPlayers) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="PlayerRatingsItemsContainer">
      <PlayerRatingsCardStack
        combinedPlayers={combinedPlayers}
        fixture={fixture}
        isMobile={isMobile}
        matchRatings={matchRatings}
        readOnly={readOnly}
        groupId={groupId}
        userId={userId}
        currentYear={currentYear}
        usersMatchPlayerRatings={usersMatchPlayerRatings}
        storedUsersMatchMOTM={storedUsersMatchMOTM}
      />

      {!isMatchRatingsSubmitted && (
        <div style={{ textAlign: "center", width: "100%", marginTop: "10px" }}>
          <Button
            onClick={() => handleRatingsSubmit()}
            variant="outlined"
            fontSize="large"
            className="PlayerRatingSubmit"
            disabled={!isSubmittable}
            sx={{
              opacity: !isSubmittable ? 0.5 : 1,
            }}
          >
            Submit Ratings
          </Button>

          {/* --- INFO SECTION UNDER BUTTON --- */}
          <div style={{ marginTop: "12px", minHeight: "24px" }}>
            {unratedPlayersCount > 0 && (
              <Typography
                variant="caption"
                sx={{ color: "#ff4d4d", display: "block", fontWeight: "bold" }}
              >
                • Missing {unratedPlayersCount} player vote
                {unratedPlayersCount !== 1 ? "s" : ""}
              </Typography>
            )}
            {!storedUsersMatchMOTM && (
              <Typography
                variant="caption"
                sx={{ color: "#ffb74d", display: "block", fontWeight: "bold" }}
              >
                • Missing MOTM vote
              </Typography>
            )}
            {unratedPlayersCount === 0 && storedUsersMatchMOTM && (
              <Typography
                variant="caption"
                sx={{ color: "#4caf50", display: "block", fontWeight: "bold" }}
              >
                Ready to submit!
              </Typography>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SubmittedPlayerRatings = ({
  motmPercentages,
  fixture,
  usersMatchPlayerRatings,
}) => {
  return (
    <>
      <RatingLineup
        fixture={fixture}
        usersMatchPlayerRatings={usersMatchPlayerRatings}
        motmPercentages={motmPercentages}
      />
    </>
  );
};
