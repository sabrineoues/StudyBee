import { motion } from "framer-motion";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AmbientOrbs } from "../components/AmbientOrbs";
import { MarketingFooter } from "../components/MarketingFooter";
import { userService } from "../services/userService";

function useQueryParams() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const qs = useQueryParams();

  const uid = (qs.get("uid") || "").trim();
  const token = (qs.get("token") || "").trim();
  const hasLinkParams = Boolean(uid && token);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onRequestEmail(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      await userService.requestPasswordReset(email.trim());
      setStatus("success");
      setMessage("If an account exists for this email, a reset link has been sent.");
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown }; message?: unknown };
      const data = maybeAny?.response?.data as unknown;
      const msgFromApi =
        data && typeof data === "object" && !Array.isArray(data) && typeof (data as { detail?: unknown }).detail === "string"
          ? (data as { detail: string }).detail
          : null;

      setStatus("error");
      setMessage(
        msgFromApi ??
          (typeof maybeAny?.message === "string" ? maybeAny.message : "Could not send reset email. Try again."),
      );
    }
  }

  async function onSetNewPassword(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    if (newPassword !== newPasswordConfirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      await userService.confirmPasswordReset({
        uidb64: uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });

      setStatus("success");
  setMessage("Password has been reset.");

      navigate("/sign-in", { replace: true });
    } catch (err) {
      const maybeAny = err as { response?: { data?: unknown }; message?: unknown };
      const data = maybeAny?.response?.data as unknown;

      const msgFromApi =
        data && typeof data === "object" && !Array.isArray(data)
          ? typeof (data as { detail?: unknown }).detail === "string"
            ? (data as { detail: string }).detail
            : typeof (data as { token?: unknown }).token === "string"
              ? (data as { token: string }).token
              : typeof (data as { uidb64?: unknown }).uidb64 === "string"
                ? (data as { uidb64: string }).uidb64
                : null
          : null;

      setStatus("error");
      setMessage(
        msgFromApi ??
          (typeof maybeAny?.message === "string" ? maybeAny.message : "Could not reset password. Try again."),
      );
    }
  }

  const title = hasLinkParams ? "Choose a new password" : "Reset password";
  const subtitle = hasLinkParams
    ? "Set a new password for your account."
    : "Enter your email to receive a reset link.";

  return (
    <div className="relative min-h-screen bg-background font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <AmbientOrbs className="opacity-80" />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-12 pt-24">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="relative hidden pr-12 lg:col-span-7 lg:block">
            <span className="mb-6 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-[0.75rem] font-bold uppercase tracking-widest text-on-secondary-container">
              ACCOUNT RECOVERY
            </span>
            <h1 className="font-headline mb-8 text-[4rem] font-extrabold leading-[1.1] tracking-tighter text-on-surface">
              Get back in.
              <br />
              <span className="text-primary italic">Stay on track.</span>
            </h1>
            <p className="font-body mb-12 max-w-lg text-xl leading-relaxed text-on-surface-variant">
              We’ll email you a reset link so you can choose a new password.
            </p>
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
                <h2 className="font-headline mb-2 text-2xl font-extrabold text-on-surface md:text-3xl">{title}</h2>
                <p className="text-on-surface-variant">{subtitle}</p>
              </div>

              {message ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={
                    status === "error"
                      ? "mb-6 rounded-md bg-error-container/20 px-4 py-3 text-sm font-semibold text-on-error-container whitespace-pre-line"
                      : "mb-6 rounded-md bg-secondary-container/35 px-4 py-3 text-sm font-semibold text-on-secondary-container whitespace-pre-line"
                  }
                >
                  {message}
                </div>
              ) : null}

              {hasLinkParams ? (
                <form className="space-y-6" onSubmit={onSetNewPassword}>
                  <div className="space-y-2">
                    <label
                      className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant"
                      htmlFor="new-password"
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant"
                        htmlFor="new-password-confirm"
                      >
                        Confirm New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="rounded-md px-3 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container-highest/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="new-password-confirm"
                      type={showPassword ? "text" : "password"}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-4 w-full rounded-full bg-gradient-primary py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    {status === "loading" ? "Saving..." : "Save new password"}
                  </button>

                  <div className="mt-8 text-center">
                    <p className="font-medium text-on-surface-variant">
                      <Link to="/sign-in" className="font-bold text-primary hover:underline">
                        Back to sign in
                      </Link>
                    </p>
                  </div>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={onRequestEmail}>
                  <div className="space-y-2">
                    <label
                      className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant"
                      htmlFor="email"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-4 w-full rounded-full bg-gradient-primary py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    {status === "loading" ? "Sending..." : "Send reset link"}
                  </button>

                  <div className="mt-8 text-center">
                    <p className="font-medium text-on-surface-variant">
                      Remembered your password?{" "}
                      <Link to="/sign-in" className="ml-1 font-bold text-primary hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
