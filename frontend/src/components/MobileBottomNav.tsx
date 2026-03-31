import { Link, useLocation } from "react-router-dom";

const items = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/study", label: "Study", icon: "school" },
  { to: "/journal", label: "Journal", icon: "edit_note" },
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/settings", label: "Settings", icon: "settings" },
  { to: "/tips", label: "Tips", icon: "lightbulb" },
] as const;

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/15 bg-surface/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors " +
                (isActive
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface")
              }
              aria-current={isActive ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
