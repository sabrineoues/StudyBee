import { useEffect, useState } from "react";
import { adminService, type AdminStats } from "../../services/adminService";

export function AdminStatsPage() {
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
        else setError("Failed to load stats.");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-w-0">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
          Stats
        </h1>
        <p className="mt-2 text-on-surface-variant">Overview of your platform.</p>
      </header>

      {error ? (
        <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total Users</p>
          <p className="mt-2 text-4xl font-black text-primary">{stats ? stats.users_total : "…"}</p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-6 ring-1 ring-outline-variant/15">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Staff Users</p>
          <p className="mt-2 text-4xl font-black text-primary">{stats ? stats.users_staff : "…"}</p>
        </div>
      </section>
    </main>
  );
}
