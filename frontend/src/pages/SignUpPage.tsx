import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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

const footerLinks = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "mailto:studybee@mindworkers.tn" },
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
      nextErrors.firstName = "First name must contain letters only.";
    }
    if (!trimmedLastName || !NAME_REGEX.test(trimmedLastName)) {
      nextErrors.lastName = "Last name must contain letters only.";
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = "Invalid email (e.g. name@domain.tld).";
    }
    if (!isValidDateIso(dateOfBirth)) {
      nextErrors.dateOfBirth = "Invalid date of birth.";
    }

    if (!studyLevel) {
      nextErrors.studyLevel = "Choose Secondary or University.";
    }

    if (!classLevel || !classLevelOptions.includes(classLevel as never)) {
      nextErrors.classLevel = "Choose a level from the list.";
    }
    if (!trimmedParentPhone || !PARENT_PHONE_REGEX.test(trimmedParentPhone)) {
      nextErrors.parentPhone = "Phone must start with +216 and contain 8 digits.";
    }
    if (!trimmedSpeciality) {
      nextErrors.speciality = "Specialty is required.";
    }

    if (password !== passwordConfirm) {
      nextErrors.passwordConfirm = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitStatus("error");
      setSubmitMessage("Fix the highlighted fields and try again.");
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
        typeof result?.message === "string" ? result.message : "User created successfully."
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
        setSubmitMessage(lines.length > 0 ? lines.join("\n") : "Sign up failed.");
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
            : "Sign up failed. Check the fields and try again.")
      );
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-body text-on-background">
      <AmbientOrbs className="opacity-75" />
      <main className="relative flex flex-grow items-center justify-center px-6 pb-12 pt-24">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Illustration / text */}
          <div className="hidden space-y-8 pr-12 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-tertiary">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              Join the Future
            </div>
            <h1 className="font-headline text-6xl font-extrabold leading-[1.1] tracking-tight text-on-background xl:text-7xl">
              Design your <span className="text-primary">academic</span> flow.
            </h1>
            <p className="max-w-md text-xl leading-relaxed text-on-surface-variant">
              The only study platform that adapts to your psychological state and learning style.
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
                Join the Hive
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
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.firstName ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.firstName}</p>
                  ) : null}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.lastName ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.lastName}</p>
                  ) : null}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">University Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@university.edu"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.email ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.email}</p>
                  ) : null}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Date of Birth</label>
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
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Study Level</label>
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
                    <option value="">Select...</option>
                    <option value="secondary">Secondary</option>
                    <option value="university">University</option>
                  </select>
                  {fieldErrors.studyLevel ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.studyLevel}</p>
                  ) : null}
                </div>

                {/* Class Level */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Class Level</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    disabled={classLevelDisabled}
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                    required
                  >
                    <option value="">
                      {classLevelDisabled
                        ? "Pick Secondary or University first"
                        : "Select..."}
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
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Specialty</label>
                  <input
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    placeholder="IT, Math,Finance ..."
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                  {fieldErrors.speciality ? (
                    <p className="text-sm font-semibold text-on-error-container">{fieldErrors.speciality}</p>
                  ) : null}
                </div>

                {/* Parent Email */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Parent Email</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full rounded-md border-none bg-surface-container-highest py-3 px-4 text-on-background placeholder:text-outline/60 focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>

                {/* Parent Phone */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Parent Phone</label>
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
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Password</label>
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
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="font-label block text-xs uppercase tracking-widest text-outline">Confirm Password</label>
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
                    {submitStatus === "loading" ? "Creating account..." : "Sign Up"}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-on-surface-variant">
                Already have an account?{" "}
                <Link to="/sign-in" className="font-bold text-primary underline">
                  Sign in
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
              Turning Study Time into Prime Time
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
            © 2026 StudyBee Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
