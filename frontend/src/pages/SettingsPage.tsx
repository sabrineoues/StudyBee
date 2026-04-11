import { StudyBeeShell } from "../components/StudyBeeShell";
import { MarketingFooter } from "../components/MarketingFooter";
import { useEffect, useMemo, useState } from "react";
import { profileService, type StudentProfileMe } from "../services/profileService";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { normalizeLanguage, storeLanguage, type LanguageCode } from "../i18n/language";

const FLAG_EN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA7CA6jr2dtq6NjgNy7IwGwt6BoyNFt9w33lFkXuI91BNlqnEivew2ueqQ3xv7O2lKwZLuowd4N2ABS8bQ4Nae9XCPudhWQe18n1gRpRPZfTdxxsxbyjlzMwhIMC86nHI7dclrawRnzz8cB7mRmkKOxd26sNehQkUf7yL5YGiauvnrRek_2Jn9T4Z4Ix-6NAUwpHXoPSm6FeZs633GknBNy2EoZMMyPJr6__gzStJczzTA9SfrifoV66xlgCh15CbfkMOrPOx40OTE";
const FLAG_FR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCWMonCgOM0VdNdXkgcO8MAMKyTi1UDNYADm4ME8B2dZyEj_CKWjvboW6PH_MT3Hs4YWQQnahOnnFAftx3V2o-jhC5yVihciW9HfGep71UE3Cw90YWAI1DY4les8VqbFw70myAv0n_juc7Bx707qyBrVgrfhmbbYBmIplEuBclY71ZxhiG_oH68MvgURa5pvd-4ZuJl7uzrMG5zN7uDaYTbiKtzvNRJPATAtwP2MmCsQOFxdZvmBK2VL7TopizWGhFEeKluIwriIe0";

async function requestDeviceAccess(kind: "camera" | "microphone"): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      kind === "camera" ? { video: true, audio: false } : { video: false, audio: true },
    );
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

async function getPermissionState(kind: "camera" | "microphone"): Promise<"granted" | "denied" | "prompt" | null> {
  const permissions = (typeof navigator !== "undefined" ? (navigator as unknown as { permissions?: any }).permissions : null) as
    | { query?: (desc: any) => Promise<{ state: "granted" | "denied" | "prompt" }> }
    | null;
  if (!permissions?.query) return null;

  try {
    const res = await permissions.query({ name: kind } as any);
    return res.state;
  } catch {
    return null;
  }
}

