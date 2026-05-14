import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { MarketingFooter } from "../components/MarketingFooter";
import { Reveal } from "../components/Reveal";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { useTranslation } from "react-i18next";
import { homeStatsService, type HomeStats } from "../services/homeStatsService";
import { ratingsService, type RatingsSummary } from "../services/ratingsService";
import { userService } from "../services/userService";
import {
  hoverLift,
  springSnappy,
  staggerContainer,
  staggerItem,
  tapScale,
} from "../motion/presets";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAM9H5sDL2enLRdtx7Wt863QqHQvjO6e83nxxm3-kykW79H6UZ67qTask305qlN2xCGU592MPilutDaFaPCS_wdhAWOlN8nU6VFWBtMtMdKGvWCrumOAJe0Ngw34xQ370Da9WNNBew_EvKifMakPeAkegu7w62dYJn1pNq46_6LsZEBYbH65jaISSt2dpX3oJObAAekIaZXTomv9Ft5H6BqPeg2zmEb0QBaBt3n8dnqx-owfqvmvreNTnR6waVj-AHptQlqxb7SFbA";

const ABOUT_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOkk_SLcvqbT-d2a66J_ObnfC3KwLVrGILU7lB6iOJlL_OxQotPXRK6iX1ELurAhKjTFi2tzbMHxNTg6rLqr_JDXy2AfLZQ2XHh9aEVKa2BcRPoo1Ikx0BsHAMiHuYHo5h4JDdaag2lTo9S__8gDh7LpMf5nzAomTMd4blXIcSRu6KePWJ873Elewe4EWnBcc48GK69PTG8W3H3guMzjNrw2e40R4j-kPM03t1MJiKVPica-FmwWSBbYhineUCW0x7pENTp-7rdYU";

const moods = ["motivated", "calm", "tired", "stressed", "happy"] as const;

type MoodKey = (typeof moods)[number];

const moodFeedback: Record<
  MoodKey,
  {
    emoji: string;
    titleKey: string;
    textKey: string;
    classes: string;
  }
> = {
  motivated: {
    emoji: "⚡",
    titleKey: "home.mood.feedback.motivatedTitle",
    textKey: "home.mood.feedback.motivatedText",
    classes: "from-amber-100 to-yellow-50 ring-amber-200/60 text-amber-800",
  },
  calm: {
    emoji: "🌿",
    titleKey: "home.mood.feedback.calmTitle",
    textKey: "home.mood.feedback.calmText",
    classes: "from-emerald-100 to-teal-50 ring-emerald-200/60 text-emerald-800",
  },
  tired: {
    emoji: "☁️",
    titleKey: "home.mood.feedback.tiredTitle",
    textKey: "home.mood.feedback.tiredText",
    classes: "from-sky-100 to-blue-50 ring-sky-200/60 text-sky-800",
  },
  stressed: {
    emoji: "🫶",
    titleKey: "home.mood.feedback.stressedTitle",
    textKey: "home.mood.feedback.stressedText",
    classes: "from-rose-100 to-pink-50 ring-rose-200/60 text-rose-800",
  },
  happy: {
    emoji: "✨",
    titleKey: "home.mood.feedback.happyTitle",
    textKey: "home.mood.feedback.happyText",
    classes: "from-fuchsia-100 to-pink-50 ring-fuchsia-200/60 text-fuchsia-800",
  },
};

function formatCompactInt(value: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  if (n >= 1_000_000) {
    const m = Math.floor(n / 1_000_000);
    return n % 1_000_000 === 0 ? `${m}M` : `${m}M+`;
  }
  if (n >= 1_000) {
    const k = Math.floor(n / 1_000);
    return n % 1_000 === 0 ? `${k}k` : `${k}k+`;
  }
  return String(n);
}

const pillars = [
  { titleKey: "home.about.pillars.clarityTitle", textKey: "home.about.pillars.clarityText" },
  { titleKey: "home.about.pillars.balanceTitle", textKey: "home.about.pillars.balanceText" },
  { titleKey: "home.about.pillars.confidenceTitle", textKey: "home.about.pillars.confidenceText" },
] as const;

