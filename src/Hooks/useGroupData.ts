"use client";

import { useSelector } from "react-redux";
import {
  selectGroupData,
  selectGroupLoaded,
  selectGroupLoading,
  selectActiveGroupData,
  selectActiveGroupId,
  selectUserHomeGroup, // This replaces the manual userData lookup
} from "@/lib/redux/selectors/groupSelectors";

const useGroupData = () => {
  // 1. Status Flags
  const groupDataLoaded = useSelector(selectGroupLoaded);
  const groupDataLoading = useSelector(selectGroupLoading);

  // 2. Data Collections
  const allGroups = useSelector(selectGroupData);

  // 3. Active Context (What they are looking at)
  const activeGroup = useSelector(selectActiveGroupData);
  const activeGroupId = useSelector(selectActiveGroupId);

  // 4. Identity Context (Their "Home" club)
  const userHomeGroup = useSelector(selectUserHomeGroup);

  return {
    groupData: allGroups, // Dictionary: { ID: Data }
    groupDataLoaded,
    groupDataLoading,
    activeGroup, // Full object of currently viewed club
    activeGroupId, // ID string
    userHomeGroup, // Full object of their primary club
  };
};

export default useGroupData;
