import { useSelector } from "react-redux";
import {
  selectGroupData,
  selectGroupLoaded,
  selectGroupLoading,
} from "../Selectors/groupSelectors";
import useUserData from "./useUserData";

const useGroupData = () => {
  const groupDataLoaded = useSelector(selectGroupLoaded);
  const groupDataLoading = useSelector(selectGroupLoading);
  const groupData = useSelector(selectGroupData);
  const { userData } = useUserData();

  const currentGroup = useSelector((state) => state.groupData.currentGroup);

  return {
    groupData,
    groupDataLoaded,
    groupDataLoading,
    userHomeGroup: groupData[userData.activeGroup],
    currentGroup,
  };
};

export default useGroupData;
