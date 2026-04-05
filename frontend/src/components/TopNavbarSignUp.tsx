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

      <div className="flex items-center gap-4" />
    </nav>
  );
}
