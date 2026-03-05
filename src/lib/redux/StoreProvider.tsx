// src/lib/redux/StoreProvider.tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import dynamic from "next/dynamic";
import { makeStore, AppStore } from "./store";
import { useAuth } from "@/context/AuthContext";

// Ensure BOTH listeners are only loaded on the client
const UserDataListener = dynamic(
  () =>
    import("@/components/client/UserDataListener").then(
      (mod) => mod.UserDataListener,
    ),
  { ssr: false },
);

const GroupNavigationSync = dynamic(
  () =>
    import("@/components/client/Groups/GroupNavigationSync").then(
      (mod) => mod.GroupNavigationSync,
    ),
  { ssr: false },
);

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore>(undefined);
  const { user } = useAuth();

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      {/* These components will now only execute once the code 
          has reached the browser, preventing SSR Firebase errors.
      */}
      {user?.uid && <UserDataListener userId={user.uid} />}
      {user?.uid && <GroupNavigationSync />}
      {children}
    </Provider>
  );
}
