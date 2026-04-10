import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { userService } from "../../services/userService";

const linkBase =
  "flex w-full items-center justify-start gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors";

function SideLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          linkBase,
          isActive
            ? "bg-surface-container-highest text-on-surface ring-1 ring-outline-variant/15"
            : "text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-background text-on-background">
      <div className="flex min-h-[100dvh] w-full gap-6 px-3 py-10 md:px-6">
        <aside className="w-64 shrink-0 self-start md:sticky md:top-10">
          <div className="rounded-xl bg-surface-container-low p-5 ring-1 ring-outline-variant/15">
            <div className="mb-5">
              <div className="font-headline text-xl font-black tracking-tighter text-primary">StudyBee</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Admin
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <SideLink to="/admin" label="Stats" end />
              <SideLink to="/admin/users" label="User management" />
              <SideLink to="/admin/sessions" label="Session management" />

              <div className="mt-3 border-t border-outline-variant/15 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    userService.signOut();
                    navigate("/sign-in");
                  }}
                  className={[
                    linkBase,
                    "text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-on-surface",
                  ].join(" ")}
                >
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
