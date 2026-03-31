import { StudyBeeShell } from "../components/StudyBeeShell";
import { MobileBottomNav } from "../components/MobileBottomNav";

const BEE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAA9WzlnKw2cDsXYu08D_iqZ9_DW4uWWmaJSg0i2gxaFApq9m3cn_tXn2iRhGUkQlJoad4Vrt2S0S5FRxLJrnddCYZSqCHRHRlzOiBkFSQyvymkDML_RkK3CghyptPis_zpjvgKKe3fxIKCuMJcf86QktCiIbGpwju8b-ERrG2Y6CaS1pwyP-KY76b7wc6ZtOs5u_cKBI6TkAHpH6FApXkxutKcq4vujXXXiuzhkv4yrAi5HMsAd3L57FH6ynccAD-CwxOzbItlkNs";
const DIAGRAM_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAaTR3c5-HTnKg1MpqAB42kVkAKTzQurXurJhmmjdzBsSZn2QlhLEfqmXfZWhxgTTw5maIrHAlReoj_O154IOXMb1T_e2ZXqKBOQdqjBMXHS01aV6bJbAnO1O-XEmdhb8fFyrgHSwyfGXIezrfco2lpa9CAj6Z-NQvVZ2SoJwjgjf6Mnkd_qkDQFmR6H8O5Ff_JgC_hFccmrWulZHbicG2OLhwRzIkp6OOIR6xwif3Cj2sbwP-GCtp7V-ruW8UTKV2vlfHh1ksllRg";

