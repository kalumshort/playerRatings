"use client";

import { useSelector } from "react-redux";
import {
  selectUserAccountData,
  selectIsUserLoaded,
  selectUserPermissions,
} from "@/lib/redux/selectors/userSelectors";
import { selectActiveGroupId } from "@/lib/redux/selectors/groupSelectors";

export default function useUserData() {
  const userData = useSelector(selectUserAccountData);
  const isLoaded = useSelector(selectIsUserLoaded);
  const permissions = useSelector(selectUserPermissions);
  const activeGroupId = useSelector(selectActiveGroupId);

  // Check if the user is an admin of the group they are currently viewing
  const isGroupAdmin = activeGroupId
    ? permissions[activeGroupId] === "admin"
    : false;

  return {
    userData,
    isLoaded,
    isGroupAdmin,
    permissions,
  };
}
