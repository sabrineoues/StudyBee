import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { userService } from "../services/userService";

const NAME_REGEX = /^[A-Za-zÀ-ÿ\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PARENT_PHONE_REGEX = /^\+216\d{8}$/;

const SECONDARY_CLASS_LEVELS = ["1st year", "2nd year", "3rd year", "4th year"] as const;
const UNIVERSITY_CLASS_LEVELS = [
  "1st year university",
  "2nd year university",
  "3rd year university",
  "4th year university",
  "5th year university",
  "1st master",
  "2nd master",
] as const;

function isValidDateIso(dateIso: string): boolean {
  if (!dateIso) return false;
  const parts = dateIso.split("-").map((x) => Number(x));
  if (parts.length !== 3) return false;
  const [year, month, day] = parts;
  if (!year || !month || !day) return false;

  const dob = new Date(year, month - 1, day);
  if (Number.isNaN(dob.getTime())) return false;

  return (
    dob.getFullYear() === year &&
    dob.getMonth() === month - 1 &&
    dob.getDate() === day
  );
}

export function SignUpPage() {
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<
    "firstName" | "lastName" | "email" | "passwordConfirm" | "dateOfBirth" | "studyLevel" | "classLevel" | "parentPhone" | "speciality",
    string
  >>>({});

  // State for all required fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [studyLevel, setStudyLevel] = useState<"" | "secondary" | "university">("");
  const [classLevel, setClassLevel] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const classLevelOptions =
    studyLevel === "secondary"
      ? [...SECONDARY_CLASS_LEVELS]
      : studyLevel === "university"
        ? [...UNIVERSITY_CLASS_LEVELS]
        : [];
  const classLevelDisabled = classLevelOptions.length === 0;

  const footerLinks = [
    { label: t("marketingFooter.features"), href: "/#features" },
    { label: t("marketingFooter.about"), href: "/#about" },
    { label: t("marketingFooter.contact"), href: "mailto:studybee@mindworkers.tn" },
  ] as const;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    setSubmitStatus("loading");
    setSubmitMessage(null);
    setFieldErrors({});

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedParentPhone = parentPhone.trim();
    const trimmedSpeciality = speciality.trim();

    const nextErrors: typeof fieldErrors = {};
    if (!trimmedFirstName || !NAME_REGEX.test(trimmedFirstName)) {
      nextErrors.firstName = t("signUp.errors.firstNameLetters");
    }
    if (!trimmedLastName || !NAME_REGEX.test(trimmedLastName)) {
      nextErrors.lastName = t("signUp.errors.lastNameLetters");
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = t("signUp.errors.invalidEmail");
    }
    if (!isValidDateIso(dateOfBirth)) {
      nextErrors.dateOfBirth = t("signUp.errors.invalidDob");
    }

    if (!studyLevel) {
      nextErrors.studyLevel = t("signUp.errors.chooseStudyLevel");
    }

    if (!classLevel || !classLevelOptions.includes(classLevel as never)) {
      nextErrors.classLevel = t("signUp.errors.chooseClassLevel");
    }
    if (!trimmedParentPhone || !PARENT_PHONE_REGEX.test(trimmedParentPhone)) {
      nextErrors.parentPhone = t("signUp.errors.invalidParentPhone");
    }
    if (!trimmedSpeciality) {
      nextErrors.speciality = t("signUp.errors.specialityRequired");
    }

    if (password !== passwordConfirm) {
      nextErrors.passwordConfirm = t("signUp.errors.passwordsMismatch");
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitStatus("error");
      setSubmitMessage(t("signUp.messages.fixFields"));
      return;
    }

    // Prepare payload for the API
    const payload = {
      username: trimmedEmail,
      email: trimmedEmail,
      password,
      password_confirm: passwordConfirm,

      study_level: studyLevel || undefined,

      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      date_of_birth: dateOfBirth,
      class_level: classLevel,
      speciality: trimmedSpeciality,
      parent_email: parentEmail,
      parent_phone: trimmedParentPhone,
    };

    try {
      const result = await userService.signUp(payload);
      console.log("Sign Up success:", result);
      setSubmitStatus("success");
      setSubmitMessage(
        typeof result?.message === "string" ? result.message : t("signUp.messages.created")
      );
    } catch (err) {
      console.error("Sign Up failed:", err);
      const maybeAny = err as {
        response?: { data?: unknown };
        message?: unknown;
      };

      const data = maybeAny?.response?.data;
      const fieldErrorPayload =
        data && typeof data === "object" && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : null;

      if (fieldErrorPayload) {
        const nextErrors: typeof fieldErrors = {};

        const pickMsg = (v: unknown) => {
          if (typeof v === "string") return v;
          if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join(" ");
          return null;
        };

        const map: Record<string, keyof typeof nextErrors> = {
          first_name: "firstName",
          last_name: "lastName",
          email: "email",
          date_of_birth: "dateOfBirth",
          study_level: "studyLevel",
          class_level: "classLevel",
          parent_phone: "parentPhone",
          speciality: "speciality",
          password_confirm: "passwordConfirm",
        };

        const lines: string[] = [];
        for (const [k, v] of Object.entries(fieldErrorPayload)) {
          const msg = pickMsg(v);
          if (!msg) continue;
          lines.push(`${k}: ${msg}`);

          const mapped = map[k];
          if (mapped) {
            nextErrors[mapped] = msg;
          }
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
        }

        setSubmitStatus("error");
        setSubmitMessage(lines.length > 0 ? lines.join("\n") : t("signUp.messages.failed"));
        return;
      }

      const msgFromApi =
        typeof data === "string"
          ? data
          : typeof (data as { detail?: unknown } | undefined)?.detail === "string"
            ? (data as { detail: string }).detail
            : null;

      setSubmitStatus("error");
      setSubmitMessage(
        msgFromApi ??
          (typeof maybeAny?.message === "string"
            ? maybeAny.message
            : t("signUp.messages.failedGeneric"))
      );
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-body text-on-background">
      <AmbientOrbs className="opacity-75" />
      <main className="relative flex flex-grow items-start justify-center px-6 pb-12 pt-24">
        <div className="grid w-full max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-2">
          {/* Illustration / text */}
          <div className="space-y-8 text-center lg:mt-10 lg:pr-12 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-tertiary">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              {t("signUp.badge")}
            </div>
            <h1 className="font-headline text-5xl font-extrabold leading-[1.1] tracking-tight text-on-background sm:text-6xl xl:text-7xl">
              {t("signUp.heroTitlePrefix")} <span className="text-primary">{t("signUp.heroTitleHighlight")}</span> {t("signUp.heroTitleSuffix")}
            </h1>
            <p className="mx-auto max-w-md text-lg leading-relaxed text-on-surface-variant sm:text-xl lg:mx-0">
              {t("signUp.heroText")}
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
              className="card-shine rounded-xl bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(55,45,37,0.06)] ring-1 ring-white/35 md:p-10"
            >
              <h2 className="font-headline mb-6 text-3xl font-extrabold tracking-tight text-on-background lg:hidden">
                {t("signUp.mobileTitle")}
              </h2>

              <form className="space-y-4" onSubmit={onSubmit}>
                {submitMessage ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className={
                      submitStatus === "success"
                        ? "rounded-md bg-secondary-container px-4 py-3 text-sm font-semibold text-on-secondary-container"
                        : "rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container whitespace-pre-line"
                    }
                  >
                    {submitMessage}
                  </div>
                ) : null}

                {/* First Name */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.firstName")}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t("signUp.firstNamePlaceholder")}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.firstName ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.firstName}</p>
                  ) : null}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.lastName")}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t("signUp.lastNamePlaceholder")}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.lastName ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.lastName}</p>
                  ) : null}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("signUp.emailPlaceholder")}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.email ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.email}</p>
                  ) : null}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.dateOfBirth")}</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.dateOfBirth ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.dateOfBirth}</p>
                  ) : null}
                </div>

                {/* Study Level */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.studyLevel")}</label>
                  <select
                    value={studyLevel}
                    onChange={(e) => {
                      const next = e.target.value as "" | "secondary" | "university";
                      setStudyLevel(next);

                      const nextOptions =
                        next === "secondary"
                          ? [...SECONDARY_CLASS_LEVELS]
                          : next === "university"
                            ? [...UNIVERSITY_CLASS_LEVELS]
                            : [];

                      if (classLevel && !nextOptions.includes(classLevel as never)) {
                        setClassLevel("");
                      }
                    }}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background focus:ring-2 focus:ring-primary/40"
                    required
                  >
                    <option value="">{t("signUp.select")}</option>
                    <option value="secondary">{t("signUp.secondary")}</option>
                    <option value="university">{t("signUp.university")}</option>
                  </select>
                  {fieldErrors.studyLevel ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.studyLevel}</p>
                  ) : null}
                </div>

                {/* Class Level */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.classLevel")}</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    disabled={classLevelDisabled}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                    required
                  >
                    <option value="">
                      {classLevelDisabled
                        ? t("signUp.pickStudyLevelFirst")
                        : t("signUp.select")}
                    </option>
                    {classLevelOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.classLevel ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.classLevel}</p>
                  ) : null}
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.speciality")}</label>
                  <input
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder={t("signUp.specialityPlaceholder")}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.speciality ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.speciality}</p>
                  ) : null}
                </div>

                {/* Parent Email */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.parentEmail")}</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder={t("signUp.parentEmailPlaceholder")}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.parentPhone")}</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+21600000000"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.parentPhone ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.parentPhone}</p>
                  ) : null}
                </div>

                {/* Password */}
                <div className="space-y-2 relative">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.password")}</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
                  >
                    {showPw ? t("signUp.hide") : t("signUp.show")}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">{t("signUp.confirmPassword")}</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.passwordConfirm ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.passwordConfirm}</p>
                  ) : null}
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitStatus === "loading"}
                    className="w-full rounded-full bg-gradient-primary py-3 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    {submitStatus === "loading" ? t("signUp.creating") : t("signUp.submit")}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-on-surface-variant">
                {t("signUp.alreadyHaveAccount")} {" "}
                <Link to="/sign-in" className="font-bold text-primary underline">
                  {t("signUp.signIn")}
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="mt-8 bg-surface-container-low px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-12 md:grid-cols-3">
          <div className="col-span-2">
            <h3 className="mb-6 text-2xl font-black tracking-tighter text-primary">StudyBee</h3>
            <p className="max-w-sm text-on-surface-variant">
              {t("marketingFooter.tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-label mb-6 text-[0.75rem] font-bold uppercase tracking-widest">App</h4>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              {footerLinks.map((item) => (
                <li key={item.label}>
                  <a className="transition-colors hover:text-primary" href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center gap-6 border-t border-outline-variant/15 pt-10 md:flex-row md:justify-between">
          <p className="text-[0.75rem] opacity-60 text-on-surface-variant">
            {t("marketingFooter.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
