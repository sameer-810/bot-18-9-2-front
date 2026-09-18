import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useCrumbs } from "./pageLabels";

export function Breadcrumbs() {
  const crumbs = useCrumbs();

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
      {crumbs.map((c, i) => (
        <span key={c.to} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
          {c.last ? (
            <span className="font-semibold text-foreground">{c.label}</span>
          ) : (
            <Link
              to={c.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
