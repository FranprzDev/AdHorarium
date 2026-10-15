import { cn } from "@/lib/utils"
import { LogoTone } from "@/types/enums"

const GRID_CELLS = [10, 26, 42].flatMap((y) => [10, 26, 42].map((x) => ({ x, y })))

interface LogoMarkProps {
  className?: string
  title?: string
}

/** AdHorarium mark: an "A" drawn over a timetable grid, with a brass crossbar. */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-9 w-9 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="64" height="64" rx="14" fill="#13294B" />
      <g fill="#F7F4EC" opacity=".14">
        {GRID_CELLS.map(({ x, y }) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" rx="2" />
        ))}
      </g>
      <path d="M17 49 32 15 47 49" fill="none" stroke="#F7F4EC" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 37h16" fill="none" stroke="#C9973F" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

interface LogoProps {
  tone?: LogoTone
  showTagline?: boolean
  className?: string
  markClassName?: string
}

/** Full lockup: mark + "AdHorarium" wordmark, optionally with the short "UTN · FRT" tagline. */
export function Logo({ tone = LogoTone.Default, showTagline = false, className, markClassName }: LogoProps) {
  const isInverted = tone === LogoTone.Inverted
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-[1.35rem] font-semibold tracking-tight",
            isInverted ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Ad<span className={isInverted ? "text-brand" : "text-brand-strong"}>Horarium</span>
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em]",
              isInverted ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            UTN · FRT
          </span>
        )}
      </span>
    </span>
  )
}
