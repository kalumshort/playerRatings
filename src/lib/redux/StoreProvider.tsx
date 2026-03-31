// src/lib/redux/StoreProvider.tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./store";
import { UserDataListener } from "@/components/client/UserDataListener";

import { useAuth } from "@/context/AuthContext";
import { GroupNavigationSync } from "@/components/client/Groups/GroupNavigationSync";
import { GroupsListener } from "@/components/client/Listeners/GroupsListener";

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
      {/* 1. Global State Hydration */}
      {user && <UserDataListener userId={user?.uid || null} />}

      {/* 2. Relationship & Match Data Hydration */}
      {user && <GroupsListener />}

      {/* 3. Logic-based Routing (Depends on Data above) */}
      {user && <GroupNavigationSync />}

      {children}
    </Provider>
  );
}
