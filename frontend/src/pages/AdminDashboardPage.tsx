import { useEffect, useState } from "react";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { adminService, type AdminStats } from "../services/adminService";

export function AdminDashboardPage() {
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
        if (status === 401) setError("Session expired. Please sign in again.");
        else if (status === 403) setError("Access denied. Your account is not staff.");
        else setError("Failed to load admin stats.");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <StudyBeeShell>
      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant ring-1 ring-outline-variant/10">
            Admin
          </div>
          <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            Overview of your platform.
          </p>
        </header>

        {error ? (
          <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Total Users
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-5xl font-black tracking-tight text-primary">
                {stats ? stats.users_total : "…"}
              </p>
              <div className="rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold text-on-surface-variant ring-1 ring-outline-variant/10">
                All accounts
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Staff Users
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-5xl font-black tracking-tight text-primary">
                {stats ? stats.users_staff : "…"}
              </p>
              <div className="rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold text-on-surface-variant ring-1 ring-outline-variant/10">
                Admin access
              </div>
            </div>
          </div>
        </section>
      </main>
    </StudyBeeShell>
  );
}
