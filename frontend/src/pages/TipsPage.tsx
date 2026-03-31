import { motion } from "framer-motion";
import { AmbientOrbs } from "../components/AmbientOrbs";
import { Reveal } from "../components/Reveal";
import { springSnappy } from "../motion/presets";
const TECH_IMG_1 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB4NG0j6C46bLWG23lK2qYlYzxDzzn_bl3l8s617nTg1BiQqlIOj5J2bfX-tLZSKix1f0_G84eIcWmev2iBUnOgHRSg7FWveNwDzwsIVcIzysfR7SlO2rIEZMfODQLAji_q-Eyvz-T3AgoXeb7PABo2w_XsdNFKM7pQg_6EuEwIkCxSerzQyFBlwiov_4A-lenRpXIM-VfNtl_FwstJT_MYy5NuTTCxj2bIbJ2BJBg3z1h2iwdPek9CIRoeARWR-1U4yrAkgHJToig";
const TECH_IMG_3 =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCpn47n62XfEmrOevdF7rX7NlZE8jmvTPjy5fnIzBvTtbJQBmuEgm7A9-vpFoN96Tbx1rngjdqvykam1OQt4uT5vJzS7d1Ir4nLJ1U_CBv7NwZsS0i5UCvRQR2pqXGp-le56uKM6pev9rhZDAdIwQAuzABHyuKWEeahH3BzIJS3wpbIYMJE07c2bpV0cHe7ZFwvnVmbI6Iz1NGYG50Mq66Hsr-bvxQL3nDg_GbCdYjJ29IrxRTdumOvUW7Dyi4hHbG7MiM68YpDNV0";

