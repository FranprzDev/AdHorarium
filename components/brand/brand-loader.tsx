import { LogoMark } from "@/components/brand/logo"

/** Full-screen loading state with the brand mark. */
export function BrandLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background" role="status" aria-live="polite">
      <LogoMark className="h-14 w-14 animate-pulse" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
