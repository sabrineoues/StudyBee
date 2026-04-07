import { NavLink } from "react-router-dom";

export function TopNavbarSignUp() {
  return (
    <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-background/60 px-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(55,45,37,0.06)] md:px-12 relative">
      <div className="flex items-center gap-10">
        <NavLink
          to="/"
          className="font-headline text-2xl font-black tracking-tighter text-primary"
          end
        >
          StudyBee
        </NavLink>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            [
              "font-headline text-xl md:text-2xl font-black tracking-tight transition-colors",
              isActive ? "text-primary" : "text-on-surface/80 hover:text-on-surface",
            ].join(" ")
          }
        >
          Home
        </NavLink>
      </div>

      <div className="flex items-center gap-4">
        <NavLink
          to="/sign-in"
          className="rounded-full bg-surface-container-highest/70 px-5 py-2.5 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant/10 transition-transform duration-200 hover:scale-105 hover:bg-surface-container-highest active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Sign in
        </NavLink>

        <NavLink
          to="/sign-up"
          className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm ring-1 ring-outline-variant/10 transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Sign up
        </NavLink>
      </div>
    </nav>
  );
}
