import { useSelector } from "react-redux";
import { selectUserDataData } from "../Selectors/userDataSelectors";

const useUserData = () => {
  const userData = useSelector(selectUserDataData);

  const { userDataLoading, userDataError, userDataLoaded } = useSelector(
    (state) => state.userData
  );

  return {
    userData,
    userDataLoading,
    userDataError,
    userDataLoaded,
  };
};

export default useUserData;
