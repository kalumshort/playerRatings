import { useSelector } from "react-redux";
import { selectGlobalData } from "../Selectors/selectors";

const useGlobalData = () => {
  const userData = useSelector(selectGlobalData);

  return userData;
};

export default useGlobalData;
