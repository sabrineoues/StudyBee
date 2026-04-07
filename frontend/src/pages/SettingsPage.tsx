import { StudyBeeShell } from "../components/StudyBeeShell";
import { MarketingFooter } from "../components/MarketingFooter";

const FLAG_EN =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA7CA6jr2dtq6NjgNy7IwGwt6BoyNFt9w33lFkXuI91BNlqnEivew2ueqQ3xv7O2lKwZLuowd4N2ABS8bQ4Nae9XCPudhWQe18n1gRpRPZfTdxxsxbyjlzMwhIMC86nHI7dclrawRnzz8cB7mRmkKOxd26sNehQkUf7yL5YGiauvnrRek_2Jn9T4Z4Ix-6NAUwpHXoPSm6FeZs633GknBNy2EoZMMyPJr6__gzStJczzTA9SfrifoV66xlgCh15CbfkMOrPOx40OTE";
const FLAG_FR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCWMonCgOM0VdNdXkgcO8MAMKyTi1UDNYADm4ME8B2dZyEj_CKWjvboW6PH_MT3Hs4YWQQnahOnnFAftx3V2o-jhC5yVihciW9HfGep71UE3Cw90YWAI1DY4les8VqbFw70myAv0n_juc7Bx707qyBrVgrfhmbbYBmIplEuBclY71ZxhiG_oH68MvgURa5pvd-4ZuJl7uzrMG5zN7uDaYTbiKtzvNRJPATAtwP2MmCsQOFxdZvmBK2VL7TopizWGhFEeKluIwriIe0";
const PARENT_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC6z6BzsRjZoEbKrYDjNQoo8vfAQfKdZb27PHzXhL25Hc22oIJJIvLTYGCwkHgPV3K9JCuaykvNIumzqDckC1Bwo_lLCyMmiVda_P3VFcpJHydrOvuRdFGXErndn0qWFneQuAgB0ajpboObWG579SSBrH3_3oquJLH7_KAOiI9Ezta_QNQSIngVnGm4z8blrUG_VNH-JB4qM26WHNhSA-efKRbeuYMtqf6v4_4nGSOn-s4d1ThD3FImLSC2aFZdAUjshD8ERZVPsnA";

export function SettingsPage() {
  return (
    <StudyBeeShell>
      <main className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <header className="mb-16">
          <h1 className="font-headline mb-4 text-5xl font-extrabold tracking-tight text-on-surface">
            Settings
          </h1>
          <p className="font-body text-lg text-on-surface-variant">
            Customize your StudyBee environment for peak focus and flow.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="rounded-xl bg-surface-container-low p-8 md:col-span-2">
            <div className="mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined rounded-full bg-primary-container/20 p-3 text-primary">
                language
              </span>
              <div>
                <h2 className="font-headline text-2xl font-bold">App Language</h2>
                <p className="font-body text-sm text-on-surface-variant">
                  Choose your preferred interface language
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                className="flex flex-1 items-center justify-between rounded-lg border-2 border-primary bg-surface-container-highest p-6 font-bold text-primary transition-all hover:scale-[1.01]"
              >
                <span className="flex items-center gap-3">
                  <img
                    alt="English"
                    className="h-4 w-6 rounded-sm object-cover"
                    src={FLAG_EN}
                  />
                  English
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-between rounded-lg bg-surface-container-high p-6 font-medium text-on-surface-variant transition-all hover:bg-surface-container-highest"
              >
                <span className="flex items-center gap-3">
                  <img
                    alt="French"
                    className="h-4 w-6 rounded-sm object-cover"
                    src={FLAG_FR}
                  />
                  French
                </span>
                <span className="material-symbols-outlined opacity-0">
                  check_circle
                </span>
              </button>
            </div>
          </section>

          <section className="flex flex-col justify-between rounded-xl bg-surface-container-low p-8">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <span className="material-symbols-outlined rounded-full bg-primary-container/20 p-3 text-primary">
                  settings_input_antenna
                </span>
                <h2 className="font-headline text-2xl font-bold">Device Access</h2>
              </div>
              <p className="font-body mb-8 leading-relaxed text-on-surface-variant">
                Required for AI-powered focus tracking and vocal journaling
                sessions.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { icon: "videocam", label: "Camera Access" },
                { icon: "mic", label: "Microphone Access" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-full bg-surface-container-highest p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {row.icon}
                    </span>
                    <span className="font-label text-xs font-bold uppercase tracking-widest">
                      {row.label}
                    </span>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="peer h-6 w-11 rounded-full bg-outline-variant/30 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-tertiary-container/20 bg-tertiary-container/10 p-8">
            <div className="mb-6 flex items-center gap-4">
              <span className="material-symbols-outlined rounded-full bg-tertiary-container/30 p-3 text-tertiary">
                family_history
              </span>
              <h2 className="font-headline text-2xl font-bold text-tertiary">
                Parental Sharing
              </h2>
            </div>
            <p className="font-body mb-6 leading-relaxed text-on-tertiary-container">
              Keep your support network updated with your study progress
              automatically.
            </p>
            <div className="mb-6 rounded-lg bg-white/40 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <img
                    alt="Parent"
                    className="h-full w-full object-cover"
                    src={PARENT_IMG}
                  />
                </div>
                <div>
                  <p className="font-headline font-bold">Mom (Sarah)</p>
                  <p className="font-label text-[10px] text-tertiary">
                    DAILY REPORT ACTIVE
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Weekly Progress</span>
                  <span className="font-bold text-primary">Shared</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">Focus Streaks</span>
                  <span className="font-bold text-primary">Shared</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-tertiary py-4 font-headline font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              Manage Connections
            </button>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-primary p-8 text-white md:col-span-2">
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary-container opacity-40 blur-[80px]" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-tertiary-container opacity-40 blur-[80px]" />
            <div className="relative z-10">
              <div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <h2 className="font-headline mb-2 text-3xl font-extrabold">
                    AuraFlow AI
                  </h2>
                  <p className="font-body max-w-md text-on-primary/80">
                    Your interface adapts its color palette based on your
                    current emotional state and study intensity.
                  </p>
                </div>
                <span className="material-symbols-outlined text-4xl">
                  auto_awesome
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <div className="h-3 w-3 rounded-full bg-secondary-container" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    Motivated
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-primary shadow-lg"
                >
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    Calm (Active)
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    Tired
                  </span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-6 py-3 backdrop-blur-md transition-all hover:bg-white/30"
                >
                  <div className="h-3 w-3 rounded-full bg-tertiary-container" />
                  <span className="font-label text-[10px] font-black uppercase tracking-[0.15em]">
                    Stressed
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 flex flex-col justify-between gap-4 text-on-surface-variant sm:flex-row sm:items-center">
          <button
            type="button"
            className="rounded-full bg-surface-container-highest px-8 py-4 font-headline font-bold text-primary transition-transform hover:scale-105 active:scale-95"
          >
            Reset to Default
          </button>
          <button
            type="button"
            className="rounded-full bg-gradient-to-r from-primary to-primary-container px-12 py-4 font-headline font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            Save Changes
          </button>
        </footer>
      </main>

      <MarketingFooter />
    </StudyBeeShell>
  );
}
