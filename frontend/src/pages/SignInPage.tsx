import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { SiteFooter } from "../components/SiteFooter";
import { userService } from "../services/userService";

export function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    setSubmitStatus("loading");
    setSubmitMessage(null);

    try {
      const res = await userService.signIn({ email: email.trim(), password });
      const isAdmin = Boolean(res.user?.is_staff || res.user?.is_superuser);
      navigate(isAdmin ? "/admin" : "/journal");
    } catch (err) {
      const maybeAny = err as {
        response?: { data?: unknown; status?: number };
        message?: unknown;
      };

      const data = maybeAny?.response?.data as unknown;
      const msgFromApi =
        typeof data === "string"
          ? data
          : data && typeof data === "object" && !Array.isArray(data) && typeof (data as { detail?: unknown }).detail === "string"
            ? (data as { detail: string }).detail
            : null;

      setSubmitStatus("error");
      setSubmitMessage(
        msgFromApi ??
          (typeof maybeAny?.message === "string" ? maybeAny.message : t("signIn.signInFailed"))
      );
    }
  }

  return (
    <div className="relative min-h-screen bg-background font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <AmbientOrbs className="opacity-80" />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-12 pt-24">

        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="relative hidden pr-12 lg:col-span-7 lg:block">
            <span className="mb-6 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-[0.75rem] font-bold uppercase tracking-widest text-on-secondary-container">
              {t("signIn.badge")}
            </span>
            <h1 className="font-headline mb-8 text-[4rem] font-extrabold leading-[1.1] tracking-tighter text-on-surface">
              {t("signIn.heroTitle1")}
              <br />
              <span className="text-primary italic">{t("signIn.heroTitle2")}</span>
            </h1>
            <p className="font-body mb-12 max-w-lg text-xl leading-relaxed text-on-surface-variant">
              {t("signIn.heroText")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="material-symbols-outlined text-3xl text-primary">
                  psychology
                </span>
                <span className="font-headline font-bold text-on-surface">
                  {t("signIn.feature1Title")}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {t("signIn.feature1Text")}
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="material-symbols-outlined text-3xl text-tertiary">
                  groups
                </span>
                <span className="font-headline font-bold text-on-surface">
                  {t("signIn.feature2Title")}
                </span>
                <span className="text-sm text-on-surface-variant">
                  {t("signIn.feature2Text")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                boxShadow: "0 28px 56px rgba(55,45,37,0.12)",
                y: -4,
              }}
              className="glass-panel card-shine w-full max-w-md rounded-xl border border-outline-variant/15 p-10 shadow-[0_20px_40px_rgba(55,45,37,0.06)] ring-1 ring-white/30"
            >
              <div className="mb-10 text-center lg:text-left">
                <h2 className="font-headline mb-2 text-2xl font-extrabold text-on-surface md:text-3xl">
                  {t("signIn.cardTitle")}
                </h2>
                <p className="text-on-surface-variant">
                  {t("signIn.cardSubtitle")}
                </p>
              </div>

              <div className="relative mb-8 text-center">
                <div className="absolute inset-0 flex items-center">
                 
                </div>
                
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                {submitMessage ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container whitespace-pre-line"
                  >
                    {submitMessage}
                  </div>
                ) : null}
                <div className="space-y-2">
                  <label
                    className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant"
                    htmlFor="email"
                  >
                    {t("signIn.emailLabel")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("signIn.emailPlaceholder")}
                    className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant"
                      htmlFor="password"
                    >
                      {t("signIn.passwordLabel")}
                    </label>
                    <Link
                      to="/reset-password"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t("signIn.forgot")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitStatus === "loading"}
                  className="mt-4 w-full rounded-full bg-gradient-primary py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  {submitStatus === "loading" ? t("signIn.signingIn") : t("signIn.signInCta")}
                </button>
              </form>

              <div className="mt-10 text-center">
                <p className="font-medium text-on-surface-variant">
                  {t("signIn.newHere")} {" "}
                  <Link
                    to="/sign-up"
                    className="ml-1 font-bold text-primary hover:underline"
                  >
                    {t("signIn.joinHive")}
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <SiteFooter
        brand="StudyBee"
        copyright="© 2026 StudyBee. Built for the future of learning."
        links={["Privacy Policy", "Terms of Service", "Cookie Settings"]}
        layout="brand-links-copyright"
        linksContainerClassName="flex gap-8"
        linkClassName="font-body text-sm leading-relaxed text-on-surface-variant transition-colors hover:text-primary dark:text-surface-variant dark:hover:text-inverse-primary"
        copyrightClassName="font-body text-sm leading-relaxed text-on-surface-variant dark:text-surface-variant"
      />
    </div>
  );
}
