import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { profileService } from "../../services/profileService";
import { userService } from "../../services/userService";

const linkBase =
  "flex w-full items-center justify-start gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors";

function SideLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          linkBase,
          isActive
            ? "bg-surface-container-highest text-on-surface ring-1 ring-outline-variant/15"
            : "text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

function capitalizeFirst(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
}

export function AdminLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState(() => userService.getUser());
  const avatarUrl = useSyncExternalStore(
    profileService.subscribeProfile,
    profileService.getCachedAvatarUrl,
    () => null
  );

  useEffect(() => {
    return userService.subscribeAuth(() => {
      setUser(userService.getUser());
    });
  }, []);

  useEffect(() => {
    if (avatarUrl) return;
    void profileService.getMe().catch(() => {
      // Staff/admin accounts may not have a student profile; ignore avatar fetch failures.
    });
  }, [avatarUrl]);

  const displayName = useMemo(() => {
    const first = capitalizeFirst(user?.first_name ?? "");
    const last = capitalizeFirst(user?.last_name ?? "");
    const full = `${first} ${last}`.trim();
    return full || user?.username || "Admin";
  }, [user?.first_name, user?.last_name, user?.username]);

  const initials = useMemo(() => {
    const a = (user?.first_name ?? "").trim()[0] ?? "";
    const b = (user?.last_name ?? "").trim()[0] ?? "";
    const out = (a + b).toUpperCase();
    return out || (user?.username ?? "A").trim()[0]?.toUpperCase() || "A";
  }, [user?.first_name, user?.last_name, user?.username]);

  return (
    <div className="relative min-h-[100dvh] bg-background text-on-background">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-container/18 blur-3xl" />
        <div className="absolute right-[-7rem] top-24 h-80 w-80 rounded-full bg-secondary-container/14 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-10 h-80 w-80 rounded-full bg-tertiary-container/14 blur-3xl" />
      </div>

      <div className="flex min-h-[100dvh] w-full gap-6 px-4 pb-16 pt-10 md:px-10">
        <aside className="w-72 shrink-0 self-start md:sticky md:top-10">
          <div className="rounded-3xl bg-surface-container-low/90 p-6 shadow-sm ring-1 ring-outline-variant/12 backdrop-blur-md">
            <div className="mb-5">
              <div className="font-headline text-xl font-black tracking-tighter text-primary">StudyBee</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("admin.layout.admin")}
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <SideLink to="/admin" label={t("admin.layout.stats")} end />
              <SideLink to="/admin/users" label={t("admin.layout.userManagement")} />

              <div className="mt-3 border-t border-outline-variant/15 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    userService.signOut();
                    navigate("/sign-in");
                  }}
                  className={[
                    linkBase,
                    "text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface",
                  ].join(" ")}
                >
                  {t("admin.layout.signOut")}
                </button>
              </div>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex items-center justify-end">
            <div className="flex items-center gap-3 rounded-full bg-surface-container-low/90 px-4 py-2 shadow-sm ring-1 ring-outline-variant/12 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest/60 ring-1 ring-outline-variant/12">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t("admin.layout.adminAlt")} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-headline text-sm font-black tracking-tight text-primary">
                    {initials}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-semibold text-on-surface">
                  {displayName}
                </div>
                <div className="truncate text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("admin.layout.admin")}
                </div>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
