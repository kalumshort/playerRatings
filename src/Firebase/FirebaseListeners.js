import { useEffect } from "react";

import { useDispatch } from "react-redux";
import { fixtureReducer } from "../redux/Reducers/fixturesReducer";

import { doc, getDoc, onSnapshot } from "firebase/firestore";

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
import useGlobalData from "../Hooks/useGlobalData";

export const FixturesListener = ({ teamId, fixtureId }) => {
  const dispatch = useDispatch();

  const globalData = useGlobalData();

  useEffect(() => {
    if (!teamId || !fixtureId) return;

    const fixtureRef = doc(
      db,
      `fixtures/${globalData.currentYear}/fixtures`,
      String(fixtureId)
    );

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
  }, [teamId, fixtureId, dispatch, globalData.currentYear]);

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

          // 1. Sanitize User Data Timestamps
          ["createdAt", "lastLogin"].forEach((field) => {
            if (
              userData[field] &&
              typeof userData[field].toDate === "function"
            ) {
              userData[field] = userData[field].toDate().toISOString();
            }
          });

          try {
            if (userData.groups && userData.groups.length > 0) {
              dispatch(groupDataStart());

              // 2. OPTIMIZATION: Fetch all groups in parallel (Faster!)
              const groupPromises = userData.groups.map(async (groupId) => {
                try {
                  const groupRef = doc(db, "groups", groupId);
                  const groupDoc = await getDoc(groupRef);

                  if (!groupDoc.exists()) return null;

                  let groupData = groupDoc.data();

                  // 3. 🛡️ SANITIZE GROUP DATA (Prevents Redux Crash)
                  // Iterate over all fields to find and convert Timestamps
                  Object.keys(groupData).forEach((key) => {
                    if (
                      groupData[key] &&
                      typeof groupData[key].toDate === "function"
                    ) {
                      groupData[key] = groupData[key].toDate().toISOString();
                    }
                  });

                  // Fetch Permissions (Optional, keeps your existing logic)
                  const groupUserRef = doc(
                    db,
                    `groupUsers/${groupId}/members`,
                    userId
                  );
                  const groupUserDoc = await getDoc(groupUserRef);
                  const permissions = groupUserDoc.exists()
                    ? groupUserDoc.data().role || {}
                    : {};

                  return {
                    id: groupId,
                    data: { ...groupData, groupId }, // The cleaned group object
                    permissions: { [groupId]: permissions },
                  };
                } catch (err) {
                  console.error(`Error loading group ${groupId}`, err);
                  return null;
                }
              });

              // Wait for all fetches to finish
              const results = await Promise.all(groupPromises);

              // 4. Reassemble the objects for Redux
              const groupObj = {};
              const groupPermissions = {};

              results.forEach((res) => {
                if (res) {
                  groupObj[res.id] = res.data;
                  Object.assign(groupPermissions, res.permissions);
                }
              });

              // Dispatch clean data
              dispatch(groupDataSuccess(groupObj));
              dispatch(fetchUserDataSuccess({ ...userData, groupPermissions }));
            } else {
              // User has no groups
              // Still dispatch success with empty object so loading stops
              dispatch(groupDataSuccess({}));
              dispatch(fetchUserDataSuccess(userData));
            }
          } catch (err) {
            console.error("Listener Error:", err);
            dispatch(groupDataFailure(err.message));
          }
        } else {
          console.log("No user data found for userId:", userId);
        }
      },
      (error) => {
        console.error("Error listening to document:", error);
      }
    );

    return () => unsubscribe();
  }, [userId, dispatch]);

  return null;
};

export const UsersMatchDataListener = ({ matchId, groupId }) => {
  const dispatch = useDispatch();
  const globalData = useGlobalData();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log("User is not authenticated");
      return;
    }

    const matchRef = doc(
      db,
      `users/${user.uid}/groups/${groupId}/seasons/${globalData.currentYear}/matches`,
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
  }, [dispatch, matchId, groupId, globalData.currentYear]);

  return null; // No UI, just listens and dispatches
};
