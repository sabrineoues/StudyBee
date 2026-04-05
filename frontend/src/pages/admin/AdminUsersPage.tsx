import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService, type AdminUser } from "../../services/adminService";

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    if (!users) return null;
    return [...users].sort((a, b) => a.id - b.id);
  }, [users]);

  const filtered = useMemo(() => {
    if (!sorted) return null;
    const q = query.trim().toLowerCase();
    if (!q) return sorted;

    return sorted.filter((u) => {
      const id = String(u.id);
      const email = (u.email || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const first = (u.first_name || "").toLowerCase();
      const last = (u.last_name || "").toLowerCase();
      const full = `${first} ${last}`.trim();

      return (
        id.includes(q) ||
        email.includes(q) ||
        username.includes(q) ||
        first.includes(q) ||
        last.includes(q) ||
        full.includes(q)
      );
    });
  }, [sorted, query]);

  function inputClass() {
    return "w-full rounded-full border-none bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface placeholder:text-outline/60 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary/40";
  }

  async function reload() {
    setError(null);
    try {
      const res = await adminService.listUsers();
      setUsers(res);
    } catch (err) {
      const maybeAny = err as { response?: { status?: number } };
      const status = maybeAny?.response?.status;
      if (status === 401) setError("Session expired. Please sign in again.");
      else if (status === 403) setError("Access denied. Your account is not staff.");
      else setError("Failed to load users.");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <main className="min-w-0">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            Users
          </h1>
          <p className="mt-2 text-on-surface-variant">View all users and manage accounts.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95"
          >
            Refresh
          </button>
          <Link
            to="/admin/users/new"
            className="rounded-full bg-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            Add user
          </Link>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label className="font-label mb-2 block text-xs uppercase tracking-widest text-outline">Search</label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email, username, name, or ID"
              className={inputClass()}
            />
            <button
              type="button"
              onClick={() => setQuery("")}
              disabled={!query.trim()}
              className="shrink-0 rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="text-sm font-semibold text-on-surface-variant">
          {filtered ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}` : "…"}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-outline-variant/15">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container-highest/40 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {sorted ? (
                filtered && filtered.length ? (
                  filtered.map((u) => (
                  <tr key={u.id} className="text-on-surface">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.email}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{u.username}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3">{u.is_staff ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">{u.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/users/${u.id}/edit`}
                          className="rounded-full bg-surface-container-highest/70 px-4 py-2 text-xs font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={async () => {
                            const ok = window.confirm(`Delete user #${u.id}?`);
                            if (!ok) return;
                            setBusyId(u.id);
                            setError(null);
                            try {
                              await adminService.deleteUser(u.id);
                              await reload();
                            } catch {
                              setError("Failed to delete user.");
                            } finally {
                              setBusyId(null);
                            }
                          }}
                          className="rounded-full bg-error-container/20 px-4 py-2 text-xs font-semibold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/30 disabled:opacity-60"
                        >
                          {busyId === u.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-on-surface-variant" colSpan={7}>
                      No users match your search.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td className="px-4 py-6 text-on-surface-variant" colSpan={7}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
