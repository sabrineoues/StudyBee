import { motion, useReducedMotion } from "framer-motion";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Reveal } from "../components/Reveal";
import { StudyBeeShell } from "../components/StudyBeeShell";
import { springSnappy } from "../motion/presets";

export function DashboardPage() {
  const reduceMotion = useReducedMotion();

  return (
    <StudyBeeShell>
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-primary-container/10 blur-[120px]"
          animate={
            reduceMotion
              ? { opacity: 0.55, scale: 1 }
              : { opacity: [0.45, 0.75, 0.45], scale: [1, 1.06, 1] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 16, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-tertiary-container/10 blur-[120px]"
          animate={
            reduceMotion
              ? { opacity: 0.5, scale: 1 }
              : { opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }
        />
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-12 md:pb-0">
        <motion.header
          className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-2xl">
            <h1 className="font-headline mb-4 text-5xl font-extrabold tracking-tight text-on-surface md:text-6xl">
              Welcome back, <span className="text-primary">Alex</span>.
            </h1>
            <p className="font-body text-lg leading-relaxed text-on-surface-variant">
              Your current vibe feels{" "}
              <span className="rounded-full bg-tertiary-container px-3 py-1 font-bold text-on-tertiary-container">
                Focused
              </span>
              . You&apos;ve conquered 85% of your weekly goals.
            </p>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: "mood", label: "Motivated" },
              { icon: "sentiment_neutral", label: "Tired" },
              { icon: "psychology", label: "Stressed" },
            ].map((b, i) => (
              <motion.button
                key={b.label}
                type="button"
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                className={`flex items-center gap-2 rounded-full px-6 py-3 font-label text-[10px] font-bold uppercase tracking-widest shadow-sm ring-1 ring-transparent transition-shadow hover:shadow-md ${
                  i === 0
                    ? "bg-surface-container-highest text-on-surface ring-outline-variant/10"
                    : "bg-surface-container-low text-on-surface opacity-60 hover:opacity-90"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {b.icon}
                </span>
                {b.label}
              </motion.button>
            ))}
          </div>
        </motion.header>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-12">
          <motion.div
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container p-8 text-on-primary shadow-lg shadow-primary/20 md:col-span-8"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, boxShadow: "0 24px 48px rgba(68,88,156,0.35)" }}
          >
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                  <span className="font-label text-xs uppercase tracking-widest text-white/80">
                    Active Streak
                  </span>
                </div>
                <div className="mb-2 font-headline text-7xl font-black">
                  14 Days
                </div>
                <p className="font-body max-w-xs text-white/90">
                  You&apos;re in the top 5% of students this week. Keep the
                  momentum!
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white px-8 py-3 text-sm font-bold text-primary transition-all hover:scale-105 active:scale-95"
                >
                  Continue Study
                </button>
                <button
                  type="button"
                  className="rounded-full bg-white/20 px-8 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                >
                  View Milestones
                </button>
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-110" />
            <motion.div
              className="absolute right-10 top-10 opacity-20"
              animate={
                reduceMotion
                  ? { rotate: 0, scale: 1 }
                  : { rotate: [0, 6, 0], scale: [1, 1.05, 1] }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 12, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <span className="material-symbols-outlined text-[12rem]">
                auto_awesome
              </span>
            </motion.div>
          </motion.div>

          <Reveal className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 shadow-sm transition-shadow hover:shadow-md md:col-span-4" delay={0.06}>
            <div>
              <h3 className="font-headline mb-6 flex items-center gap-2 text-xl font-bold">
                <span className="material-symbols-outlined text-tertiary">
                  bubble_chart
                </span>
                Aura Trends
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Calm", w: "70%", c: "bg-primary-container" },
                  { label: "Focus", w: "85%", c: "bg-primary" },
                  { label: "Anxiety", w: "15%", c: "bg-tertiary-container" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between"
                  >
                    <span className="font-body text-sm font-medium">
                      {r.label}
                    </span>
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={`h-full ${r.c} transition-all duration-700`}
                        style={{ width: r.w }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 rounded-lg border-l-4 border-primary bg-surface p-4">
              <p className="font-body text-xs italic text-on-surface-variant">
                &quot;Your focus peaks between 10 AM and 1 PM. Plan your
                heaviest tasks then.&quot;
              </p>
            </div>
          </Reveal>

          <Reveal className="rounded-xl bg-surface-container-high p-6 shadow-sm transition-shadow hover:shadow-md md:col-span-4" delay={0.1}>
            <div className="mb-8 flex items-center justify-between">
              <h3 className="font-headline text-xl font-bold">Performance</h3>
              <span className="material-symbols-outlined text-primary">
                analytics
              </span>
            </div>
            <div className="mb-6 flex h-32 items-end gap-2">
              <div className="h-[40%] flex-1 rounded-t-lg bg-primary/20 transition-all hover:bg-primary/30" />
              <div className="h-[60%] flex-1 rounded-t-lg bg-primary/40 transition-all hover:bg-primary/50" />
              <div className="h-[85%] flex-1 rounded-t-lg bg-primary/60 transition-all hover:bg-primary/70" />
              <div className="h-[70%] flex-1 rounded-t-lg bg-primary/80 transition-all hover:bg-primary/90" />
              <div className="h-full flex-1 rounded-t-lg bg-primary transition-all hover:opacity-95" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">92%</div>
                <div className="font-label text-[10px] uppercase tracking-wider opacity-60">
                  Accuracy
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">+12%</div>
                <div className="font-label text-[10px] uppercase tracking-wider opacity-60">
                  Improvement
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal
            className="overflow-hidden rounded-xl bg-surface-container-low p-6 shadow-sm transition-shadow hover:shadow-md md:col-span-8"
            delay={0.12}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-xl font-bold">
                Recent Flow Sessions
              </h3>
              <button
                type="button"
                className="text-sm font-bold text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex cursor-pointer items-center rounded-lg border-l-4 border-transparent bg-surface p-4 transition-all hover:translate-x-2 hover:border-primary-container">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container">
                  <span className="material-symbols-outlined text-on-secondary-container">
                    functions
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-body font-bold text-on-surface">
                    Advanced Calculus
                  </h4>
                  <p className="font-body text-xs text-on-surface-variant opacity-70">
                    2 hours ago • 45 min deep work
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">+240 XP</div>
                  <div className="flex justify-end gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
              <div className="flex cursor-pointer items-center rounded-lg border-l-4 border-transparent bg-surface p-4 transition-all hover:translate-x-2 hover:border-primary-container">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-container">
                  <span className="material-symbols-outlined text-on-tertiary-container">
                    history_edu
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-body font-bold text-on-surface">
                    Modern World History
                  </h4>
                  <p className="font-body text-xs text-on-surface-variant opacity-70">
                    Yesterday • 1.5 hr marathon
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">+450 XP</div>
                  <div className="flex justify-end gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal
            className="flex flex-col items-center gap-8 rounded-xl bg-surface-container-highest p-8 shadow-inner shadow-primary/5 md:col-span-12 lg:col-span-4 lg:flex-row"
            delay={0.08}
          >
            <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                <circle
                  className="text-surface-container-low"
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary"
                  cx="64"
                  cy="64"
                  r="58"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="364.4"
                  strokeDashoffset="91.1"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black">24.5</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  Hours
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-headline mb-2 text-lg font-bold">Total Time</h3>
              <p className="font-body text-sm text-on-surface-variant">
                This week&apos;s investment in yourself. You are 2.5 hours away
                from your goal!
              </p>
            </div>
          </Reveal>

          <motion.div
            className="grid grid-cols-1 gap-4 md:col-span-12 md:grid-cols-2 lg:col-span-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="group flex cursor-pointer items-center gap-4 rounded-xl bg-surface p-6 transition-colors hover:bg-surface-container-low"
              whileHover={{ y: -3, boxShadow: "0 16px 32px rgba(55,45,37,0.08)" }}
              transition={springSnappy}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined">edit_note</span>
              </div>
              <div>
                <h4 className="font-bold">Log Journal Entry</h4>
                <p className="text-xs text-on-surface-variant">
                  Reflect on today&apos;s learning journey
                </p>
              </div>
            </motion.div>
            <motion.div
              className="group flex cursor-pointer items-center gap-4 rounded-xl bg-surface p-6 transition-colors hover:bg-surface-container-low"
              whileHover={{ y: -3, boxShadow: "0 16px 32px rgba(55,45,37,0.08)" }}
              transition={springSnappy}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-white transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <div>
                <h4 className="font-bold">Daily Study Tip</h4>
                <p className="text-xs text-on-surface-variant">
                  The Feynman Technique: Simplify it.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <MobileBottomNav />
    </StudyBeeShell>
  );
}
