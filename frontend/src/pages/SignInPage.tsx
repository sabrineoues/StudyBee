import { motion } from "framer-motion";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { SiteFooter } from "../components/SiteFooter";

export function SignInPage() {
  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="relative min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <AmbientOrbs className="opacity-80" />
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-12 pt-24">

        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="relative hidden pr-12 lg:col-span-7 lg:block">
            <span className="mb-6 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-[0.75rem] font-bold uppercase tracking-widest text-on-secondary-container">
              YOUR AI STUDY PARTNER
            </span>
            <h1 className="font-headline mb-8 text-[4rem] font-extrabold leading-[1.1] tracking-tighter text-on-surface">
              Focus deep.
              <br />
              <span className="text-primary italic">Learn faster.</span>
            </h1>
            <p className="font-body mb-12 max-w-lg text-xl leading-relaxed text-on-surface-variant">
              StudyBee transforms your notes into immersive learning journeys.
              Connect with your hive and conquer your goals together.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="material-symbols-outlined text-3xl text-primary">
                  psychology
                </span>
                <span className="font-headline font-bold text-on-surface">
                  Smart Recalls
                </span>
                <span className="text-sm text-on-surface-variant">
                  AI-driven flashcards tailored to your pace.
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="material-symbols-outlined text-3xl text-tertiary">
                  groups
                </span>
                <span className="font-headline font-bold text-on-surface">
                  Hive Study
                </span>
                <span className="text-sm text-on-surface-variant">
                  Real-time collaborative focus sessions.
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
                  Welcome Back
                </h2>
                <p className="text-on-surface-variant">
                  Ready to jump back into the hive?
                </p>
              </div>

              <div className="relative mb-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/20" />
                </div>
                <span className="relative bg-surface/60 px-4 text-xs font-bold uppercase text-outline backdrop-blur-md">
                  or use email
                </span>
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
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
                    placeholder="alex@hive.edu"
                    className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="ml-1 block text-[0.75rem] font-bold uppercase tracking-wider text-on-surface-variant"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot?
                    </a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-md border-none bg-surface-container-highest px-5 py-4 text-on-surface placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full rounded-full bg-gradient-primary py-4 font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  Sign In to Hive
                </button>
              </form>

              <div className="mt-10 text-center">
                <p className="font-medium text-on-surface-variant">
                  New to StudyBee?{" "}
                  <Link
                    to="/sign-up"
                    className="ml-1 font-bold text-primary hover:underline"
                  >
                    Join the hive
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <SiteFooter
        brand="StudyCompanion AI"
        copyright="© 2024 StudyCompanion AI. Built for the future of learning."
        links={["Privacy Policy", "Terms of Service", "Cookie Settings"]}
        layout="brand-links-copyright"
        linksContainerClassName="flex gap-8"
        linkClassName="font-body text-sm leading-relaxed text-on-surface-variant transition-colors hover:text-primary dark:text-surface-variant dark:hover:text-inverse-primary"
        copyrightClassName="font-body text-sm leading-relaxed text-on-surface-variant dark:text-surface-variant"
      />
    </div>
  );
}
