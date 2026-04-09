import { useEffect, useSyncExternalStore } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { profileService } from "../services/profileService";
import { userService } from "../services/userService";
import { useTranslation } from "react-i18next";
import { normalizeLanguage, storeLanguage } from "../i18n/language";

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
  const { t, i18n } = useTranslation();

  const current = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const next = current === "en" ? "fr" : "en";

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
          <NavItem to="/" label={t("nav.home")} />
          <NavItem to="/study" label={t("nav.study")} />
          <NavItem to="/journal" label={t("nav.journal")} />
          <NavItem to="/dashboard" label={t("nav.dashboard")} />
          <NavItem to="/settings" label={t("nav.settings")} />
          <NavItem to="/tips" label={t("nav.tips")} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full bg-surface-container-highest/70 px-4 py-2 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {t("nav.signOut")}
        </button>

        <button
          type="button"
          aria-label={t("nav.profile")}
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
              alt={t("nav.profile")}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-[32px] leading-none">
              account_circle
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label={t("nav.language")}
          title={t("nav.language")}
          onClick={async () => {
            await i18n.changeLanguage(next);
            storeLanguage(next);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest/70 px-4 py-2 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">language</span>
          <span className="text-xs font-black tracking-widest text-on-surface/80">{current.toUpperCase()}</span>
        </button>
      </div>
    </nav>
  );
}
