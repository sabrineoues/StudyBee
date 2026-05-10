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
      } catch {
        if (!alive) return;
        setError(t("admin.errors.failedToLoadStats", { defaultValue: "Failed to load stats." }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  return (
    <StudyBeeShell>
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28">
        <header className="mb-10">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            {t("admin.stats.title", { defaultValue: "StudyBee Statistics welcome Admin" })}
          </h1>
          <p className="mt-2 text-on-surface-variant">
            {t("admin.common.overview", { defaultValue: "Overview of your platform." })}
          </p>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl bg-error-container/20 px-5 py-4 text-sm font-semibold text-on-error-container ring-1 ring-outline-variant/10">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {t("admin.stats.totalUsers", { defaultValue: "Total Users" })}
            </p>
            <p className="mt-2 text-4xl font-black text-primary">{stats ? stats.users_total : "…"}</p>
          </div>

          <div className="rounded-xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {t("admin.stats.staffUsers", { defaultValue: "Staff Users" })}
            </p>
            <p className="mt-2 text-4xl font-black text-primary">{stats ? stats.users_staff : "…"}</p>
          </div>
        </section>
      </main>
    </StudyBeeShell>
  );
}
