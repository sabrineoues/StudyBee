import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import i18n from "../i18n";

import { MarketingFooter } from "../components/MarketingFooter";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { profileService } from "../services/profileService";
import { userService } from "../services/userService";

type FieldErrorMap = Partial<
  Record<
    | "email"
    | "username"
    | "first_name"
    | "last_name"
    | "date_of_birth"
    | "class_level"
    | "speciality"
    | "parent_email"
    | "parent_phone",
    string
  >
>;

function fieldClass(hasError?: boolean) {
  return [
    "w-full rounded-3xl border bg-surface-container-highest/70 px-5 py-4 font-body text-on-surface shadow-sm outline-none transition-all placeholder:text-outline/70",
    "focus-visible:ring-4",
    hasError
      ? "border-error/60 focus-visible:border-error focus-visible:ring-error/15"
      : "border-outline-variant/20 focus-visible:border-primary/40 focus-visible:ring-primary/12",
  ].join(" ");
}

function softCardClass() {
  return "rounded-3xl bg-surface-container-low/90 ring-1 ring-outline-variant/12 shadow-sm backdrop-blur-md";
}

function chipClass() {
  return "inline-flex items-center gap-2 rounded-full bg-surface-container-highest/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant ring-1 ring-outline-variant/10";
}

function formatDrfError(data: unknown): string {
  if (!data) return i18n.t("profile.errors.saveFailedGeneric");
  if (typeof data === "string") return data;
  if (typeof data !== "object") return i18n.t("profile.errors.saveFailedGeneric");

  const obj = data as Record<string, unknown>;
  const detail = obj.detail;
  if (typeof detail === "string" && detail.trim()) return detail;

  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      lines.push(`${key}: ${value}`);
      continue;
    }
    if (Array.isArray(value)) {
      const msgs = value.filter((v) => typeof v === "string").join(" ");
      if (msgs) lines.push(`${key}: ${msgs}`);
    }
  }

  return lines.length ? lines.join("\n") : i18n.t("profile.errors.saveFailedGeneric");
}

function extractFieldErrors(data: unknown): FieldErrorMap {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  const out: FieldErrorMap = {};

  const keys: (keyof FieldErrorMap)[] = [
    "email",
    "username",
    "first_name",
    "last_name",
    "date_of_birth",
    "class_level",
    "speciality",
    "parent_email",
    "parent_phone",
  ];

  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value)) {
      const msg = value.filter((v) => typeof v === "string").join(" ");
      if (msg) out[key] = msg;
    }
  }

  return out;
}

function capitalizeFirst(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1);
}

