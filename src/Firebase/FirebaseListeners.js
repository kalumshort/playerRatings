import { useEffect } from "react";

import { useDispatch } from "react-redux";
import { fixtureReducer } from "../redux/Reducers/fixturesReducer";

import { doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";

import { db } from "./Firebase";
import {
  groupDataFailure,
  groupDataStart,
  groupDataSuccess,
  updateGroupData,
} from "../redux/Reducers/groupReducer";
import {
  fetchUserDataSuccess,
  fetchUserMatchData,
} from "../redux/Reducers/userDataReducer";
import { getAuth } from "firebase/auth";

export const FixturesListener = ({ teamId, FixtureId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!teamId || FixtureId) return;

    const fixtureRef = doc(db, `fixtures/2024/${teamId}`, String(FixtureId));

    const unsubscribe = onSnapshot(
      fixtureRef,
      (snapshot) => {
        if (snapshot.exists()) {
          dispatch(fixtureReducer({ id: snapshot.id, data: snapshot.data() }));
        }
      },
      (error) => {
        console.error("Error listening to document:", error);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [teamId, FixtureId, dispatch]);

  return null; // No UI, just listens and dispatches
};
export const GroupListener = ({ groupId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!groupId) return;

    const fixtureRef = doc(db, `groups`, String(groupId));

    const unsubscribe = onSnapshot(
      fixtureRef,
      (snapshot) => {
        if (snapshot.exists()) {
          dispatch(
            updateGroupData({ groupId: groupId, data: snapshot.data() })
          );
        }
      },
      (error) => {
        console.error("Error listening to document:", error);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [groupId, dispatch]);

  return null; // No UI, just listens and dispatches
};

export const UserDataListener = ({ userId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, "users", String(userId));

    const unsubscribe = onSnapshot(
      userRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const userData = { ...snapshot.data(), uid: userId };

          // Convert `Timestamp` fields to a serializable format (ISO string)
          if (userData.createdAt instanceof Timestamp) {
            userData.createdAt = userData.createdAt.toDate().toISOString();
          }

          if (userData.lastLogin instanceof Timestamp) {
            userData.lastLogin = userData.lastLogin.toDate().toISOString();
          }

          try {
            if (userData.groups) {
              dispatch(groupDataStart());
              const groupObj = {};
              const groupPermissions = {};

              for (let i = 0; i < userData.groups.length; i++) {
                const groupId = userData.groups[i];
                const groupRef = doc(db, "groups", groupId);
                const groupDoc = await getDoc(groupRef);

                if (groupDoc.exists()) {
                  groupObj[groupId] = { ...groupDoc.data(), groupId: groupId };
                  const groupUserRef = doc(
                    db,
                    `groupUsers/${groupId}/members`,
                    userId
                  );
                  const groupUserDoc = await getDoc(groupUserRef);
                  if (groupUserDoc.exists()) {
                    const groupUserData = groupUserDoc.data();
                    groupPermissions[groupId] = groupUserData.role || {};
                  }
                } else {
                  console.error(
                    `Group ${groupId} does not exist or the user does not have permission to access it.`
                  );
                }
              }
              dispatch(groupDataSuccess(groupObj));
              dispatch(fetchUserDataSuccess({ ...userData, groupPermissions }));
            } else {
              dispatch(fetchUserDataSuccess(userData));
            }
          } catch (err) {
            console.error("Error fetching group data:", err.message);
            dispatch(groupDataFailure(err.message));
          }

          // dispatch(fixtureReducer({ id: snapshot.id, data: snapshot.data() }));
        }
      },
      (error) => {
        console.error("Error listening to document:", error);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [userId, dispatch]);

  return null; // No UI, just listens and dispatches
};

export const UsersMatchDataListener = ({ matchId, groupId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log("User is not authenticated");
      return;
    }

    const matchRef = doc(
      db,
      `users/${user.uid}/groups/${groupId}/seasons/2024/matches`,
      matchId
    );

    // Setup the Firestore real-time listener
    const unsubscribe = onSnapshot(
      matchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const matchData = snapshot.data();
          console.log("Match data:", matchData);
          dispatch(fetchUserMatchData({ matchId, data: matchData }));
        } else {
          console.log("No match data found");
        }
      },
      (error) => {
        console.error("Error listening to match document:", error);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [dispatch, matchId, groupId]);

  return null; // No UI, just listens and dispatches
};
