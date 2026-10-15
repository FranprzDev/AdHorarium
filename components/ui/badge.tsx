import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { BadgeVariant } from "@/types/enums"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        [BadgeVariant.Default]: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        [BadgeVariant.Secondary]: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        [BadgeVariant.Destructive]: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        [BadgeVariant.Outline]: "text-foreground",

        // --- Unified Status Variants ---
        [BadgeVariant.Promocionado]:
          "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300",
        [BadgeVariant.Aprobado]:
          "border-sky-600/30 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
        [BadgeVariant.Regular]:
          "border-amber-600/30 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300",
        [BadgeVariant.Cursando]:
          "border-sky-600/30 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300",
        [BadgeVariant.NoCursando]: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: BadgeVariant.Default,
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
