import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { MoreHorizontal, LogOut, Moon, Sun } from "lucide-react";
import { filterSections, mobileTabs } from "./menu";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/modules/auth/authSlice";
import { ROLE_LABELS } from "@/modules/auth/hooks/usePermissions";
import { useTheme } from "@/app/theme";
import { Sheet } from "@/shared/components/Sheet";
import { cn, initialsOf } from "@/lib/utils";

/**
 * Bottom tab bar — the phone's primary navigation, below `md` only.
 *
 * Four tabs and a "More" sheet — never five; a fifth label truncates at 390px.
 * The desktop sidebar is untouched; DESIGN.md protects it.
 */
export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs = useMemo(() => mobileTabs(user).slice(0, 4), [user]);
  const sections = useMemo(() => filterSections(user), [user]);
  const tabPaths = useMemo(() => new Set(tabs.map((t) => t.to)), [tabs]);

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  /** "More" lights up when the current screen is not one of the tabs. */
  const moreActive = !tabs.some((t) => isActive(t.to));

  function go(to: string) {
    setMoreOpen(false);
    navigate(to);
  }

  function logout() {
    setMoreOpen(false);
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  return (
    <>
      <nav aria-label="Primary" className="pg-bottombar pg-safe-bottom md:hidden">
        <div className="flex items-stretch">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to as string}
              aria-label={tab.label}
              className={({ isActive: active }) =>
                cn(
                  "pg-tap flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {tab.icon && <tab.icon className="h-5 w-5" />}
              <span className="max-w-full truncate px-1 text-[10px] font-medium leading-none">
                {tab.shortLabel ?? tab.label}
              </span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More"
            aria-expanded={moreOpen}
            className={cn(
              "pg-tap flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors",
              moreActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu">
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
          <span className="pg-disc">{initialsOf(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.role ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
        </div>

        {sections.map((section, si) => {
          const items = section.items.filter((i) => i.to && !tabPaths.has(i.to));
          if (items.length === 0) return null;
          return (
            <div key={section.heading ?? `s${si}`} className="mb-4">
              {section.heading && (
                <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to as string)}
                    className={cn(
                      "pg-tap flex w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      isActive(item.to)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent",
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="space-y-0.5 border-t border-border pt-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="pg-tap flex w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="pg-tap flex w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </Sheet>
    </>
  );
}
