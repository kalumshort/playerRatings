// src/lib/redux/StoreProvider.tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./store";
import { UserDataListener } from "@/components/client/UserDataListener";
import { useAuth } from "@/context/AuthContext";
import { GroupNavigationSync } from "@/components/client/Groups/GroupNavigationSync";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>(undefined);
  const { user } = useAuth(); // Get the current logged-in user

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      {/* The Listener lives inside the Provider so it has access to dispatch */}
      {user && <UserDataListener userId={user?.uid || null} />}
      {user && <GroupNavigationSync />}
      {children}
    </Provider>
  );
}
