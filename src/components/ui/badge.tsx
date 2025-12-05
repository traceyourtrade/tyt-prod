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
        profit: "bg-[rgb(16,185,129,0.1)] text-[#10b981] dark:bg-[rgb(52,211,153,0.1)] dark:text-[#34d399]",
        loss: "bg-[rgb(239,68,68,0.1)] text-[#ef4444] dark:bg-[rgb(248,113,113,0.1)] dark:text-[#f87171]",
        breakeven: "bg-muted text-muted-foreground",
        long: "bg-[rgb(59,130,246,0.1)] text-[#3b82f6]",
        short: "bg-[rgb(239,68,68,0.1)] text-[#ef4444]",
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
