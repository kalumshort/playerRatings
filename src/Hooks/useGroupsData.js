import { useSelector } from "react-redux";
import {
  selectGroupData, // Should now return the 'byGroupId' object
  selectGroupLoaded,
  selectGroupLoading,
} from "../Selectors/groupSelectors";
import useUserData from "./useUserData";

const useGroupData = () => {
  const groupDataLoaded = useSelector(selectGroupLoaded);
  const groupDataLoading = useSelector(selectGroupLoading);

  // This now returns the full dictionary: { "groupA": {...}, "groupB": {...} }
  const allGroups = useSelector(selectGroupData);

  const { userData } = useUserData();

  // 1. Get the ID of the group the user is currently viewing
  const activeGroupId = useSelector((state) => state.groupData.activeGroupId);

  // 2. Resolve the full object for the active group
  const activeGroup = allGroups[activeGroupId];

  // 3. Resolve the user's "Home" group (from their user profile)
  // This ensures they can always get back to their main group
  const userHomeGroup = userData?.activeGroup
    ? allGroups[userData.activeGroup]
    : null;

  return {
    groupData: allGroups, // The full dictionary (renamed for clarity if needed)
    groupDataLoaded,
    groupDataLoading,
    activeGroup, // The resolved object for the current view
    activeGroupId, // The ID string
    userHomeGroup, // The resolved object for their "default" group
  };
};

export default useGroupData;
