import { useEffect } from "react";

import { useDispatch } from "react-redux";
import { fixtureReducer } from "../redux/Reducers/fixturesReducer";

import { doc, onSnapshot } from "firebase/firestore";

import { db } from "./Firebase";

const FirestoreDocumentListener = ({ docId }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!docId) return;

    const fixtureRef = doc(db, "fixtures/2024/33", String(docId));

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
  }, [docId, dispatch]);

  return null; // No UI, just listens and dispatches
};

export default FirestoreDocumentListener;
