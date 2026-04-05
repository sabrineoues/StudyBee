import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { Reveal } from "../components/Reveal";
import { StudyBeeShell } from "../components/StudyBeeShell";
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

const moods = ["Motivated", "Calm", "Tired", "Stressed", "Happy"] as const;

const moodFeedback = {
  Motivated: {
    emoji: "⚡",
    title: "Strong focus",
    text: "You’re ready to move. Keep the energy, but stay organized so it turns into real progress.",
    classes: "from-amber-100 to-yellow-50 ring-amber-200/60 text-amber-800",
  },
  Calm: {
    emoji: "🌿",
    title: "Steady pace",
    text: "Perfect state for deep work. Keep your rhythm smooth and consistent.",
    classes: "from-emerald-100 to-teal-50 ring-emerald-200/60 text-emerald-800",
  },
  Tired: {
    emoji: "☁️",
    title: "Low battery",
    text: "Take a short break, drink water, and restart gently. A lighter session is enough.",
    classes: "from-sky-100 to-blue-50 ring-sky-200/60 text-sky-800",
  },
  Stressed: {
    emoji: "🫶",
    title: "Breathe first",
    text: "One task at a time. Slow down the pressure and start with something small.",
    classes: "from-rose-100 to-pink-50 ring-rose-200/60 text-rose-800",
  },
  Happy: {
    emoji: "✨",
    title: "Good momentum",
    text: "You’re in a great mood to learn. Use that energy for a focused session.",
    classes: "from-fuchsia-100 to-pink-50 ring-fuchsia-200/60 text-fuchsia-800",
  },
} as const;

const stats = [
  { num: "5k+", lab: "Students supported" },
  { num: "1M", lab: "Study hours guided" },
  { num: "4.7/5", lab: "User rating" },
] as const;

const pillars = [
  {
    title: "Study with clarity",
    text: "A calm interface that helps you focus on what matters most.",
  },
  {
    title: "Stay balanced",
    text: "Adapt to your state of mind so learning feels less stressful.",
  },
  {
    title: "Grow with confidence",
    text: "Track progress and build momentum one session at a time.",
  },
] as const;

type FooterHrefLink = { label: string; href: string };

const footerLinks: {
  app: FooterHrefLink[];
} = {
  app: [
    { label: "Features", href: "#features" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "mailto:studybee@mindworkers.tn" },
  ],
};

export function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedMood, setSelectedMood] = useState<(typeof moods)[number] | null>(null);

  const feedback = selectedMood ? moodFeedback[selectedMood] : null;

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
                  A cozy study space
                </motion.span>

                <motion.h1
                  variants={staggerItem}
                  className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-on-background sm:text-5xl lg:text-[3.5rem]"
                >
                  Study better, <br />
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
                    feel lighter.
                  </motion.span>
                </motion.h1>

                <motion.p
                  variants={staggerItem}
                  className="max-w-md text-base leading-relaxed text-on-surface-variant sm:text-lg"
                >
                  StudyBee turns heavy study sessions into a softer, more motivating experience — designed to help you stay focused, calm, and consistent.
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
                      Start Your Journey
                    </Link>
                  </motion.div>

                  <motion.a
                    href="#about"
                    whileHover={shouldReduceMotion ? {} : { ...hoverLift, backgroundColor: "rgb(239 217 201)" }}
                    whileTap={tapScale}
                    transition={springSnappy}
                    className="inline-flex items-center justify-center rounded-full bg-surface-container-highest px-8 py-4 text-base font-bold text-primary shadow-md shadow-primary/5 sm:text-lg"
                  >
                    About StudyBee
                  </motion.a>
                </motion.div>

                <motion.div
                  variants={staggerItem}
                  className="grid gap-4 pt-4 sm:grid-cols-3"
                >
                  {stats.map((item) => (
                    <div
                      key={item.lab}
                      className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-5 py-4 shadow-sm"
                    >
                      <p className="text-2xl font-black text-primary">{item.num}</p>
                      <p className="mt-1 text-xs uppercase tracking-widest text-on-surface-variant">
                        {item.lab}
                      </p>
                    </div>
                  ))}
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
                    alt="Espace d’étude chaleureux"
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
                      Today’s vibe
                    </p>
                  </div>
                  <p className="text-sm leading-snug text-on-surface-variant">
                    You’re in a calm zone. It’s a great time for deep work, revision, or a fresh start.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </section>

          <section id="features" className="mb-24 px-4 sm:px-6 lg:mb-32 lg:px-8">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
              <Reveal className="group relative overflow-hidden rounded-[1.5rem] bg-surface-container-low p-8 sm:p-10 md:col-span-2">
                <div className="card-shine relative z-10 h-full rounded-xl">
                  <div className="relative z-10 max-w-md space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight text-on-background sm:text-3xl">
                      Designed to keep you motivated
                    </h2>
                    <p className="leading-relaxed text-on-surface-variant">
                      StudyBee combines calm visuals, gentle guidance, and adaptive energy to help you build a better study rhythm.
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
                  <h3 className="mb-2 text-xl font-bold">Smart Journaling</h3>
                  <p className="text-sm text-on-surface-variant">
                    Capture your thoughts, tasks, and progress in one peaceful space.
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
                  <h3 className="mb-2 text-xl font-bold">Predictive Stats</h3>
                  <p className="text-sm text-on-surface-variant">
                    See your progress clearly and stay one step ahead before exams.
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
                  alt="À propos de StudyBee"
                  className="aspect-[4/5] w-full object-cover shadow-lg"
                  src={ABOUT_IMG}
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>

              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full bg-secondary-container px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
                  About Us
                </div>

                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  A study app built with empathy
                </h2>

                <p className="text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  StudyBee was created for students who want to work hard without feeling overwhelmed. We believe that learning should feel supportive, human, and motivating.
                </p>

                <p className="text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  Our mission is simple: help you stay focused, understand your pace, and make every study session feel lighter and more rewarding.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {pillars.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-surface-container-high p-5 shadow-sm ring-1 ring-outline-variant/10"
                    >
                      <h3 className="mb-2 text-sm font-bold text-on-background">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {item.text}
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
                How do you feel today?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-on-surface-variant sm:text-base">
                Choose your current mood and let StudyBee adapt the experience to match your energy.
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
                    {m}
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
                          {feedback.title}
                        </h3>
                        <p className="text-sm text-slate-600">{selectedMood} mode</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {feedback.text}
                    </p>
                  </div>
                ) : null}
              </motion.div>
            </Reveal>
          </section>
        </main>

        <footer id="contact" className="mt-12 bg-surface-container-low px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-12 md:grid-cols-3">
            <div className="col-span-2">
              <h3 className="mb-6 text-2xl font-black tracking-tighter text-primary">
                StudyBee
              </h3>
              <p className="max-w-sm text-on-surface-variant">
                      Turning Study Time into Prime Time              </p>
            </div>

            <div>
              <h4 className="font-label mb-6 text-[0.75rem] font-bold uppercase tracking-widest">
                App
              </h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                {footerLinks.app.map((item) => (
                  <li key={item.label}>
                    <a className="transition-colors hover:text-primary" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center gap-6 border-t border-outline-variant/15 pt-12 md:flex-row md:justify-between">
            <p className="text-[0.75rem] opacity-60 text-on-surface-variant">
              © 2026 StudyBee Systems. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </StudyBeeShell>
  );
}