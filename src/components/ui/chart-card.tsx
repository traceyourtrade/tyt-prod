import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
  loading?: boolean
}

export function ChartCard({ 
  title, 
  subtitle, 
  children, 
  className, 
  action,
  loading = false 
}: ChartCardProps) {
  if (loading) {
    return (
      <div className={cn("card p-6", className)}>
        <div className="animate-pulse">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          <div className="h-[250px] w-full bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("card p-6", className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-card-title font-medium">{title}</h3>
          {subtitle && (
            <p className="text-muted-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
