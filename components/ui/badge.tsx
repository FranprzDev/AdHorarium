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
        [BadgeVariant.Promocionado]: "border-transparent bg-green-600 text-white hover:bg-green-600/90",
        [BadgeVariant.Aprobado]: "border-transparent bg-sky-600 text-white hover:bg-sky-600/90",
        [BadgeVariant.Regular]: "border-transparent bg-yellow-600 text-white hover:bg-yellow-600/90",
        [BadgeVariant.Cursando]: "border-transparent bg-blue-600 text-white hover:bg-blue-600/90",
        [BadgeVariant.NoCursando]: "border-transparent bg-gray-600 text-white hover:bg-gray-600/90",
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
