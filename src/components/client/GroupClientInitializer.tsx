"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  setActiveGroup,
  groupDataSuccess,
} from "@/lib/redux/slices/groupSlice";

export default function GroupClientInitializer({
  groupData,
}: {
  groupData: any;
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (groupData) {
      // Push the server-side data into Redux dictionary
      dispatch(groupDataSuccess({ [groupData.id]: groupData }));
      // Set this as the active club for the UI
      dispatch(setActiveGroup(groupData.id));
    }
  }, [groupData, dispatch]);

  return null;
}
