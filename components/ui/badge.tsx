import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        
        // --- Unified Status Variants ---
        promocionado: "border-transparent bg-green-600 text-white hover:bg-green-600/90",
        aprobado: "border-transparent bg-sky-600 text-white hover:bg-sky-600/90",
        regular: "border-transparent bg-yellow-600 text-white hover:bg-yellow-600/90",
        cursando: "border-transparent bg-blue-600 text-white hover:bg-blue-600/90",
        no_cursando: "border-transparent bg-gray-600 text-white hover:bg-gray-600/90"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
