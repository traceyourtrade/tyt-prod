import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  variant?: "default" | "profit" | "loss" | "neutral"
  loading?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon,
  className,
  variant = "default",
  loading = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  const valueColorClass = 
    variant === "profit" ? "text-profit" :
    variant === "loss" ? "text-loss" :
    variant === "neutral" ? "text-muted-foreground" :
    "text-foreground"

  if (loading) {
    return (
      <div className={cn("card p-6 animate-pulse", className)}>
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="h-9 w-32 bg-muted rounded mb-2" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className={cn("card p-6 group hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-stat-label">{title}</p>
          <p className={cn("text-stat-value mt-1", valueColorClass)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-muted-sm mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              isPositive && "text-profit",
              isNegative && "text-loss",
              !isPositive && !isNegative && "text-muted-foreground"
            )}>
              {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
              {!isPositive && !isNegative && <Minus className="h-3.5 w-3.5" />}
              <span>
                {isPositive ? "+" : ""}{change.toFixed(2)}%
                {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
