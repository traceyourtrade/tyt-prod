import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border bg-transparent text-foreground",
        profit: "bg-[rgb(34,197,94,0.1)] text-[#22C55E]",
        loss: "bg-[rgb(239,68,68,0.1)] text-[#EF4444]",
        breakeven: "bg-muted text-muted-foreground",
        warning: "bg-[rgb(250,204,21,0.1)] text-[#FACC15]",
        long: "bg-[rgb(37,99,235,0.1)] text-[#2563EB]",
        short: "bg-[rgb(239,68,68,0.1)] text-[#EF4444]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