function InputField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="ml-1 block text-[0.75rem] font-bold uppercase tracking-[0.22em] text-on-surface-variant"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass(!!error)}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="px-1 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-highest/45 px-4 py-4 ring-1 ring-outline-variant/10">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
        {label}
      </div>
      <div className="mt-2 break-all text-sm font-semibold text-on-surface">
        {value || "—"}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const errorRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      setFieldErrors({});
      try {
        const me = await profileService.getMe();
        if (!alive) return;
        setEmail(me.email ?? "");
        setUsername(me.username ?? "");
        setFirstName(me.first_name ?? "");
        setLastName(me.last_name ?? "");
        setAvatarUrl(me.avatar_url ?? null);
        setDateOfBirth(me.date_of_birth ?? "");
        setClassLevel(me.class_level ?? "");
        setSpeciality(me.speciality ?? "");
        setParentEmail(me.parent_email ?? "");
        setParentPhone(me.parent_phone ?? "");
      } catch (err) {
        if (!alive) return;
        const maybeAny = err as { response?: { status?: number } };
        const status = maybeAny?.response?.status;
        if (status === 401) setError(t("profile.errors.sessionExpired"));
        else setError(t("profile.errors.failedToLoad"));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [t]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const displayName = useMemo(() => {
    const full = `${capitalizeFirst(firstName)} ${capitalizeFirst(lastName)}`.trim();
    return full || username || t("profile.misc.studentProfileFallback");
  }, [firstName, lastName, username, t]);

  function submitProfileForm() {
    const form = document.getElementById("profile-form") as HTMLFormElement | null;
    if (!form) return;
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
      return;
    }

    const submit = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    ) as HTMLElement | null;
    submit?.click();
  }

  function initials() {
    const a = (firstName || "").trim()[0] ?? "";
    const b = (lastName || "").trim()[0] ?? "";
    return (a + b).toUpperCase() || "U";
  }

  function validate() {
    const nextErrors: FieldErrorMap = {};

    if (!email.trim()) nextErrors.email = t("profile.validation.emailRequired");
    if (!username.trim()) nextErrors.username = t("profile.validation.usernameRequired");
    if (!dateOfBirth.trim()) nextErrors.date_of_birth = t("profile.validation.dobRequired");
    if (!classLevel.trim()) nextErrors.class_level = t("profile.validation.classLevelRequired");
    if (!parentEmail.trim()) nextErrors.parent_email = t("profile.validation.parentEmailRequired");
    if (!parentPhone.trim()) nextErrors.parent_phone = t("profile.validation.parentPhoneRequired");

    if (parentPhone.trim() && !/^\+\d{8,15}$/.test(parentPhone.trim())) {
      nextErrors.parent_phone = t("profile.validation.phoneFormat");
    }

    setFieldErrors(nextErrors);

    const orderedKeys: (keyof FieldErrorMap)[] = [
      "email",
      "username",
      "first_name",
      "last_name",
      "date_of_birth",
      "class_level",
      "speciality",
      "parent_email",
      "parent_phone",
    ];

    const firstInvalid = orderedKeys.find((k) => !!nextErrors[k]);
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const el = document.getElementById(String(firstInvalid)) as
          | HTMLInputElement
          | null;
        el?.focus();
      });
    }

    return Object.keys(nextErrors).length === 0;
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      setError(t("profile.errors.correctFields"));
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ block: "start" });
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        email: email.trim(),
        username: username.trim(),
        first_name: capitalizeFirst(firstName),
        last_name: capitalizeFirst(lastName),
        date_of_birth: dateOfBirth.trim(),
        class_level: classLevel.trim(),
        speciality: speciality.trim(),
        parent_email: parentEmail.trim(),
        parent_phone: parentPhone.trim(),
      };

      const updated = await profileService.updateMe(payload);

      if (avatarFile) {
        try {
          const avatarUpdated = await profileService.uploadAvatar(avatarFile);
          setAvatarUrl(
            avatarUpdated.avatar_url
              ? `${avatarUpdated.avatar_url}${avatarUpdated.avatar_url.includes("?") ? "&" : "?"}v=${Date.now()}`
              : null
          );
          setAvatarFile(null);
          setAvatarPreviewUrl(null);
        } catch (err) {
          const maybeAny = err as { response?: { data?: unknown } };
          const data = maybeAny?.response?.data;
          setError(formatDrfError(data));
          setFieldErrors(extractFieldErrors(data));
          return;
        }
      }

      setEmail(updated.email ?? "");
      setUsername(updated.username ?? "");
      setFirstName(updated.first_name ?? "");
      setLastName(updated.last_name ?? "");
      setAvatarUrl(updated.avatar_url ?? avatarUrl ?? null);
      setDateOfBirth(updated.date_of_birth ?? "");
      setClassLevel(updated.class_level ?? "");
      setSpeciality(updated.speciality ?? "");
      setParentEmail(updated.parent_email ?? "");
      setParentPhone(updated.parent_phone ?? "");
      setFieldErrors({});
      setMode("view");
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny?.response?.data;
      setError(formatDrfError(data));
      setFieldErrors(extractFieldErrors(data));
    } finally {
      setSaving(false);
    }
  }

  async function onUploadAvatar() {
    setError(null);
    if (!avatarFile) {
      setError(t("profile.errors.selectImageFirst"));
      return;
    }

    setAvatarUploading(true);
    try {
      const updated = await profileService.uploadAvatar(avatarFile);
      setAvatarUrl(
        updated.avatar_url
          ? `${updated.avatar_url}${updated.avatar_url.includes("?") ? "&" : "?"}v=${Date.now()}`
          : null
      );
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown } };
      const data = maybeAny?.response?.data;
      setError(formatDrfError(data));
      setFieldErrors(extractFieldErrors(data));
    } finally {
      setAvatarUploading(false);
    }
  }

  function requestDelete() {
    setError(null);
    setDetailsOpen(true);
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    setError(null);
    setDeleting(true);
    try {
      await profileService.deleteMe();
      userService.signOut();
      navigate("/", { replace: true });
    } catch {
      setError(t("profile.errors.deleteFailed"));
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  }

  function downloadAvatarSrc() {
    return avatarPreviewUrl ?? avatarUrl ?? "";
  }

  useEffect(() => {
    if (mode !== "view") {
      setDetailsOpen(false);
      setConfirmDeleteOpen(false);
    }
  }, [mode]);

  return (
    <StudyBeeShell>
      <main className="relative mx-auto w-full max-w-7xl px-6 pb-24 pt-24 md:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-container/20 blur-3xl" />
          <div className="absolute right-[-6rem] top-28 h-72 w-72 rounded-full bg-secondary-container/18 blur-3xl" />
          <div className="absolute bottom-[-4rem] left-10 h-72 w-72 rounded-full bg-tertiary-container/18 blur-3xl" />
        </div>

        <header className="mb-10 overflow-hidden rounded-3xl bg-surface-container-low/90 ring-1 ring-outline-variant/12 shadow-sm backdrop-blur-md">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface-container-highest/60 ring-4 ring-primary/12">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-2xl font-black text-on-primary font-headline">
                      {initials()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-surface-container-highest/55 px-4 py-2 ring-1 ring-outline-variant/12">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {t("profile.badge")}
                    </span>
                  </div>
                  <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
                    {displayName}
                  </h1>
                  <p className="mt-2 font-body text-sm leading-6 text-on-surface-variant md:text-base">
                    {t("profile.subtitle")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={chipClass()}>{classLevel || t("profile.chipClassLevel")}</span>
                    <span className={chipClass()}>{speciality || t("profile.chipSpeciality")}</span>
                  </div>
                </div>
              </div>

              {loading ? null : mode === "view" ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <button
                    type="button"
                    aria-expanded={detailsOpen}
                    onClick={() => setDetailsOpen((v) => !v)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-surface-container-highest/70 px-5 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    {detailsOpen ? t("profile.actions.hideDetails") : t("profile.actions.details")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteOpen(false);
                      setMode("edit");
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-on-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-95 focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                    {t("profile.actions.editProfile")}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={requestDelete}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-error-container/20 px-6 text-sm font-bold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/30 disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-error/15"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    {deleting ? t("profile.actions.deleting") : t("profile.actions.delete")}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteOpen(false);
                      setMode("view");
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-surface-container-highest/70 px-5 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                    {t("profile.actions.cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    aria-busy={saving}
                    onClick={submitProfileForm}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-on-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    {saving ? t("profile.actions.saving") : t("profile.actions.save")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {error ? (
          <div
            ref={errorRef}
            className="mb-6 rounded-2xl bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container ring-1 ring-outline-variant/10 whitespace-pre-line"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <section className={`${softCardClass()} px-6 py-16 md:px-8`}>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="mt-4 font-body text-on-surface-variant">{t("profile.loadingProfile")}</p>
            </div>
          </section>
        ) : mode === "view" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className={`${softCardClass()} p-6 lg:col-span-4 lg:sticky lg:top-24 lg:self-start lg:p-8`}>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-primary/15">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-xl font-black text-on-primary font-headline">
                      {initials()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                    {displayName}
                  </div>
                  <div className="mt-1 break-all font-body text-sm text-on-surface-variant">
                    {email || t("profile.noEmailProvided")}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-surface-container-highest/40 p-4 ring-1 ring-outline-variant/10">
                  <div className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("profile.sections.education")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={chipClass()}>{classLevel || t("profile.chipClassLevel")}</span>
                    <span className={chipClass()}>{speciality || t("profile.chipSpeciality")}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-surface-container-highest/40 p-4 ring-1 ring-outline-variant/10">
                  <div className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("profile.sections.account")}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 font-body text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">cake</span>
                        {t("profile.sections.birthday")}
                      </span>
                      <span className="font-body text-sm font-semibold text-on-surface">
                        {dateOfBirth || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-expanded={detailsOpen}
                  onClick={() => setDetailsOpen(true)}
                  className="rounded-2xl bg-surface-container-highest/40 p-4 text-left ring-1 ring-outline-variant/10 transition-colors hover:bg-surface-container-highest/55 focus-visible:ring-4 focus-visible:ring-primary/15"
                >
                  <div className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {t("profile.sections.details")}
                  </div>
                  <div className="mt-2 font-body text-sm font-semibold text-on-surface">
                    {detailsOpen ? t("profile.sections.detailsVisible") : t("profile.sections.showAllFields")}
                  </div>
                  <div className="mt-1 font-body text-sm text-on-surface-variant">
                    {t("profile.sections.detailsHint")}
                  </div>
                </button>
              </div>
            </section>

            <section className={`${softCardClass()} p-6 lg:col-span-8 lg:p-8`}>
              {!detailsOpen ? (
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                      {t("profile.sections.detailsHiddenTitle")}
                    </h2>
                    <p className="mt-2 font-body text-sm text-on-surface-variant">
                      {t("profile.sections.detailsHiddenText")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className="rounded-full bg-surface-container-highest/70 px-6 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-highest focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    {t("profile.sections.showDetails")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                        {t("profile.sections.details")}
                      </h2>
                      <p className="mt-2 font-body text-sm text-on-surface-variant">
                        {t("profile.sections.detailsSubtitle")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteOpen(false);
                        setDetailsOpen(false);
                      }}
                      className="rounded-full bg-surface-container-highest/70 px-6 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-highest focus-visible:ring-4 focus-visible:ring-primary/15"
                    >
                      {t("profile.sections.hide")}
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoRow label={t("profile.fields.email")} value={email} />
                    <InfoRow label={t("profile.fields.username")} value={username} />
                    <InfoRow label={t("profile.fields.firstName")} value={capitalizeFirst(firstName)} />
                    <InfoRow label={t("profile.fields.lastName")} value={capitalizeFirst(lastName)} />
                    <InfoRow label={t("profile.fields.dateOfBirth")} value={dateOfBirth} />
                    <InfoRow label={t("profile.fields.classLevel")} value={classLevel} />
                    <InfoRow label={t("profile.fields.speciality")} value={speciality} />
                    <InfoRow label={t("profile.fields.parentEmail")} value={parentEmail} />
                    <InfoRow label={t("profile.fields.parentPhone")} value={parentPhone} />
                  </div>

                  {confirmDeleteOpen ? (
                    <div className="mt-8 rounded-3xl bg-error-container/12 p-6 ring-1 ring-outline-variant/10">
                      <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-error-container">
                        {t("profile.deleteConfirm.title")}
                      </h3>
                      <p className="mt-2 font-body text-sm leading-6 text-on-error-container/90">
                        <Trans
                          i18nKey="profile.deleteConfirm.text"
                          values={{ identity: email || username || "" }}
                          components={{ strong: <span className="font-semibold" /> }}
                        />
                      </p>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setConfirmDeleteOpen(false)}
                          className="rounded-full bg-surface-container-highest/70 px-6 py-3 text-sm font-semibold text-on-surface ring-1 ring-outline-variant/10 hover:bg-surface-container-highest disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-primary/15"
                        >
                          {t("profile.actions.cancel")}
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => void confirmDelete()}
                          className="rounded-full bg-error-container/35 px-8 py-3 text-sm font-bold text-on-error-container ring-1 ring-outline-variant/10 transition-colors hover:bg-error-container/45 disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-error/15"
                        >
                          {deleting ? t("profile.actions.deleting") : t("profile.deleteConfirm.yesDelete")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        ) : (
          <form id="profile-form" className="space-y-6" onSubmit={onSave}>
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
            <section className={`${softCardClass()} p-6 md:p-8`}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-primary/15">
                    {downloadAvatarSrc() ? (
                      <img
                        src={downloadAvatarSrc()}
                        alt={t("profile.edit.profilePreviewAlt")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-xl font-black text-on-primary font-headline">
                        {initials()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                      {t("profile.edit.profilePhotoTitle")}
                    </h2>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {t("profile.edit.profilePhotoHint")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-full file:border-0 file:bg-surface-container-highest/70 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-on-surface file:ring-1 file:ring-outline-variant/10 hover:file:bg-surface-container-highest"
                  />
                  <button
                    type="button"
                    disabled={!avatarFile || avatarUploading}
                    onClick={() => void onUploadAvatar()}
                    aria-busy={avatarUploading}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    {avatarUploading ? t("profile.edit.uploading") : t("profile.edit.upload")}
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className={`${softCardClass()} p-6 lg:col-span-6 lg:p-8`}>
                <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                  {t("profile.edit.accountTitle")}
                </h3>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  {t("profile.edit.accountHint")}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    id="email"
                    label={t("profile.fields.email")}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={fieldErrors.email}
                  />
                  <InputField
                    id="username"
                    label={t("profile.fields.username")}
                    value={username}
                    onChange={setUsername}
                    error={fieldErrors.username}
                  />
                </div>
              </section>

              <section className={`${softCardClass()} p-6 lg:col-span-6 lg:p-8`}>
                <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                  {t("profile.edit.personalTitle")}
                </h3>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  {t("profile.edit.personalHint")}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    id="first_name"
                    label={t("profile.fields.firstName")}
                    value={firstName}
                    onChange={setFirstName}
                    error={fieldErrors.first_name}
                  />
                  <InputField
                    id="last_name"
                    label={t("profile.fields.lastName")}
                    value={lastName}
                    onChange={setLastName}
                    error={fieldErrors.last_name}
                  />
                </div>
                <div className="mt-4">
                  <InputField
                    id="date_of_birth"
                    label={t("profile.fields.dateOfBirth")}
                    type="date"
                    value={dateOfBirth}
                    onChange={setDateOfBirth}
                    error={fieldErrors.date_of_birth}
                  />
                </div>
              </section>

              <section className={`${softCardClass()} p-6 lg:col-span-6 lg:p-8`}>
                <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                  {t("profile.edit.schoolTitle")}
                </h3>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  {t("profile.edit.schoolHint")}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    id="class_level"
                    label={t("profile.fields.classLevel")}
                    value={classLevel}
                    onChange={setClassLevel}
                    error={fieldErrors.class_level}
                  />
                  <InputField
                    id="speciality"
                    label={t("profile.fields.speciality")}
                    value={speciality}
                    onChange={setSpeciality}
                    error={fieldErrors.speciality}
                  />
                </div>
              </section>

              <section className={`${softCardClass()} p-6 lg:col-span-6 lg:p-8`}>
                <h3 className="font-headline text-xl font-extrabold tracking-tight text-on-surface">
                  {t("profile.edit.parentTitle")}
                </h3>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  {t("profile.edit.parentHint")}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    id="parent_email"
                    label={t("profile.fields.parentEmail")}
                    type="email"
                    value={parentEmail}
                    onChange={setParentEmail}
                    error={fieldErrors.parent_email}
                  />
                  <InputField
                    id="parent_phone"
                    label={t("profile.fields.parentPhone")}
                    value={parentPhone}
                    onChange={setParentPhone}
                    placeholder={t("profile.edit.phonePlaceholder")}
                    error={fieldErrors.parent_phone}
                  />
                </div>
              </section>
            </div>

          </form>
        )}
      </main>

      <MarketingFooter />
    </StudyBeeShell>
  );
}
