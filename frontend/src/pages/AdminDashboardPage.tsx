import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { adminService, type AdminStats } from "../services/adminService";

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await adminService.getStats();
        if (!alive) return;
        setStats(res);
      } catch (err) {
        if (!alive) return;
        const maybeAny = err as { response?: { status?: number } };
        const status = maybeAny?.response?.status;
        if (status === 401) setError(t("admin.errors.sessionExpired"));
        else if (status === 403) setError(t("admin.errors.accessDeniedNotStaff"));
        else setError(t("admin.errors.failedToLoadAdminStats"));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <StudyBeeShell>
      <main className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 md:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-container/18 blur-3xl" />
          <div className="absolute right-[-7rem] top-24 h-80 w-80 rounded-full bg-secondary-container/14 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-10 h-80 w-80 rounded-full bg-tertiary-container/14 blur-3xl" />
        </div>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant ring-1 ring-outline-variant/10">
            {t("admin.common.dashboardChip")}
          </div>
          <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{t("admin.common.overview")}</p>
        </header>

        {error ? (
          <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-surface-container-low/90 p-6 shadow-sm ring-1 ring-outline-variant/12 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("admin.dashboard.totalUsers")}
              </p>
              <div className="rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold text-on-surface-variant ring-1 ring-outline-variant/10">
                {t("admin.dashboard.allAccounts")}
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-6">
              <p className="text-5xl font-black tracking-tight text-primary">
                {stats ? stats.users_total : "…"}
              </p>
              <span className="material-symbols-outlined text-[32px] text-primary/60" aria-hidden>
                groups
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-container-low/90 p-6 shadow-sm ring-1 ring-outline-variant/12 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("admin.dashboard.staffUsers")}
              </p>
              <div className="rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold text-on-surface-variant ring-1 ring-outline-variant/10">
                {t("admin.dashboard.adminAccess")}
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-6">
              <p className="text-5xl font-black tracking-tight text-primary">
                {stats ? stats.users_staff : "…"}
              </p>
              <span className="material-symbols-outlined text-[32px] text-primary/60" aria-hidden>
                admin_panel_settings
              </span>
            </div>
          </div>
        </section>
      </main>
    </StudyBeeShell>
  );
}
