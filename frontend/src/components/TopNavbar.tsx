import { NavLink } from "react-router-dom";

const linkBase =
  "font-headline font-semibold text-sm tracking-tight transition-all duration-200 hover:scale-105";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          linkBase,
          isActive
            ? "text-primary border-b-2 border-primary pb-1"
            : "text-on-surface opacity-70 hover:opacity-100",
          "dark:text-surface-variant",
        ].join(" ")
      }
      end={to === "/"}
    >
      {label}
    </NavLink>
  );
}

export function TopNavbar() {
  return (
    <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-background/60 px-6 backdrop-blur-xl shadow-[0_20px_40px_rgba(55,45,37,0.06)] md:px-12">
      <div className="flex items-center gap-10">
        <NavLink
          to="/"
          className="font-headline text-2xl font-black tracking-tighter text-primary"
          end
        >
          StudyBee
        </NavLink>

        <div className="hidden items-center gap-8 md:flex">
          <NavItem to="/" label="Home" />
          <NavItem to="/study" label="Study" />
          <NavItem to="/journal" label="Journal" />
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/settings" label="Settings" />
          <NavItem to="/tips" label="Tips" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-primary transition-transform active:scale-95"
          aria-label="Account"
        >
          <span className="material-symbols-outlined text-3xl">
            account_circle
          </span>
        </button>
      </div>
    </nav>
  );
}
