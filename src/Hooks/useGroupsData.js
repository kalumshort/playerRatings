import { useSelector } from "react-redux";
import {
  selectGroupData,
  selectGroupLoaded,
} from "../Selectors/groupSelectors";
import useUserData from "./useUserData";

const useGroupData = () => {
  const groupDataLoaded = useSelector(selectGroupLoaded);
  const groupData = useSelector(selectGroupData);
  const { userData } = useUserData();

  return {
    groupData,
    groupDataLoaded,
    activeGroup: groupData[userData.activeGroup],
  };
};

export default useGroupData;
