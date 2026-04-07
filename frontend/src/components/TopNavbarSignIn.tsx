import { useEffect, useSyncExternalStore } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { profileService } from "../services/profileService";
import { userService } from "../services/userService";

const linkBase =
  "font-headline font-semibold text-sm tracking-tight transition-all duration-200 hover:scale-105";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          linkBase,
          isActive
            ? "text-primary border-b-2 border-primary pb-1"
            : "text-on-surface opacity-70 hover:opacity-100",
          "dark:text-surface-variant",
        ].join(" ")
      }
      end={to === "/"}
    >
      {label}
    </NavLink>
  );
}

export function TopNavbarSignIn() {
  const navigate = useNavigate();

  const avatarUrl = useSyncExternalStore(
    profileService.subscribeProfile,
    profileService.getCachedAvatarUrl,
    () => null
  );

  useEffect(() => {
    if (avatarUrl) return;
    void profileService.getMe();
  }, [avatarUrl]);

  function onSignOut() {
    userService.signOut();
    profileService.clearCachedAvatarUrl();
    navigate("/", { replace: true });
  }

  return (
    <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-background/60 px-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(55,45,37,0.06)] md:px-12">
      <div className="flex items-center gap-10">
        <NavLink
          to="/"
          className="font-headline text-2xl font-black tracking-tighter text-primary"
          end
        >
          StudyBee
        </NavLink>

        <div className="hidden items-center gap-8 md:flex">
          <NavItem to="/" label="Home" />
          <NavItem to="/study" label="Study" />
          <NavItem to="/journal" label="Journal" />
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/settings" label="Settings" />
          <NavItem to="/tips" label="Tips" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full bg-surface-container-highest/70 px-4 py-2 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Sign out
        </button>

        <button
          type="button"
          aria-label="Profile"
          onClick={() => navigate("/profile")}
          className={[
            "inline-flex h-11 w-11 items-center justify-center rounded-full",
            "bg-surface-container-highest/70 text-primary shadow-sm ring-1 ring-outline-variant/10",
            "transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest",
            "active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          ].join(" ")}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-[32px] leading-none">
              account_circle
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
