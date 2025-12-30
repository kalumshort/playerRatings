import { useSelector } from "react-redux";
import { selectUserDataData } from "../Selectors/userDataSelectors";
import useGroupData from "./useGroupsData";

const useUserData = () => {
  const userData = useSelector(selectUserDataData);

  const { currentGroup } = useGroupData();

  const { userDataLoading, userDataError, userDataLoaded } = useSelector(
    (state) => state.userData
  );

  return {
    userData,
    userDataLoading,
    userDataError,
    userDataLoaded,
    isGroupAdmin: userData.groupPermissions
      ? userData.groupPermissions[currentGroup.groupId]
        ? userData.groupPermissions[currentGroup.groupId] === "admin"
        : false
      : false,
  };
};

export default useUserData;
