import { useSelector } from "react-redux";
import { selectGroupData } from "../Selectors/groupSelectors";
import useUserData from "./useUserData";

const useGroupData = () => {
  const groupData = useSelector(selectGroupData);
  const { userData } = useUserData();

  return { groupData, activeGroup: userData.activeGroup };
};

export default useGroupData;
