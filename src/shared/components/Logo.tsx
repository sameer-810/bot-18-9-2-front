/**
 * WhatsApp AI Agent brandmarks. No raster assets — the mark is drawn, so it is
 * crisp at every size and follows the theme.
 *
 * - <LogoMark> is the compact chat-bubble badge for the collapsed rail.
 * - <LogoFull> is the mark plus the product name, for the open sidebar and login.
 */

const BRAND_BLUE = "#1C50C8";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg text-white"
      style={{ width: size, height: size, background: BRAND_BLUE }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M12 3C7 3 3 6.6 3 11c0 2 .8 3.8 2.2 5.2L4.3 20.5l4.5-1.6c1 .3 2.1.5 3.2.5 5 0 9-3.6 9-8.4S17 3 12 3z" />
        <text
          x="12"
          y="13.6"
          textAnchor="middle"
          fontSize="6.4"
          fontWeight="800"
          fill="currentColor"
          stroke="none"
          fontFamily="IBM Plex Sans, Arial, sans-serif"
        >
          AI
        </text>
      </svg>
    </span>
  );
}

export function LogoFull({
  size = 32,
  className = "",
  subtitle = true,
}: {
  size?: number;
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">
          WhatsApp AI Agent
        </span>
        {subtitle && (
          <span className="block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
            Admin console
          </span>
        )}
      </span>
    </span>
  );
}
