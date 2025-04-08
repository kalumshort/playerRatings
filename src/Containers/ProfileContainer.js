import React from "react";
import { useAuth } from "../Providers/AuthContext";
import LoggedInProfile from "../Components/Profile/LoggedInProfile";
import LoggedOutProfile from "../Components/Profile/LoggedOutProfile";

export default function ProfileContainer() {
  const { user } = useAuth();

  return user ? <LoggedInProfile user={user} /> : <LoggedOutProfile />;
}
