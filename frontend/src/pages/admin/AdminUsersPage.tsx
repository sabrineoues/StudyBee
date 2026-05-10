import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { adminService, type AdminUser } from "../../services/adminService";

function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const trimmed = String(dob).trim();
  if (!trimmed) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

function capitalizeFirst(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
}

function titleCaseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => capitalizeFirst(w.toLocaleLowerCase()))
    .join(" ");
}

function formatSpecialityLabel(value: string, fallbackLabel: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallbackLabel;
  if (/^[a-zA-Z]{1,5}$/.test(trimmed)) return trimmed.toLocaleUpperCase();
  return titleCaseWords(trimmed);
}

function specialityKey(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed.toLocaleLowerCase() : "unspecified";
}

type DonutSegment = {
  label: string;
  value: number;
  className: string;
};

function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const shownSegments = total > 0 ? segments.filter((s) => s.value > 0) : segments;

  const size = 128;
  const strokeWidth = 6;
  const r = 18;
  const cx = 22;
  const cy = 22;
  const circumference = 2 * Math.PI * r;
  const gap = 1.25;

  let offset = 0;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
      <div className="relative grid shrink-0 place-items-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 44 44"
          className="-rotate-90"
          role="img"
          aria-label={centerLabel}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-outline-variant/15"
          />

          {total > 0
            ? shownSegments.map((s) => {
                const rawLength = (s.value / total) * circumference;
                const length = Math.max(rawLength - gap, 0);
                const dashOffset = -offset;
                offset += rawLength;

                return (
                  <circle
                    key={s.label}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={dashOffset}
                    className={s.className}
                  />
                );
              })
            : null}
        </svg>

        <div className="absolute inset-0 grid place-items-center text-center">
          <div className="rounded-2xl bg-surface-container-highest px-3 py-2 ring-1 ring-outline-variant/10">
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {centerLabel}
            </div>
            <div className="mt-1 font-headline text-xl font-black tracking-tight text-on-surface">
              {centerValue}
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={["h-2.5 w-2.5 shrink-0 rounded-full bg-current", s.className].join(" ")}
              />
              <span className="truncate text-sm font-semibold text-on-surface-variant">{s.label}</span>
            </div>
            <span className="rounded-full bg-surface-container-highest/60 px-3 py-1 text-xs font-bold text-on-surface ring-1 ring-outline-variant/10">
              {total ? s.value : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutCard({
  title,
  subtitle,
  segments,
  centerLabel,
  centerValue,
}: {
  title: string;
  subtitle: string;
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-lg font-extrabold tracking-tight text-on-surface">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <div className="mt-6">
        <DonutChart segments={segments} centerLabel={centerLabel} centerValue={centerValue} />
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation();

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
  }, [query, sorted]);

  const derivedStats = useMemo(() => {
    if (!users) return null;

    let active = 0;
    let inactive = 0;
    let superusers = 0;
    let staff = 0;

    const ageBuckets = {
      under18: 0,
      from18to20: 0,
      from21to23: 0,
      from24plus: 0,
      unknown: 0,
    };

    const specialityCounts = new Map<string, { key: string; label: string; value: number }>();

    for (const u of users) {
      if (u.is_active) active += 1;
      else inactive += 1;
      if (u.is_staff) staff += 1;
      if (u.is_superuser) superusers += 1;

      const age = ageFromDob(u.date_of_birth);
      if (age == null) ageBuckets.unknown += 1;
      else if (age < 18) ageBuckets.under18 += 1;
      else if (age <= 20) ageBuckets.from18to20 += 1;
      else if (age <= 23) ageBuckets.from21to23 += 1;
      else ageBuckets.from24plus += 1;

      const rawSpeciality = String(u.speciality ?? "");
      const key = specialityKey(rawSpeciality);
      const label = formatSpecialityLabel(rawSpeciality, t("admin.common.unspecified"));
      const existing = specialityCounts.get(key);
      if (existing) existing.value += 1;
      else specialityCounts.set(key, { key, label, value: 1 });
    }

    const staffNonSuper = Math.max(staff - superusers, 0);
    const regular = Math.max(users.length - staff, 0);

    const specialitySorted = [...specialityCounts.values()].sort((a, b) => b.value - a.value);
    const topSpecialities = specialitySorted.slice(0, 4);
    const otherSpecialitiesValue = specialitySorted.slice(4).reduce((sum, s) => sum + s.value, 0);

    return {
      total: users.length,
      active,
      inactive,
      staff,
      superusers,
      staffNonSuper,
      regular,
      ageBuckets,
      topSpecialities,
      otherSpecialitiesValue,
    };
  }, [t, users]);

  function inputClass() {
    return "w-full rounded-full border-none bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface placeholder:text-outline/60 ring-1 ring-outline-variant/10 focus:ring-2 focus:ring-primary/40";
  }

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await adminService.listUsers();
      setUsers(res);
    } catch (err) {
      const maybeAny = err as { response?: { status?: number } };
      const status = maybeAny?.response?.status;
      if (status === 401) setError(t("admin.errors.sessionExpired"));
      else if (status === 403) setError(t("admin.errors.accessDeniedNotStaff"));
      else setError(t("admin.errors.failedToLoadUsers"));
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <main className="min-w-0">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            {t("admin.users.title")}
          </h1>
          <p className="mt-2 text-on-surface-variant">{t("admin.users.subtitle")}</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform transition-colors duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
              refresh
            </span>
            {t("admin.common.refresh")}
          </button>
          <Link
            to="/admin/users/new"
            className="rounded-full bg-gradient-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            {t("admin.common.addUser")}
          </Link>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-6">
          <DonutCard
            title={t("admin.stats.rolesTitle")}
            subtitle={t("admin.stats.rolesSubtitle")}
            centerLabel={t("admin.common.total")}
            centerValue={derivedStats ? String(derivedStats.total) : "…"}
            segments={[
              {
                label: t("admin.stats.superusers"),
                value: derivedStats?.superusers ?? 0,
                className: "text-primary",
              },
              {
                label: t("admin.stats.staff"),
                value: derivedStats?.staffNonSuper ?? 0,
                className: "text-tertiary",
              },
              {
                label: t("admin.stats.regular"),
                value: derivedStats?.regular ?? 0,
                className: "text-on-surface-variant",
              },
            ]}
          />
        </div>

        <div className="md:col-span-6">
          <DonutCard
            title={t("admin.stats.activationTitle")}
            subtitle={t("admin.stats.activationSubtitle")}
            centerLabel={t("admin.common.total")}
            centerValue={derivedStats ? String(derivedStats.total) : "…"}
            segments={[
              {
                label: t("admin.stats.active"),
                value: derivedStats?.active ?? 0,
                className: "text-primary",
              },
              {
                label: t("admin.stats.inactive"),
                value: derivedStats?.inactive ?? 0,
                className: "text-tertiary",
              },
            ]}
          />
        </div>

        <div className="md:col-span-6">
          <DonutCard
            title={t("admin.stats.ageTitle")}
            subtitle={t("admin.stats.ageSubtitle")}
            centerLabel={t("admin.common.total")}
            centerValue={derivedStats ? String(derivedStats.total) : "…"}
            segments={[
              {
                label: "< 18",
                value: derivedStats?.ageBuckets.under18 ?? 0,
                className: "text-primary",
              },
              {
                label: "18–20",
                value: derivedStats?.ageBuckets.from18to20 ?? 0,
                className: "text-tertiary",
              },
              {
                label: "21–23",
                value: derivedStats?.ageBuckets.from21to23 ?? 0,
                className: "text-primary/60",
              },
              {
                label: "24+",
                value: derivedStats?.ageBuckets.from24plus ?? 0,
                className: "text-tertiary/60",
              },
              {
                label: t("admin.common.unknown"),
                value: derivedStats?.ageBuckets.unknown ?? 0,
                className: "text-outline",
              },
            ]}
          />
        </div>

        <div className="md:col-span-6">
          <DonutCard
            title={t("admin.stats.specialityTitle")}
            subtitle={t("admin.stats.specialitySubtitle")}
            centerLabel={t("admin.common.total")}
            centerValue={derivedStats ? String(derivedStats.total) : "…"}
            segments={(() => {
              const colors = [
                "text-primary",
                "text-tertiary",
                "text-primary/60",
                "text-tertiary/60",
              ];

              const top = (derivedStats?.topSpecialities ?? []).map((s, idx) => {
                const isNeutral = s.key === "unspecified" || s.key === "other";
                return {
                  label: s.label,
                  value: s.value,
                  className: isNeutral ? "text-outline" : (colors[idx] ?? "text-primary"),
                };
              });

              const other = derivedStats?.otherSpecialitiesValue ?? 0;
              return other > 0
                ? [...top, { label: t("admin.common.other"), value: other, className: "text-outline" }]
                : top;
            })()}
          />
        </div>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label className="font-label mb-2 block text-xs uppercase tracking-widest text-outline">
            {t("admin.users.search")}
          </label>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.users.searchPlaceholder")}
              className={inputClass()}
            />
            <button
              type="button"
              onClick={() => setQuery("")}
              disabled={!query.trim()}
              className="shrink-0 rounded-full bg-surface-container-highest/70 px-5 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest disabled:opacity-60"
            >
              {t("admin.common.clear")}
            </button>
          </div>
        </div>

        <div className="text-sm font-semibold text-on-surface-variant">
          {filtered ? t("admin.users.results", { count: filtered.length }) : "…"}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-surface-container-low ring-1 ring-outline-variant/15">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container-highest/40 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">{t("admin.users.columns.id")}</th>
                <th className="px-4 py-3">{t("admin.users.columns.email")}</th>
                <th className="px-4 py-3">{t("admin.users.columns.username")}</th>
                <th className="px-4 py-3">{t("admin.users.columns.name")}</th>
                <th className="px-4 py-3">{t("admin.users.columns.staff")}</th>
                <th className="px-4 py-3">{t("admin.users.columns.active")}</th>
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
                      <td className="px-4 py-3">
                        {u.is_staff ? t("admin.common.yes") : t("admin.common.no")}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? t("admin.common.yes") : t("admin.common.no")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/users/${u.id}/edit`}
                            className="rounded-full bg-surface-container-highest/70 px-4 py-2 text-xs font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest"
                          >
                            {t("admin.common.edit")}
                          </Link>
                          <button
                            type="button"
                            disabled={busyId === u.id}
                            onClick={async () => {
                              const ok = window.confirm(
                                t("admin.users.deleteConfirm", { id: u.id })
                              );
                              if (!ok) return;
                              setBusyId(u.id);
                              setError(null);
                              try {
                                await adminService.deleteUser(u.id);
                                await reload();
                              } catch {
                                setError(t("admin.errors.failedToDeleteUser"));
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="rounded-full bg-error-container/20 px-4 py-2 text-xs font-semibold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/30 disabled:opacity-60"
                          >
                            {busyId === u.id ? t("admin.common.deleting") : t("admin.common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-on-surface-variant" colSpan={7}>
                      {t("admin.users.noUsersMatch")}
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td className="px-4 py-6 text-on-surface-variant" colSpan={7}>
                    {t("admin.common.loading")}
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
