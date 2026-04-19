"use client";

import { useRef } from "react";
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
  const initialised = useRef(false);

  // Dispatch during the render phase so Redux has the data BEFORE children
  // paint — prevents the one-frame flash caused by useEffect firing too late.
  // The ref guard ensures we only dispatch once even if the component re-renders.
  if (!initialised.current && groupData) {
    initialised.current = true;
    dispatch(groupDataSuccess({ [groupData.id]: groupData }));
    dispatch(setActiveGroup(groupData.id));
  }

  return null;
}
