import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { adminService, type AdminUser } from "../../services/adminService";
import {
  studysessionsService,
  type AdminStudySession,
} from "../../services/studysessionsService";

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
      <div>
        <h2 className="font-headline text-lg font-extrabold tracking-tight text-on-surface">{title}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      </div>
      <div className="mt-6">
        <DonutChart segments={segments} centerLabel={centerLabel} centerValue={centerValue} />
      </div>
    </div>
  );
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function AdminStatsPage() {
  const { t } = useTranslation();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [sessions, setSessions] = useState<AdminStudySession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setError(null);
      try {
        const [u, s] = await Promise.all([
          adminService.listUsers(),
          studysessionsService.listAllAdmin(),
        ]);
        if (!alive) return;
        setUsers(u);
        setSessions(s);
      } catch {
        if (!alive) return;
        setError(t("admin.errors.failedToLoadStats"));
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  const derived = useMemo(() => {
    const now = new Date();

    const sourceUsers = users ?? [];
    const sourceSessions = sessions ?? [];

    let usersActive = 0;
    let usersInactive = 0;
    let usersStaff = 0;
    let usersSuper = 0;

    for (const u of sourceUsers) {
      if (u.is_active) usersActive += 1;
      else usersInactive += 1;
      if (u.is_staff) usersStaff += 1;
      if (u.is_superuser) usersSuper += 1;
    }

    let sessionsInProgress = 0;
    let sessionsCompleted = 0;
    let sessionsToday = 0;

    for (const s of sourceSessions) {
      if (s.status === "completed") sessionsCompleted += 1;
      else if (s.status === "in_progress") sessionsInProgress += 1;

      const created = new Date(s.created_at);
      if (!Number.isNaN(created.getTime()) && isSameDay(created, now)) sessionsToday += 1;
    }

    const usersRegular = Math.max(sourceUsers.length - usersStaff, 0);
    const usersStaffNonSuper = Math.max(usersStaff - usersSuper, 0);

    const latestUsers = [...sourceUsers]
      .sort((a, b) => new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime())
      .slice(0, 5);
    const latestSessions = [...sourceSessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return {
      users: {
        total: sourceUsers.length,
        active: usersActive,
        inactive: usersInactive,
        staff: usersStaff,
        superusers: usersSuper,
        staffNonSuper: usersStaffNonSuper,
        regular: usersRegular,
        latest: latestUsers,
      },
      sessions: {
        total: sourceSessions.length,
        inProgress: sessionsInProgress,
        completed: sessionsCompleted,
        today: sessionsToday,
        latest: latestSessions,
      },
      ready: Boolean(users && sessions),
    };
  }, [sessions, users]);

  return (
    <main className="min-w-0">
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant ring-1 ring-outline-variant/10">
          {t("admin.common.dashboardChip")}
        </div>
        <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
          {t("admin.stats.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">
          {t("admin.common.overview")}
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      ) : null}

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("admin.layout.userManagement")}
              </div>
              <div className="mt-2 font-headline text-4xl font-black tracking-tight text-on-surface">
                {derived.ready ? String(derived.users.total) : "…"}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.stats.active")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.users.active) : "…"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.stats.inactive")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.users.inactive) : "…"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.stats.staff")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.users.staff) : "…"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.stats.superusers")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.users.superusers) : "…"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("admin.layout.sessions")}
              </div>
              <div className="mt-2 font-headline text-4xl font-black tracking-tight text-on-surface">
                {derived.ready ? String(derived.sessions.total) : "…"}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.general.inProgress")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.sessions.inProgress) : "…"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.general.completed")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.sessions.completed) : "…"}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("admin.general.today")}
                  </div>
                  <div className="mt-1 font-bold text-on-surface">
                    {derived.ready ? String(derived.sessions.today) : "…"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-outline-variant/10">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {t("admin.layout.journals")}
              </div>
              <div className="mt-3 text-sm font-semibold text-on-surface-variant">
                {t("admin.general.comingSoon")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-6">
          <DonutCard
            title={t("admin.stats.rolesTitle")}
            subtitle={t("admin.stats.rolesSubtitle")}
            centerLabel={t("admin.common.total")}
            centerValue={derived.ready ? String(derived.users.total) : "…"}
            segments={[
              {
                label: t("admin.stats.superusers"),
                value: derived.users.superusers,
                className: "text-primary",
              },
              {
                label: t("admin.stats.staff"),
                value: derived.users.staffNonSuper,
                className: "text-tertiary",
              },
              {
                label: t("admin.stats.regular"),
                value: derived.users.regular,
                className: "text-on-surface-variant",
              },
            ]}
          />
        </div>

        <div className="md:col-span-6">
          <DonutCard
            title={t("admin.general.sessionsStatusTitle")}
            subtitle={t("admin.general.sessionsStatusSubtitle")}
            centerLabel={t("admin.common.total")}
            centerValue={derived.ready ? String(derived.sessions.total) : "…"}
            segments={[
              {
                label: t("admin.general.completed"),
                value: derived.sessions.completed,
                className: "text-primary",
              },
              {
                label: t("admin.general.inProgress"),
                value: derived.sessions.inProgress,
                className: "text-tertiary",
              },
            ]}
          />
        </div>
      </section>

    </main>
  );
}
