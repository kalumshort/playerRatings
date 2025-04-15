import { useEffect } from "react";

import { useDispatch } from "react-redux";
import { fixtureReducer } from "../redux/Reducers/fixturesReducer";

import { doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";

import { db } from "./Firebase";
import {
  groupDataFailure,
  groupDataStart,
  groupDataSuccess,
} from "../redux/Reducers/groupReducer";
import { fetchUserDataSuccess } from "../redux/Reducers/userDataReducer";

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

          // Dispatch user data
          dispatch(fetchUserDataSuccess(userData));

          try {
            // Fetch group data if available
            if (userData.groups) {
              dispatch(groupDataStart());
              const groupObj = {};

              for (let groupId of userData.groups) {
                const groupRef = doc(db, "groups", groupId);
                const groupDoc = await getDoc(groupRef);

                if (groupDoc.exists()) {
                  groupObj[groupId] = { ...groupDoc.data(), groupId };
                }
              }

              // Dispatch group data success
              dispatch(groupDataSuccess(groupObj));
            }
          } catch (err) {
            // Handle error during group data fetch
            dispatch(groupDataFailure(err.message));
          }

          // Dispatch fixture data
          dispatch(fixtureReducer({ id: snapshot.id, data: snapshot.data() }));
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
