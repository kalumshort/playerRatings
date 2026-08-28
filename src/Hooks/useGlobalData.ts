import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { setCurrentYear, toggleSidebar } from "@/lib/redux/slices/globalSlice";

export const useGlobalData = () => {
  const dispatch = useDispatch();

  // 1. Selectors
  const currentYear = useSelector((state: RootState) => state.globalData.currentYear);
  const isSidebarOpen = useSelector((state: RootState) => state.globalData.isSidebarOpen);

  // 2. Actions
  const updateYear = (year: string) => {
    dispatch(setCurrentYear(year));
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return {
    currentYear,
    isSidebarOpen,
    updateYear,
    handleToggleSidebar,
  };
};

export default useGlobalData;