import React, { useEffect, useState } from "react";
import { firebaseGetDocument } from "../Firebase/Firebase";
import { useParams } from "react-router-dom";
import useUserData from "../Hooks/useUserData";
import { Button, Paper, Typography, Box } from "@mui/material";
import { Spinner } from "./Helpers";

import { handleAddUserToGroup } from "../Firebase/Auth_Functions";
import { useAlert } from "../Components/HelpfulComponents";
import Login from "../Components/Auth/Login";
import { useDispatch } from "react-redux";
import { clearTeamSquads } from "../redux/Reducers/teamSquads";
import { clearRatings } from "../redux/Reducers/playerRatingsReducer";
import { clearFixtures } from "../redux/Reducers/fixturesReducer";
import { useAppNavigate } from "../Hooks/useAppNavigate";

export default function GroupPublicPage() {
  const { userData } = useUserData();

  const [inviteLinkDoc, setInviteLink] = useState(null);
  const { groupId } = useParams();
  const showAlert = useAlert();
  const dispatch = useDispatch();

  const appNavigate = useAppNavigate();

  useEffect(() => {
    const fetchInviteLinkForGroup = async () => {
      const inviteDoc = await firebaseGetDocument("groupInviteLinks", groupId);
      if (inviteDoc) {
        setInviteLink(inviteDoc);
      }
    };
    if (groupId) {
      fetchInviteLinkForGroup();
    }
  }, [groupId]);

  const handleJoinGroup = async () => {
    if (!inviteLinkDoc) {
      return;
    }
    if (userData.groups.includes(inviteLinkDoc.groupId)) {
      return;
    }
    // Call handleAddUserToGroup and handle the result
    const result = await handleAddUserToGroup({
      userData: userData,
      groupId: inviteLinkDoc.groupId,
    });

    // Show feedback based on the result
    if (result.success) {
      showAlert(`Successfully Joined ${inviteLinkDoc.groupName} `);
      dispatch(clearFixtures());
      dispatch(clearRatings());
      dispatch(clearTeamSquads());
    } else {
      showAlert(result.message); // Error message
    }
  };

  if (!inviteLinkDoc) {
    return <Spinner />;
  }

  if (userData?.groups?.includes(inviteLinkDoc.groupId)) {
    appNavigate("/");
  }

  return (
    <div>
      <Paper
        className="containerMargin"
        style={{
          padding: "20px",
          maxWidth: "600px",
        }}
      >
        <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
          <Typography variant="h4" gutterBottom>
            Join: {inviteLinkDoc.groupName}
          </Typography>
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{ marginBottom: "20px" }}
          >
            Use this link to join {inviteLinkDoc.groupName}s group, make your
            predictions, and rate the players after matches!
          </Typography>

          {userData.uid ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleJoinGroup}
            >
              Join Now!
            </Button>
          ) : (
            <Login groupId={inviteLinkDoc.groupId} />
          )}
        </Box>
      </Paper>
    </div>
  );
}