export function TipsPage() {
  return (
    <div className="relative min-h-screen bg-background antialiased text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <AmbientOrbs className="opacity-[0.45]" />
      <main className="relative mx-auto max-w-6xl space-y-20 px-8 pb-24 pt-28">
        <motion.section
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        >
          <div className="max-w-2xl">
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">
              Personalized Guidance
            </span>
            <h1 className="headline-font text-6xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-7xl">
              Your Mind, <br />
              <span className="text-primary">Mastered.</span>
            </h1>
            <div className="mt-10 inline-flex items-center gap-4 rounded-full border border-primary-container bg-primary-container/40 px-8 py-4 text-sm font-semibold text-on-primary-container backdrop-blur-sm">
              <span
                className="material-symbols-outlined text-xl text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span>
                AI insight: Adjusting focus flow based on your current fatigue
                levels.
              </span>
            </div>
          </div>
        </motion.section>

        <Reveal>
          <section>
          <div className="mb-10 flex items-center justify-between border-b border-outline-variant/20 pb-6">
            <h2 className="headline-font text-3xl font-bold tracking-tight text-on-surface">
              Focus Forecast
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div
              className="group flex flex-col justify-between rounded-[2rem] border border-outline-variant/30 bg-surface-container-low p-8 transition-all duration-500 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5"
              whileHover={{ y: -6, transition: springSnappy }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Optimal Window
                </span>
                <p className="headline-font mt-2 origin-left text-4xl font-black text-primary transition-transform group-hover:scale-105">
                  10:00 AM
                </p>
              </div>
              <p className="mt-6 text-[13px] leading-relaxed text-on-surface-variant">
                Predicted peak energy based on your sleep cycles.
              </p>
            </motion.div>
            <motion.div
              className="flex flex-col justify-between rounded-[2rem] border border-outline-variant/30 bg-surface-container-low p-8 transition-all duration-500 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5"
              whileHover={{ y: -6, transition: springSnappy }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Efficiency Prediction
                </span>
                <p className="headline-font mt-2 text-4xl font-black text-primary">
                  88%
                </p>
              </div>
              <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full w-[88%] rounded-full bg-primary shadow-sm transition-all duration-1000" />
              </div>
            </motion.div>
            <motion.div
              className="flex flex-col justify-between rounded-[2rem] border border-outline-variant/30 bg-surface-container-low p-8 transition-all duration-500 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5"
              whileHover={{ y: -6, transition: springSnappy }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Mood Match
                </span>
                <p className="headline-font mt-2 text-4xl font-black text-tertiary">
                  Motivated
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <span className="rounded-full bg-secondary-container px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                  Lofi Beats
                </span>
                <span className="rounded-full bg-secondary-container px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                  Quiet Room
                </span>
              </div>
            </motion.div>
          </div>
        </section>
        </Reveal>

        <Reveal delay={0.06}>
        <section>
          <div className="mb-10 flex items-center justify-between border-b border-outline-variant/20 pb-6">
            <h2 className="headline-font text-3xl font-bold tracking-tight text-on-surface">
              Tailored Techniques
            </h2>
            <div className="rounded-full bg-primary-container px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-on-primary-container">
              3 Recommendations
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="group flex flex-col gap-8 rounded-[2.5rem] border border-outline-variant/30 bg-surface-container-low p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 sm:flex-row">
              <div className="h-40 w-full flex-shrink-0 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface sm:w-40">
                <img
                  alt="Break"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={TECH_IMG_1}
                />
              </div>
              <div className="flex flex-col justify-between py-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary">
                    Low Energy
                  </span>
                  <h3 className="headline-font mt-2 text-2xl font-extrabold text-on-surface transition-colors group-hover:text-primary">
                    The 5-Minute Reset
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-on-surface-variant">
                    A quick aerobic burst resets cognitive load. Try jumping
                    jacks or a simple stretch.
                  </p>
                </div>
                <button
                  type="button"
                  className="headline-font mt-6 flex items-center gap-2 text-sm font-bold text-primary transition-transform hover:translate-x-1"
                >
                  Start Timer{" "}
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            <div className="group flex flex-col gap-8 rounded-[2.5rem] border border-outline-variant/30 bg-surface-container-low p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 sm:flex-row">
              <div className="flex h-40 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-tertiary-container/20 bg-tertiary-container/30 sm:w-40">
                <span
                  className="material-symbols-outlined text-5xl text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lightbulb
                </span>
              </div>
              <div className="flex flex-col justify-between py-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary">
                    Focus Sprint
                  </span>
                  <h3 className="headline-font mt-2 text-2xl font-extrabold text-on-surface transition-colors group-hover:text-primary">
                    Micro-Dose Tasking
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-on-surface-variant">
                    Set a 10-minute sprint for a task you&apos;ve been avoiding.
                    Action cures anxiety.
                  </p>
                </div>
                <button
                  type="button"
                  className="headline-font mt-6 flex items-center gap-2 text-sm font-bold text-primary transition-transform hover:translate-x-1"
                >
                  Explore Method{" "}
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            <div className="group flex flex-col gap-8 rounded-[2.5rem] border border-outline-variant/30 bg-surface-container-low p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 lg:col-span-2 sm:flex-row">
              <div className="h-48 w-full flex-shrink-0 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface sm:w-48">
                <img
                  alt="Mind Palace"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={TECH_IMG_3}
                />
              </div>
              <div className="flex flex-col justify-between py-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Visual Learning
                  </span>
                  <h3 className="headline-font mt-2 text-3xl font-extrabold text-on-surface transition-colors group-hover:text-primary">
                    Visual Memory Hack
                  </h3>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant">
                    The Loci method transforms information into physical spaces.
                  </p>
                </div>
                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    className="headline-font inline-flex items-center justify-center gap-3 rounded-full bg-primary px-10 py-4 text-[13px] font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-105"
                  >
                    Watch Tutorial{" "}
                    <span className="material-symbols-outlined text-xl">
                      play_circle
                    </span>
                  </button>
                  <button
                    type="button"
                    className="headline-font inline-flex items-center justify-center rounded-full bg-surface-container-highest px-8 py-4 text-[13px] font-bold text-on-surface transition-all hover:bg-surface-container-high"
                  >
                    Save for later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        </Reveal>

        <Reveal delay={0.08}>
        <section className="border-t border-outline-variant/20 pt-12">
          <h2 className="headline-font mb-8 text-center text-[11px] font-extrabold uppercase tracking-[0.4em] text-on-surface-variant/70">
            Explore by Mental State
          </h2>
          <div className="no-scrollbar flex justify-center gap-4 overflow-x-auto pb-4">
            {["MOTIVATED", "CALM", "TIRED", "STRESSED", "SAD"].map((m, i) => (
              <motion.button
                key={m}
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                className={`headline-font flex-shrink-0 rounded-full px-10 py-4 text-[13px] font-bold uppercase transition-shadow ${
                  i === 0
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                    : "border border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-primary/20 hover:bg-surface-container hover:shadow-md"
                }`}
              >
                {m}
              </motion.button>
            ))}
          </div>
        </section>
        </Reveal>
      </main>

      <footer className="border-t border-outline-variant/20 bg-surface px-8 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 md:flex-row">
          <div className="flex flex-col items-center gap-4 md:items-start">
            <span className="headline-font text-2xl font-extrabold tracking-tight text-primary">
              StudyBee
            </span>
            <p className="text-[13px] text-on-surface-variant/70">
              Elevating cognitive potential through AI-driven insights.
            </p>
          </div>
          <div className="headline-font flex gap-12 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <a className="transition-colors hover:text-primary" href="#">
              Privacy
            </a>
            <a className="transition-colors hover:text-primary" href="#">
              Terms
            </a>
            <a className="transition-colors hover:text-primary" href="#">
              Contact
            </a>
          </div>
          <div className="headline-font text-[11px] font-bold uppercase tracking-[0.2em] text-outline">
            © 2024 StudyBee
          </div>
        </div>
      </footer>
    </div>
  );
}
