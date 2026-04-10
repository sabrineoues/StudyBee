import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MarketingFooter } from "../components/MarketingFooter";

export function JournalPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-32 text-on-surface md:pb-0">
      <main className="mx-auto max-w-5xl px-6 pt-24">
        <motion.header
          className="mb-12 space-y-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          <span className="label-sm text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            {t("journal.headerKicker")}
          </span>
          <h1 className="text-5xl font-extrabold tracking-tighter text-primary md:text-6xl">
            {t("journal.title")}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            {t("journal.subtitle")}
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-8">
            <div className="relative z-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">
                  {t("journal.howDoYouFeel")}
                </h2>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("journal.emotionalCheckIn")}
                </span>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <button
                  type="button"
                  className="group flex h-14 w-14 flex-col items-center justify-center rounded-full bg-surface-container-lowest transition-transform hover:scale-105"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">
                    sentiment_very_dissatisfied
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-20 w-20 scale-110 flex-col items-center justify-center rounded-full bg-secondary-container/30 ring-2 ring-primary transition-transform hover:scale-110"
                >
                  <span
                    className="material-symbols-outlined text-3xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    sentiment_dissatisfied
                  </span>
                  <span className="mt-1 text-[10px] font-bold text-primary">
                    {t("journal.sad")}
                  </span>
                </button>
                <button
                  type="button"
                  className="group flex h-14 w-14 flex-col items-center justify-center rounded-full bg-surface-container-lowest transition-transform hover:scale-105"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">
                    sentiment_neutral
                  </span>
                </button>
                <button
                  type="button"
                  className="group flex h-14 w-14 flex-col items-center justify-center rounded-full bg-surface-container-lowest transition-transform hover:scale-105"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">
                    sentiment_satisfied
                  </span>
                </button>
              </div>
            </div>
            <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-tertiary-container/20 blur-3xl" />
          </section>

          <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-8 md:col-span-4">
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">{t("journal.energyLevel")}</h2>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t("journal.vitality")}
                </span>
              </div>
              <div className="flex flex-grow flex-col justify-center gap-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>{t("journal.low")}</span>
                  <span>{t("journal.high")}</span>
                </div>
                <div className="relative py-4">
                  <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-surface-variant" />
                  <div className="absolute top-1/2 h-1 w-1/2 -translate-y-1/2 rounded-full bg-primary" />
                  <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-primary ring-4 ring-primary/20 transition-transform hover:scale-125" />
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-primary">
                    5
                    <span className="text-sm text-on-surface-variant/50">/10</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-highest p-1 md:col-span-12 md:p-2">
            <div className="rounded-lg bg-surface-container-lowest p-8 shadow-sm md:p-12">
              <div className="flex flex-col gap-12 md:flex-row">
                <div className="flex-1 space-y-6">
                  <h3 className="flex items-center gap-3 text-2xl font-bold text-primary">
                    <span className="material-symbols-outlined">edit_note</span>
                    {t("journal.dearSanctuary")}
                  </h3>
                  <textarea
                    className="min-h-[300px] w-full border-none bg-transparent text-lg italic leading-relaxed text-on-surface placeholder:text-outline-variant focus:ring-0"
                    placeholder={t("journal.entryPlaceholder")}
                  />
                </div>
                <div className="space-y-8 md:w-64">
                  <div>
                    <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      {t("journal.promptOfTheHour")}
                    </h4>
                    <p className="text-sm italic leading-relaxed text-secondary">
                      {t("journal.promptText")}
                    </p>
                  </div>
                  <div className="border-t border-outline-variant/15 pt-6">
                    <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      {t("journal.atmosphere")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-secondary-container px-3 py-1 text-[10px] font-bold text-on-secondary-container">
                        {t("journal.atmosphereTag1")}
                      </span>
                      <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold text-on-surface-variant">
                        {t("journal.atmosphereTag2")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-surface-container-low p-8 md:col-span-12">
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-primary">
                  auto_awesome
                </span>
              </div>
              <div className="w-full flex-grow">
                <h3 className="mb-2 text-lg font-bold text-primary">
                  {t("journal.tomorrowQuestion")}
                </h3>
                <input
                  type="text"
                  placeholder={t("journal.tomorrowPlaceholder")}
                  className="w-full rounded-lg border-none bg-surface-container-lowest px-4 py-3 italic text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </section>

          <section className="md:col-span-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">{t("journal.gentleHabits")}</h2>
              <span className="material-symbols-outlined text-on-surface-variant">
                more_horiz
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* habit cards abbreviated — same structure as HTML */}
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      water_drop
                    </span>
                  </div>
                  <button type="button" className="material-symbols-outlined text-outline transition-colors hover:text-primary">
                    add_circle
                  </button>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.hydration")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      3
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">
                      {t("journal.ofGlasses", { total: 8 })}
                    </span>
                  </div>
                </div>
                <div className="flex w-full items-center gap-2">
                  <div className="h-1.5 flex-grow overflow-hidden rounded-full bg-surface-variant">
                    <div className="h-full w-[37.5%] bg-primary" />
                  </div>
                </div>
              </div>
              <div className="group flex flex-col gap-4 rounded-xl border-2 border-primary/20 bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
                    <span className="material-symbols-outlined text-on-secondary-container">
                      self_improvement
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.meditation")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {t("journal.completed")}
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-full bg-primary" />
                </div>
              </div>
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      blind
                    </span>
                  </div>
                  <button type="button" className="text-[10px] font-bold uppercase text-primary hover:underline">{t("journal.log")}</button>
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.dailyWalk")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t("journal.notStarted")}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-0 bg-primary" />
                </div>
              </div>
              <div className="group flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 transition-all hover:bg-surface-container-high">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container">
                    <span className="material-symbols-outlined text-on-tertiary-container">
                      bedtime
                    </span>
                  </div>
                  <input type="checkbox" className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{t("journal.restEarly")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t("journal.restEarlyGoal")}</p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div className="h-full w-1/2 bg-primary" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />

      <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-xl bg-background/60 px-4 pb-8 pt-4 backdrop-blur-2xl md:hidden">
        <Link to="/" className="flex flex-col items-center justify-center px-4 py-2 text-on-surface-variant opacity-80 transition-opacity hover:opacity-100 dark:text-inverse-on-surface">
          <span className="material-symbols-outlined">home</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">{t("nav.home")}</span>
        </Link>
        <Link
          to="/journal"
          className="mb-2 flex scale-110 flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container p-3 text-white shadow-lg transition-all duration-300"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">{t("nav.journal")}</span>
        </Link>
        <Link to="/dashboard" className="flex flex-col items-center justify-center px-4 py-2 text-on-surface-variant opacity-80 transition-opacity dark:text-inverse-on-surface">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">{t("journal.mobileDash")}</span>
        </Link>
        <Link to="/sign-in" className="flex flex-col items-center justify-center px-4 py-2 text-on-surface-variant opacity-80 dark:text-inverse-on-surface">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 font-headline text-[10px] font-bold uppercase tracking-widest">{t("nav.profile")}</span>
        </Link>
      </nav>
    </div>
  );
}
