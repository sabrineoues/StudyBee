import { motion } from "framer-motion";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { SiteFooter } from "../components/SiteFooter";
const TESTIMONIAL_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDxYC2lzXtuft6Wa7bRiJsNH8kr9BZn_m8CYHvIWpMSQCs3lHiOVGjHQFnvpwuxUKy7wohmmT8QI_QjIQ9VDs40J8sceo8_4cHSW0c7Qo84HipEVLopmW-QsdZytFHT4_z3OvNluN-xGDyNbejWgvxr1VYGCH8eicZ3-n46_NbaleRalRZdnAn3GiEC6ii3GOEQHa_2Lg0HAXtCKBNUC2Md-lnEzPrd6LU6hpIiQ0neb_ZH2xAoUAZiQLKbAs7N0_LKl8Cb68UfZ4c";

export function SignUpPage() {
  const [showPw, setShowPw] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background font-body text-on-background">
      <AmbientOrbs className="opacity-75" />
      <main className="relative flex flex-grow items-center justify-center px-6 pb-12 pt-24">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="hidden space-y-8 pr-12 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-tertiary">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              Join the Future
            </div>
            <h1 className="font-headline text-6xl font-extrabold leading-[1.1] tracking-tight text-on-background xl:text-7xl">
              Design your <span className="text-primary">academic</span> flow.
            </h1>
            <p className="max-w-md text-xl leading-relaxed text-on-surface-variant">
              The only study platform that adapts to your psychological state
              and learning style.
            </p>
            <div className="relative pt-8">
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-primary-container/30 blur-3xl" />
              <div className="relative flex items-center gap-6 rounded-xl bg-surface-container-low p-8 transition-transform duration-500 hover:scale-[1.01]">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full ring-4 ring-white">
                  <img
                    alt="Students"
                    className="h-full w-full object-cover"
                    src={TESTIMONIAL_IMG}
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold italic leading-snug text-on-surface">
                    &quot;It feels less like a tool and more like a partner.&quot;
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    — Sarah J., Stanford University
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, boxShadow: "0 28px 56px rgba(55,45,37,0.11)" }}
              className="card-shine rounded-xl bg-surface-container-lowest p-8 shadow-[0_20px_40px_rgba(55,45,37,0.06)] ring-1 ring-white/35 md:p-10"
            >
              <div className="mb-10 lg:hidden">
                <h2 className="font-headline mb-2 text-4xl font-extrabold tracking-tight text-on-background">
                  Join the Hive
                </h2>
                <p className="text-on-surface-variant">
                  Step into your personalized study sanctuary.
                </p>
              </div>

              <div className="relative mb-8 flex items-center gap-4">
                <div className="h-px flex-grow bg-outline-variant/15" />
                
                <div className="h-px flex-grow bg-outline-variant/15" />
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label className="font-label block px-1 text-xs uppercase tracking-widest text-outline">
                    Full Name
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                      person
                    </span>
                    <input
                      placeholder="John Doe"
                      className="w-full rounded-md border-none bg-surface-container-highest py-4 pl-12 pr-4 text-on-background placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label block px-1 text-xs uppercase tracking-widest text-outline">
                    University Email
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                      alternate_email
                    </span>
                    <input
                      type="email"
                      placeholder="john@university.edu"
                      className="w-full rounded-md border-none bg-surface-container-highest py-4 pl-12 pr-4 text-on-background placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label block px-1 text-xs uppercase tracking-widest text-outline">
                    Password
                  </label>
                  <div className="group relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                      lock
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full rounded-md border-none bg-surface-container-highest py-4 pl-12 pr-12 text-on-background placeholder:text-outline/60 transition-all focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-background"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Masquer" : "Afficher"}
                    >
                      {showPw ? "visibility" : "visibility_off"}
                    </button>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-gradient-primary py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  >
                    Design My Flow
                  </button>
                </div>
              </form>

              <div className="mt-10 text-center">
                <p className="font-medium text-on-surface-variant">
                  Already have an account?{" "}
                  <Link
                    to="/sign-in"
                    className="ml-1 font-bold text-primary underline decoration-2 underline-offset-4 hover:opacity-90"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <SiteFooter
        brand="StudyCompanion"
        copyright="© 2024 StudyCompanion AI. Built for the future of learning."
        links={["Privacy Policy", "Terms of Service", "Cookie Settings"]}
        layout="brand-copyright-links"
        linksContainerClassName="flex gap-6"
        linkClassName="font-body text-sm text-on-surface-variant transition-colors hover:text-primary dark:text-surface-variant dark:hover:text-inverse-primary"
        copyrightClassName="text-center font-body text-sm leading-relaxed text-on-surface-variant dark:text-surface-variant md:text-left"
      />
    </div>
  );
}
