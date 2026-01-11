import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUserData from "./useUserData";
import useGroupData from "./useGroupsData";

export const useGroupAutoRedirect = () => {
  const navigate = useNavigate();

  const { userData } = useUserData();
  const { groupData } = useGroupData(); // The dictionary of all groups

  // We use refs to track state without causing re-renders
  const prevGroupId = useRef(userData?.activeGroup);
  const isFirstMount = useRef(true);

  useEffect(() => {
    const currentGroupId = userData?.activeGroup;

    // 1. Wait until user data is actually loaded
    if (!currentGroupId) return;

    // 2. On the very first check, just sync the ref and do nothing.
    // This prevents the app from forcing you to the home group if you
    // refresh the page while sitting on a different group's URL.
    if (isFirstMount.current) {
      prevGroupId.current = currentGroupId;
      isFirstMount.current = false;
      return;
    }

    // 3. DETECT CHANGE: Has the Active Group ID changed since the last render?
    if (prevGroupId.current !== currentGroupId) {
      console.log(
        `[AutoRedirect] Switching Group: ${prevGroupId.current} -> ${currentGroupId}`
      );

      const newGroup = groupData[currentGroupId];

      // If we found the new group object, navigate to it
      if (newGroup?.slug) {
        // Optional: Check if we are currently on a "Global" page (like profile)
        // If so, maybe we don't want to redirect?
        // For now, we assume we ALWAYS want to go to the new group.
        navigate(`/${newGroup.slug}`);
      }

      // Update the ref so we don't redirect again until it changes again
      prevGroupId.current = currentGroupId;
    }
  }, [userData?.activeGroup, groupData, navigate]);
};
