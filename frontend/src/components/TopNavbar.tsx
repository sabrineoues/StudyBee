import { useSyncExternalStore } from "react";
import { userService } from "../services/userService";
import { TopNavbarSignIn } from "./TopNavbarSignIn";
import { TopNavbarSignUp } from "./TopNavbarSignUp";

export function TopNavbar() {
  const isSignedIn = useSyncExternalStore(
    userService.subscribeAuth,
    userService.isSignedIn,
    () => false
  );

  return isSignedIn ? <TopNavbarSignIn /> : <TopNavbarSignUp />;
}
