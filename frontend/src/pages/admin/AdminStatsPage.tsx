import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
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

function formatSpecialityLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return i18n.t("admin.common.unspecified");
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
          <div className="rounded-2xl bg-surface-container-low/80 px-3 py-2 ring-1 ring-outline-variant/12 backdrop-blur-md">
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
                className={[
                  "h-2.5 w-2.5 shrink-0 rounded-full bg-current",
                  s.className,
                ].join(" ")}
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
    <div className="rounded-3xl bg-surface-container-low/90 p-6 shadow-sm ring-1 ring-outline-variant/12 backdrop-blur-md">
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

export function AdminStatsPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await adminService.listUsers();
        if (!alive) return;
        setUsers(list);
      } catch (err) {
        if (!alive) return;
        const maybeAny = err as { response?: { status?: number } };
        const status = maybeAny?.response?.status;
        if (status === 401) setError(t("admin.errors.sessionExpired"));
        else if (status === 403) setError(t("admin.errors.accessDeniedNotStaff"));
        else setError(t("admin.errors.failedToLoadStats"));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const derived = useMemo(() => {
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
      const label = formatSpecialityLabel(rawSpeciality);
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
  }, [users]);

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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DonutCard
          title={t("admin.stats.rolesTitle")}
          subtitle={t("admin.stats.rolesSubtitle")}
          centerLabel={t("admin.common.total")}
          centerValue={derived ? String(derived.total) : "…"}
          segments={[
            {
              label: t("admin.stats.superusers"),
              value: derived?.superusers ?? 0,
              className: "text-primary",
            },
            {
              label: t("admin.stats.staff"),
              value: derived?.staffNonSuper ?? 0,
              className: "text-tertiary",
            },
            {
              label: t("admin.stats.regular"),
              value: derived?.regular ?? 0,
              className: "text-on-surface-variant",
            },
          ]}
        />

        <DonutCard
          title={t("admin.stats.activationTitle")}
          subtitle={t("admin.stats.activationSubtitle")}
          centerLabel={t("admin.common.total")}
          centerValue={derived ? String(derived.total) : "…"}
          segments={[
            {
              label: t("admin.stats.active"),
              value: derived?.active ?? 0,
              className: "text-primary",
            },
            {
              label: t("admin.stats.inactive"),
              value: derived?.inactive ?? 0,
              className: "text-tertiary",
            },
          ]}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DonutCard
          title={t("admin.stats.ageTitle")}
          subtitle={t("admin.stats.ageSubtitle")}
          centerLabel={t("admin.common.total")}
          centerValue={derived ? String(derived.total) : "…"}
          segments={[
            {
              label: "< 18",
              value: derived?.ageBuckets.under18 ?? 0,
              className: "text-primary",
            },
            {
              label: "18–20",
              value: derived?.ageBuckets.from18to20 ?? 0,
              className: "text-tertiary",
            },
            {
              label: "21–23",
              value: derived?.ageBuckets.from21to23 ?? 0,
              className: "text-primary/60",
            },
            {
              label: "24+",
              value: derived?.ageBuckets.from24plus ?? 0,
              className: "text-tertiary/60",
            },
            {
              label: t("admin.common.unknown"),
              value: derived?.ageBuckets.unknown ?? 0,
              className: "text-outline",
            },
          ]}
        />

        <DonutCard
          title={t("admin.stats.specialityTitle")}
          subtitle={t("admin.stats.specialitySubtitle")}
          centerLabel={t("admin.common.total")}
          centerValue={derived ? String(derived.total) : "…"}
          segments={(() => {
            const colors = [
              "text-primary",
              "text-tertiary",
              "text-primary/60",
              "text-tertiary/60",
            ];

            const top = (derived?.topSpecialities ?? []).map((s, idx) => {
              const isNeutral = s.key === "unspecified" || s.key === "other";
              return {
                label: s.label,
                value: s.value,
                className: isNeutral ? "text-outline" : (colors[idx] ?? "text-primary"),
              };
            });

            const other = derived?.otherSpecialitiesValue ?? 0;
            return other > 0
              ? [...top, { label: t("admin.common.other"), value: other, className: "text-outline" }]
              : top;
          })()}
        />
      </section>
    </main>
  );
}
