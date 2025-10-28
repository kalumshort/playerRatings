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

  return {
    groupData,
    groupDataLoaded,
    groupDataLoading,
    activeGroup: groupData[userData.activeGroup],
  };
};

export default useGroupData;