export function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const isSignedIn = useSyncExternalStore(
    userService.subscribeAuth,
    userService.isSignedIn,
    () => false,
  );

  const [homeStats, setHomeStats] = useState<HomeStats | null>(null);
  const [loadingHomeStats, setLoadingHomeStats] = useState(true);

  const [ratings, setRatings] = useState<RatingsSummary | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoadingHomeStats(true);
      try {
        const data = await homeStatsService.get();
        if (!alive) return;
        setHomeStats(data);
      } catch {
        if (!alive) return;
        setHomeStats(null);
      } finally {
        if (alive) setLoadingHomeStats(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoadingRatings(true);
      try {
        const summary = await ratingsService.getSummary();
        if (!alive) return;
        setRatings(summary);
      } catch {
        if (!alive) return;
        setRatings(null);
      } finally {
        if (alive) setLoadingRatings(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isSignedIn]);

  const averageRating = useMemo(() => {
    const avg = ratings?.average;
    return typeof avg === "number" && Number.isFinite(avg) ? avg : 0;
  }, [ratings?.average]);

  const myRating = useMemo(() => {
    const mine = ratings?.my_rating;
    if (typeof mine === "number" && Number.isFinite(mine) && mine >= 1 && mine <= 5) return mine;
    return null;
  }, [ratings?.my_rating]);

  async function onRate(next: number) {
    if (!isSignedIn) return;
    if (next < 1 || next > 5) return;
    try {
      const summary = await ratingsService.setMyRating(next);
      setRatings(summary);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!isRatingModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsRatingModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRatingModalOpen]);

  const feedback = selectedMood ? moodFeedback[selectedMood] : null;

  const stats = useMemo(
    () => [
      {
        key: "studentsSupported",
        num: loadingHomeStats
          ? "—"
          : formatCompactInt(homeStats?.students_supported ?? 0),
      },
      {
        key: "studyHoursGuided",
        num: loadingHomeStats
          ? "—"
          : formatCompactInt(Math.round(homeStats?.study_hours_guided ?? 0)),
      },
    ] as const,
    [homeStats?.students_supported, homeStats?.study_hours_guided, loadingHomeStats],
  );

  return (
    <StudyBeeShell>
      <div className="relative min-h-[100dvh] overflow-x-hidden bg-background">
        <AmbientOrbs className="opacity-70" />

        <main className="pb-28 pt-16 sm:pt-20 lg:pb-32 lg:pt-24">
          <section className="mb-20 px-4 sm:px-6 lg:mb-28 lg:px-8">
            <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <motion.div
                className="space-y-7 sm:space-y-8"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <motion.span
                  variants={staggerItem}
                  className="font-label inline-block rounded-full bg-secondary-container px-4 py-1.5 text-[0.75rem] font-bold uppercase tracking-widest text-on-secondary-container shadow-sm shadow-secondary/20"
                >
                  {t("home.heroBadge")}
                </motion.span>

                <motion.h1
                  variants={staggerItem}
                  className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-on-background sm:text-5xl lg:text-[3.5rem]"
                >
                  {t("home.heroTitleLine1")} <br />
                  <motion.span
                    className="inline-block text-primary italic"
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -12 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : { delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {t("home.heroTitleEmphasis")}
                  </motion.span>
                </motion.h1>

                <motion.p
                  variants={staggerItem}
                  className="max-w-md text-base leading-relaxed text-on-surface-variant sm:text-lg"
                >
                  {t("home.heroText")}
                </motion.p>

                <motion.div
                  variants={staggerItem}
                  className="flex flex-col flex-wrap gap-4 sm:flex-row"
                >
                  <motion.div whileHover={shouldReduceMotion ? {} : hoverLift} whileTap={tapScale}>
                    <Link
                      to="/sign-up"
                      className="btn-glow-hover inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-container px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/25 sm:text-lg"
                    >
                      {t("home.ctaStart")}
                    </Link>
                  </motion.div>

                  <motion.a
                    href="#about"
                    whileHover={shouldReduceMotion ? {} : { ...hoverLift, backgroundColor: "rgb(239 217 201)" }}
                    whileTap={tapScale}
                    transition={springSnappy}
                    className="inline-flex items-center justify-center rounded-full bg-surface-container-highest px-8 py-4 text-base font-bold text-primary shadow-md shadow-primary/5 sm:text-lg"
                  >
                      {t("home.ctaAbout")}
                  </motion.a>
                </motion.div>

                <motion.div variants={staggerItem} className="grid gap-4 pt-4 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-5 py-4 shadow-sm"
                    >
                      <p className="text-2xl font-black text-primary">{item.num}</p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                        {t(`home.stats.${item.key}`)}
                      </p>
                    </div>
                  ))}

                  {/* Average rating (read-only) */}
                  <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-5 py-4 shadow-sm">
                    <p className="text-2xl font-black text-primary">
                      {loadingRatings ? "—" : averageRating ? `${averageRating.toFixed(1)}/5` : "0.0/5"}
                    </p>
                    <div className="mt-2 flex items-center gap-1" aria-label={t("home.stats.averageRating")}>
                      {Array.from({ length: 5 }, (_, idx) => {
                        const star = idx + 1;
                        const full = averageRating >= star;
                        const half = !full && averageRating >= star - 0.5;
                        const empty = !full && !half;

                        const cls = !empty ? "text-tertiary-container" : "text-outline-variant/60";
                        const iconName = half ? "star_half" : "star";

                        return (
                          <span
                            key={star}
                            className={`material-symbols-outlined text-[22px] leading-none ${cls}`}
                            style={{ fontVariationSettings: empty ? "'FILL' 0" : "'FILL' 1" }}
                          >
                            {iconName}
                          </span>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRatingModalOpen(true)}
                      className="mt-2 text-left text-xs font-semibold text-primary underline underline-offset-4"
                    >
                      {t("home.stats.addYourRating")}
                    </button>
                    <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                      {t("home.stats.averageRating")}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                className="relative mx-auto w-full max-w-xl"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94, rotate: 2 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1, rotate: 0 }
                    : { opacity: 1, scale: 1, rotate: 3 }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }
                }
              >
                <motion.div
                  className="aspect-square overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/15 ring-1 ring-white/50"
                  style={{ rotate: shouldReduceMotion ? 0 : 3 }}
                  whileHover={shouldReduceMotion ? {} : { rotate: 1, scale: 1.02 }}
                  transition={springSnappy}
                >
                  <motion.img
                    alt={t("home.heroImageAlt")}
                    className="h-full w-full object-cover"
                    src={HERO_IMG}
                    loading="eager"
                    decoding="async"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.06 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </motion.div>

                <motion.div
                  className="absolute -bottom-4 left-3 max-w-[18rem] rounded-2xl bg-surface/75 p-5 shadow-xl ring-1 ring-outline-variant/10 backdrop-blur-xl sm:-bottom-6 sm:-left-6 sm:max-w-xs sm:p-6"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16, rotate: -4 }}
                  animate={shouldReduceMotion ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 1, y: 0, rotate: -2 }}
                  transition={shouldReduceMotion ? undefined : { delay: 0.45, ...springSnappy }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                    <p className="text-sm font-bold uppercase tracking-widest text-on-surface">
                      {t("home.todaysVibe")}
                    </p>
                  </div>
                  <p className="text-sm leading-snug text-on-surface-variant">
                    {t("home.todaysVibeText")}
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </section>

          <section id="features" className="mb-24 px-4 sm:px-6 lg:mb-32 lg:px-8">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
              <Reveal className="group relative overflow-hidden rounded-[1.5rem] bg-surface-container-low p-8 sm:p-10 md:col-span-2">
                <div className="card-shine relative z-10 h-full rounded-xl">
                  <div className="relative z-10 max-w-md space-y-4 pt-1 pl-6">
                    <h2 className="text-2xl font-bold tracking-tight text-on-background sm:text-3xl">
                      {t("home.features.title")}
                    </h2>
                    <p className="leading-relaxed text-on-surface-variant">
                      {t("home.features.text")}
                    </p>
                  </div>

                  <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary-container/25 blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:opacity-90" />

                  <motion.div
                    className="absolute right-6 top-6 flex gap-2 sm:right-10 sm:top-10"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.08, rotate: 8 }}
                    transition={springSnappy}
                  >
                    <span className="material-symbols-outlined rounded-full bg-surface-container-highest p-4 text-primary shadow-md">
                      auto_awesome
                    </span>
                  </motion.div>
                </div>
              </Reveal>

              <Reveal delay={0.08} className="flex flex-col justify-between rounded-[1.5rem] bg-surface-container-high p-8 shadow-md transition-shadow hover:shadow-lg">
                <motion.span
                  className="material-symbols-outlined text-4xl text-primary"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.12, rotate: -6 }}
                  transition={springSnappy}
                >
                  menu_book
                </motion.span>
                <div>
                  <h3 className="mb-2 text-xl font-bold">{t("home.features.card1Title")}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {t("home.features.card1Text")}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.12} className="flex flex-col justify-between rounded-[1.5rem] bg-surface-container-high p-8 shadow-md transition-shadow hover:shadow-lg">
                <motion.span
                  className="material-symbols-outlined text-4xl text-primary"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.12, rotate: 6 }}
                  transition={springSnappy}
                >
                  insights
                </motion.span>
                <div>
                  <h3 className="mb-2 text-xl font-bold">{t("home.features.card2Title")}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {t("home.features.card2Text")}
                  </p>
                </div>
              </Reveal>
            </div>
          </section>

          <section id="about" className="px-4 sm:px-6 lg:px-8">
            <Reveal className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-sm md:grid-cols-2 md:items-center md:p-12">
              <motion.div
                className="overflow-hidden rounded-2xl"
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                transition={springSnappy}
              >
                <img
                  alt={t("home.about.imageAlt")}
                  className="aspect-[4/5] w-full object-cover shadow-lg"
                  src={ABOUT_IMG}
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>

              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                  {t("home.about.badge")}
                </div>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("home.about.title")}
                </h2>

                <p className="text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  {t("home.about.p1")}
                </p>

                <p className="text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  {t("home.about.p2")}
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {pillars.map((item) => (
                    <div
                      key={item.titleKey}
                      className="rounded-2xl bg-surface-container-high p-5 shadow-sm ring-1 ring-outline-variant/10"
                    >
                      <h3 className="mb-2 text-sm font-bold text-on-background">
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {t(item.textKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </section>

          <section className="px-4 py-20 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-7xl rounded-[2rem] bg-tertiary-container/10 p-8 text-center ring-1 ring-tertiary-container/15 sm:p-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("home.mood.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-on-surface-variant sm:text-base">
                {t("home.mood.subtitle")}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {moods.map((m, i) => (
                  <motion.button
                    key={m}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, ...springSnappy }}
                    whileHover={
                      shouldReduceMotion
                        ? {}
                        : {
                            scale: 1.06,
                            backgroundColor: "rgb(148 168 243)",
                            color: "rgb(13 38 106)",
                          }
                    }
                    whileTap={tapScale}
                    onClick={() => setSelectedMood(m)}
                    className={`rounded-full bg-surface-container-highest px-6 py-3 font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      selectedMood === m ? "bg-primary text-white ring-primary/30" : ""
                    }`}
                  >
                    {t(`home.mood.moods.${m}`)}
                  </motion.button>
                ))}
              </div>

              <motion.div
                aria-live="polite"
                initial={false}
                animate={
                  feedback ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 }
                }
                transition={springSnappy}
                className="mx-auto mt-8 max-w-md"
              >
                {feedback ? (
                  <div
                    className={`rounded-3xl border border-white/40 bg-gradient-to-br ${feedback.classes} p-6 shadow-lg`}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <motion.span
                        className="text-3xl"
                        animate={shouldReduceMotion ? {} : { y: [0, -4, 0] }}
                        transition={
                          shouldReduceMotion
                            ? undefined
                            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                        }
                      >
                        {feedback.emoji}
                      </motion.span>
                      <div className="text-left">
                        <h3 className={`text-lg font-bold ${feedback.classes.split(" ").at(-1)}`}>
                          {t(feedback.titleKey)}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {selectedMood ? t(`home.mood.moods.${selectedMood}`) : ""} {t("home.mood.modeSuffix")}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {t(feedback.textKey)}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            </Reveal>
          </section>
          {isRatingModalOpen ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rate-studybee-title"
            >
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(false)}
                aria-label={t("home.stats.closeRatingPopup")}
                className="absolute inset-0 bg-surface/70 backdrop-blur-sm"
              />

              <div className="relative w-full max-w-sm rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <h2 id="rate-studybee-title" className="text-lg font-bold text-on-background">
                    {t("home.stats.rateTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    aria-label={t("home.stats.closeRatingPopup")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-surface-container-highest/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      close
                    </span>
                  </button>
                </div>

                {isSignedIn ? (
                  <div className="mt-4 flex items-center gap-1" aria-label={t("home.stats.yourRating")}>
                    {Array.from({ length: 5 }, (_, idx) => {
                      const star = idx + 1;
                      const filled = (myRating ?? 0) >= star;
                      const cls = filled ? "text-tertiary-container" : "text-outline-variant/60";

                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => void onRate(star)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-surface-container-highest/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <span
                            className={`material-symbols-outlined text-[26px] leading-none ${cls}`}
                            style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-on-surface-variant">
                    {t("home.stats.signInToRate")} <Link to="/sign-in" className="font-semibold text-primary underline underline-offset-4">{t("nav.signIn")}</Link>
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </main>

        <MarketingFooter />
      </div>
    </StudyBeeShell>
  );
}