export function StudyPage() {
  return (
    <StudyBeeShell>
      <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 px-8 pb-12 pt-24 md:flex-row">
        <div className="flex-1 space-y-8 lg:max-w-[450px]">
          <section className="relative flex flex-col items-center overflow-hidden rounded-xl bg-surface-container-low p-8 text-center shadow-sm">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5" />
            <span className="label-md mb-6 block uppercase tracking-widest text-outline">
              Deep Focus Mode
            </span>
            <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
              <svg className="absolute h-full w-full -rotate-90">
                <circle
                  className="text-surface-container-high"
                  cx="128"
                  cy="128"
                  r="120"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary"
                  cx="128"
                  cy="128"
                  r="120"
                  fill="transparent"
                  stroke="currentColor"
                  strokeDasharray="753.98"
                  strokeDashoffset="188.5"
                  strokeWidth="8"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="font-headline text-6xl font-extrabold tracking-tight text-on-surface">
                  24:59
                </span>
                <span className="mt-1 text-sm font-medium text-outline">
                  minutes remaining
                </span>
              </div>
            </div>
            <div className="flex w-full gap-4">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="material-symbols-outlined">play_arrow</span>
                Start Session
              </button>
              <button
                type="button"
                className="flex w-16 items-center justify-center rounded-full bg-surface-container-highest text-primary transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </section>

          <section className="relative flex items-start gap-4 rounded-xl bg-tertiary-container/20 p-6">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-tertiary-container shadow-md">
              <img alt="StudyBee" className="h-10 w-10" src={BEE_IMG} />
            </div>
            <div className="space-y-2">
              <h3 className="font-headline text-lg font-bold text-on-tertiary-container">
                StudyBee Tip
              </h3>
              <p className="text-base italic leading-relaxed text-on-tertiary-container/80">
                &quot;Hey study buddy! You&apos;ve been focused for 45 minutes.
                How about a 5-minute stretch?&quot;
              </p>
            </div>
          </section>

          <section className="mb-4 rounded-xl bg-surface-container-low p-6 shadow-sm">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <span className="font-headline mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary/60">
                  Current Progress
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface">
                  Session Focus
                </h3>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-headline text-sm font-bold text-primary">
                2/3 Goals Met
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: "66.6%" }}
              />
            </div>
            <p className="mt-3 text-[11px] font-medium text-outline">
              Keep going! You&apos;re almost at your session milestone.
            </p>
          </section>

          <section className="space-y-6 rounded-xl bg-surface-container-low p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Session Goals
              </h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                3 Pending
              </span>
            </div>
            <div className="space-y-3">
              <div className="group flex cursor-pointer items-center gap-4 rounded-lg bg-surface-container-lowest p-4 transition-all hover:shadow-md">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary group-hover:bg-primary/5" />
                <span className="flex-1 font-medium text-on-surface">
                  Summarize Chapter 4: Neural Nets
                </span>
                <span className="material-symbols-outlined text-outline/40 opacity-0 transition-opacity group-hover:opacity-100">
                  drag_indicator
                </span>
              </div>
              <div className="group flex cursor-pointer items-center gap-4 rounded-lg bg-surface-container-lowest p-4 transition-all hover:shadow-md">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary" />
                <span className="flex-1 font-medium text-on-surface">
                  Complete calculus practice problems
                </span>
              </div>
              <div className="flex cursor-pointer items-center gap-4 rounded-lg bg-surface-container-lowest p-4 opacity-60">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <span
                    className="material-symbols-outlined text-sm text-white"
                    style={{ fontVariationSettings: "'wght' 700" }}
                  >
                    check
                  </span>
                </div>
                <span className="flex-1 font-medium text-on-surface line-through">
                  Set up session environment
                </span>
              </div>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-outline-variant py-4 font-semibold text-outline transition-all hover:border-primary hover:text-primary"
            >
              <span className="material-symbols-outlined">add</span>
              Add new goal
            </button>
          </section>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-container-high/50 bg-surface-container-low shadow-lg">
          <header className="flex items-center justify-between border-b border-surface-container-highest/30 bg-surface-container-high/50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-on-surface">
                  StudyBee Explainer
                </h2>
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  AuraFlow AI Active
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined">history</span>
              </button>
            </div>
          </header>

          <div className="hide-scrollbar max-h-[70vh] flex-1 space-y-8 overflow-y-auto p-6">
            <div className="flex max-w-[85%] gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-sm text-on-secondary-container">
                  smart_toy
                </span>
              </div>
              <div className="space-y-2">
                <div className="rounded-tr-xl rounded-b-xl bg-white p-5 shadow-sm">
                  <p className="leading-relaxed text-on-surface">
                    I see you&apos;re working on{" "}
                    <strong className="text-primary">Neural Networks</strong>.
                    Would you like an analogy for{" "}
                    <em className="italic">Backpropagation</em>?
                  </p>
                </div>
                <span className="px-1 text-[10px] text-outline">10:42 AM</span>
              </div>
            </div>

            <div className="ml-auto flex max-w-[85%] flex-row-reverse gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                <span className="material-symbols-outlined text-sm text-white">
                  person
                </span>
              </div>
              <div className="space-y-2 text-right">
                <div className="rounded-tl-xl rounded-b-xl bg-primary p-5 text-white shadow-md">
                  <p className="leading-relaxed">
                    Let&apos;s start with the analogy! I&apos;m finding the
                    abstract part hard to visualize.
                  </p>
                </div>
                <span className="px-1 text-[10px] text-outline">10:43 AM</span>
              </div>
            </div>

            <div className="flex max-w-[95%] gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container">
                <span className="material-symbols-outlined text-sm text-on-secondary-container">
                  smart_toy
                </span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-4 rounded-tr-xl rounded-b-xl bg-white p-6 shadow-sm">
                  <p className="leading-relaxed text-on-surface">
                    Imagine you&apos;re trying to hit a target with a bow and
                    arrow. 🎯
                  </p>
                  <p className="leading-relaxed text-on-surface">
                    Forward pass, loss, then backpropagation — adjust for the next
                    shot.
                  </p>
                  <div className="rounded-lg border border-outline-variant/10 bg-surface p-4">
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-tight text-primary">
                      Key Visual
                    </h4>
                    <img
                      alt="Diagram"
                      className="w-full rounded-md shadow-inner"
                      src={DIAGRAM_IMG}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-secondary-container/50 px-4 py-2 text-xs font-bold text-on-secondary-container transition-all hover:bg-secondary-container"
                  >
                    Tell me more
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-surface-container-highest px-4 py-2 text-xs font-bold text-on-surface-variant transition-all hover:bg-surface-container-high"
                  >
                    Show math
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="border-t border-surface-container-high/50 bg-surface-container-lowest p-6">
            <div className="group relative">
              <textarea
                rows={2}
                placeholder="Ask StudyBee anything..."
                className="w-full resize-none rounded-xl border-none bg-surface-container-high p-4 pr-16 text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container text-white shadow-lg transition-all hover:scale-110 active:scale-95"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-[11px] font-bold uppercase tracking-widest text-outline-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">mic</span>
                Voice input
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  attach_file
                </span>
                Attach material
              </span>
            </div>
          </footer>
        </div>
      </main>

      <MobileBottomNav />
    </StudyBeeShell>
  );
}
