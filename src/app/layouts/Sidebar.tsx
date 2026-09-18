import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { filterSections, type MenuItem } from "./menu";
import { LogoMark, LogoFull } from "@/shared/components/Logo";
import { useSidebar } from "./sidebarContext";
import { useAppSelector } from "@/app/hooks";
import { cn } from "@/lib/utils";

/**
 * Responsive, role-aware sidebar with grouped sections:
 *   • md+ open      → 240px push column
 *   • md+ closed    → 64px icon-only rail
 *   • <md open      → fixed overlay drawer with scrim
 */
export function Sidebar() {
  const location = useLocation();
  const { open, setOpen } = useSidebar();
  const user = useAppSelector((s) => s.auth.user);
  const sections = useMemo(() => filterSections(user), [user]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 768px)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isDesktop) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const collapsed = isDesktop && !open;
  const showOverlay = !isDesktop && open;

  const isPathActive = (path?: string) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isItemActive = (item: MenuItem): boolean => {
    if (isPathActive(item.to)) return true;
    return item.children?.some(isItemActive) ?? false;
  };

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function renderItem(item: MenuItem, depth = 0) {
    const active = isItemActive(item);
    const sectionOpen = openSections[item.label] ?? active;

    if (item.children?.length) {
      if (collapsed) {
        const firstChild = item.children.find((c) => c.to);
        if (!firstChild?.to) return null;
        return (
          <NavLink
            key={item.label}
            to={firstChild.to}
            title={item.label}
            className={cn(
              "flex items-center justify-center rounded-lg p-2 transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            {item.icon ? <item.icon className="h-5 w-5 shrink-0" /> : null}
          </NavLink>
        );
      }

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "text-sidebar-accent-foreground",
              depth > 0 && "pl-8 text-xs",
            )}
          >
            {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronRight
              className={cn("h-3.5 w-3.5 transition-transform", sectionOpen && "rotate-90")}
            />
          </button>
          {sectionOpen && (
            <div className="ml-2 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
              {item.children.map((child) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!item.to) return null;

    if (collapsed) {
      return (
        <NavLink
          key={item.label}
          to={item.to}
          title={item.label}
          end
          className={({ isActive }) =>
            cn(
              "flex items-center justify-center rounded-lg p-2 transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )
          }
        >
          {item.icon ? <item.icon className="h-5 w-5 shrink-0" /> : null}
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.to}
        end
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            depth > 0 && "py-1.5 text-xs",
          )
        }
      >
        {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <>
      {showOverlay && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-out",
          "md:relative md:h-full md:translate-x-0",
          isDesktop ? (open ? "md:w-60" : "md:w-16") : "md:w-60",
          "fixed inset-y-0 left-0 z-40 w-60 md:z-auto",
          !isDesktop && (open ? "translate-x-0 shadow-2xl" : "-translate-x-full"),
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "gap-2.5 px-4",
          )}
        >
          {collapsed ? (
            <LogoMark size={34} />
          ) : (
            <div className="min-w-0 flex-1">
              <LogoFull size={32} />
            </div>
          )}
          {showOverlay && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {sections.map((section, si) => (
            <div key={section.heading ?? `s${si}`}>
              {collapsed
                ? si > 0 && <div className="mx-2 my-2 h-px bg-sidebar-border/60" />
                : section.heading && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                      {section.heading}
                    </p>
                  )}
              <div className={cn(collapsed ? "space-y-1" : "space-y-0.5")}>
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