export function SettingsPage() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<StudentProfileMe | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingLanguage, setSavingLanguage] = useState<LanguageCode | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);

  const [cameraAccess, setCameraAccess] = useState(false);
  const [micAccess, setMicAccess] = useState(false);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);

  const canRequestMedia = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    let alive = true;
    if (!canRequestMedia) return;
    if (loadingProfile) return;
    if (!profile) return;

    void (async () => {
      const [cam, mic] = await Promise.all([getPermissionState("camera"), getPermissionState("microphone")]);
      if (!alive) return;

      if (cameraAccess && cam && cam !== "granted") {
        setCameraAccess(false);
        try {
          const updated = await profileService.updateMe({ camera_access_enabled: false });
          setProfile(updated);
        } catch {
          // ignore
        }
      }

      if (micAccess && mic && mic !== "granted") {
        setMicAccess(false);
        try {
          const updated = await profileService.updateMe({ microphone_access_enabled: false });
          setProfile(updated);
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [canRequestMedia, loadingProfile, profile, cameraAccess, micAccess]);

  async function toggleDevice(kind: "camera" | "microphone", next: boolean) {
    if (!canRequestMedia) return;

    if (!next) {
      if (kind === "camera") {
        setCameraAccess(false);
        try {
          const updated = await profileService.updateMe({ camera_access_enabled: false });
          setProfile(updated);
        } catch {
          // ignore
        }
      } else {
        setMicAccess(false);
        try {
          const updated = await profileService.updateMe({ microphone_access_enabled: false });
          setProfile(updated);
        } catch {
          // ignore
        }
      }
      return;
    }

    if (kind === "camera") setRequestingCamera(true);
    else setRequestingMic(true);

    try {
      const ok = await requestDeviceAccess(kind);
      if (!ok) {
        if (kind === "camera") setCameraAccess(false);
        else setMicAccess(false);
        return;
      }

      if (kind === "camera") {
        setCameraAccess(true);
        try {
          const updated = await profileService.updateMe({ camera_access_enabled: true });
          setProfile(updated);
        } catch {
          // ignore
        }
      } else {
        setMicAccess(true);
        try {
          const updated = await profileService.updateMe({ microphone_access_enabled: true });
          setProfile(updated);
        } catch {
          // ignore
        }
      }
    } finally {
      if (kind === "camera") setRequestingCamera(false);
      else setRequestingMic(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingProfile(true);
      setLanguageError(null);
      try {
        const me = await profileService.getMe();
        if (!alive) return;
        setProfile(me);
        setCameraAccess(Boolean(me.camera_access_enabled));
        setMicAccess(Boolean(me.microphone_access_enabled));
      } catch {
        if (!alive) return;
        setLanguageError(i18n.t("settings.appLanguage.loadError"));
      } finally {
        if (alive) setLoadingProfile(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const language = useMemo(() => {
    return normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  }, [i18n.resolvedLanguage, i18n.language]);

  const parentDetails = useMemo(() => {
    const email = (profile?.parent_email ?? "").trim();
    const phone = (profile?.parent_phone ?? "").trim();
    const hasParent = Boolean(email || phone);

    const nameFromEmail = (value: string) => {
      const local = value.split("@")[0] ?? "";
      const cleaned = local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
      if (!cleaned) return value;
      return cleaned
        .split(" ")
        .filter(Boolean)
        .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
        .join(" ");
    };

    const displayName = email ? nameFromEmail(email) : t("settings.parentalSharing.parentFallbackName");
    const initials = displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");

    return { email, phone, hasParent, displayName, initials };
  }, [profile?.parent_email, profile?.parent_phone, t]);

  async function setLanguage(next: LanguageCode) {
    if (loadingProfile) return;
    if (next === language) return;
    setLanguageError(null);
    setSavingLanguage(next);
    try {
      await i18n.changeLanguage(next);
      storeLanguage(next);

      // Best-effort sync to the backend profile (do not block UI like the navbar toggle).
      try {
        const updated = await profileService.updateMe({ language: next });
        setProfile(updated);
      } catch {
        // ignore
      }
    } catch {
      // If i18n change fails (rare), show the existing translated error.
      setLanguageError(t("settings.appLanguage.saveError"));
    } finally {
      setSavingLanguage(null);
    }
  }

  return (
    <StudyBeeShell>
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <header className="mb-16">
          <h1 className="font-headline mb-4 text-5xl font-extrabold tracking-tight text-on-surface">
            {t("settings.title")}
          </h1>
          <p className="font-body text-lg text-on-surface-variant">
            {t("settings.subtitle")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="rounded-xl bg-surface-container-low p-8 md:col-span-2">
            <div className="mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined rounded-full bg-primary-container/20 p-3 text-primary">
                language
              </span>
              <div>
                <h2 className="font-headline text-2xl font-bold">
                  {t("settings.appLanguage.title")}
                </h2>
                <p className="font-body text-sm text-on-surface-variant">
                  {t("settings.appLanguage.subtitle")}
                </p>
              </div>
            </div>
            {languageError ? (
              <p className="font-body mb-4 text-sm text-error">{languageError}</p>
            ) : null}
            <div className="flex gap-4">
              <button
                type="button"
                disabled={loadingProfile || savingLanguage !== null}
                onClick={() => void setLanguage("en")}
                aria-pressed={language === "en"}
                className={
                  language === "en"
                    ? "flex flex-1 items-center justify-between rounded-lg border-2 border-primary bg-surface-container-highest p-6 font-bold text-primary transition-all hover:scale-[1.01]"
                    : "flex flex-1 items-center justify-between rounded-lg bg-surface-container-high p-6 font-medium text-on-surface-variant transition-all hover:bg-surface-container-highest"
                }
              >
                <span className="flex items-center gap-3">
                  <img
                    alt="English"
                    className="h-4 w-6 rounded-sm object-cover"
                    src={FLAG_EN}
                  />
                  {t("settings.appLanguage.english")}
                </span>
                <span
                  className={
                    language === "en"
                      ? "material-symbols-outlined"
                      : "material-symbols-outlined opacity-0"
                  }
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </button>
              <button
                type="button"
                disabled={loadingProfile || savingLanguage !== null}
                onClick={() => void setLanguage("fr")}
                aria-pressed={language === "fr"}
                className={
                  language === "fr"
                    ? "flex flex-1 items-center justify-between rounded-lg border-2 border-primary bg-surface-container-highest p-6 font-bold text-primary transition-all hover:scale-[1.01]"
                    : "flex flex-1 items-center justify-between rounded-lg bg-surface-container-high p-6 font-medium text-on-surface-variant transition-all hover:bg-surface-container-highest"
                }
              >
                <span className="flex items-center gap-3">
                  <img
                    alt="French"
                    className="h-4 w-6 rounded-sm object-cover"
                    src={FLAG_FR}
                  />
                  {t("settings.appLanguage.french")}
                </span>
                <span
                  className={
                    language === "fr"
                      ? "material-symbols-outlined"
                      : "material-symbols-outlined opacity-0"
                  }
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </button>
            </div>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-surface-container-low p-8">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <span className="material-symbols-outlined rounded-full bg-primary-container/20 p-3 text-primary">
                  settings_input_antenna
                </span>
                <h2 className="font-headline text-2xl font-bold">
                  {t("settings.deviceAccess.title")}
                </h2>
              </div>
              <p className="font-body mb-8 leading-relaxed text-on-surface-variant">
                {t("settings.deviceAccess.subtitle")}
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  kind: "camera" as const,
                  icon: "videocam",
                  label: t("settings.deviceAccess.camera"),
                  checked: cameraAccess,
                  disabled: !canRequestMedia || requestingCamera,
                },
                {
                  kind: "microphone" as const,
                  icon: "mic",
                  label: t("settings.deviceAccess.microphone"),
                  checked: micAccess,
                  disabled: !canRequestMedia || requestingMic,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-full bg-surface-container-highest p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {row.icon}
                    </span>
                    <span className="font-label text-xs font-bold uppercase tracking-widest">
                      {row.label}
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={row.checked}
                      disabled={row.disabled}
                      onChange={(e) => void toggleDevice(row.kind, e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-outline-variant/30 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-tertiary-container/20 bg-tertiary-container/10 p-8">
            <div className="mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined rounded-full bg-tertiary-container/30 p-3 text-tertiary">
                family_history
              </span>
              <h2 className="font-headline text-2xl font-bold text-tertiary">
                {t("settings.parentalSharing.title")}
              </h2>
            </div>
            <p className="font-body mb-6 leading-relaxed text-on-tertiary-container">
              {t("settings.parentalSharing.subtitle")}
            </p>
            <div className="mb-6 rounded-lg bg-white/40 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest/70 ring-1 ring-outline-variant/10">
                  {parentDetails.hasParent ? (
                    <span className="font-headline text-sm font-extrabold text-on-surface">
                      {parentDetails.initials || "P"}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                      account_circle
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-headline font-bold">
                    {parentDetails.hasParent
                      ? parentDetails.displayName
                      : t("settings.parentalSharing.notLinkedTitle")}
                  </p>
                  {parentDetails.hasParent ? (
                    <p className="font-body text-xs text-on-surface-variant">
                      {parentDetails.email || parentDetails.phone}
                    </p>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant">
                      {t("settings.parentalSharing.notLinkedSubtitle")}
                    </p>
                  )}
                  {parentDetails.hasParent ? (
                    <p className="font-label text-[10px] text-tertiary">
                      {t("settings.parentalSharing.dailyReportActive")}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    {t("settings.parentalSharing.weeklyProgress")}
                  </span>
                  <span className="font-bold text-primary">
                    {t("settings.parentalSharing.shared")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">
                    {t("settings.parentalSharing.focusStreaks")}
                  </span>
                  <span className="font-bold text-primary">
                    {t("settings.parentalSharing.shared")}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-tertiary py-4 font-headline font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              {t("settings.parentalSharing.manage")}
            </button>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-primary p-8 text-white md:col-span-2">
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary-container opacity-40 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-tertiary-container opacity-40 blur-[80px]" />
            <div className="relative z-10">
              <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-headline mb-2 text-3xl font-extrabold">
                    {t("settings.auraFlow.title")}
                  </h2>
                  <p className="font-body max-w-md text-on-primary/80">
                    {t("settings.auraFlow.subtitle")}
                  </p>
                </div>
                <span className="material-symbols-outlined text-4xl">
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <div className="h-3 w-3 rounded-full bg-secondary-container" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    {t("settings.auraFlow.motivated")}
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-primary shadow-lg"
                >
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    {t("settings.auraFlow.calmActive")}
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    {t("settings.auraFlow.tired")}
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <div className="h-3 w-3 rounded-full bg-tertiary-container" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    {t("settings.auraFlow.stressed")}
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 flex flex-col justify-between gap-4 text-on-surface-variant sm:flex-row sm:items-center">
          <button
            type="button"
            className="rounded-full bg-surface-container-highest px-8 py-4 font-headline font-bold text-primary transition-transform hover:scale-105 active:scale-95"
          >
            {t("settings.footer.reset")}
          </button>
          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-primary to-primary-container px-12 py-4 font-headline font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {t("settings.footer.save")}
          </button>
        </footer>
      </main>

      <MarketingFooter />
    </StudyBeeShell>
  );
}
