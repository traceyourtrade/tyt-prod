import * as React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  sidebarCollapsed?: boolean
}

export function PageContainer({ 
  children, 
  className,
  sidebarCollapsed = false 
}: PageContainerProps) {
  return (
    <main 
      className={cn(
        "min-h-[calc(100vh-4rem)] transition-all duration-300",
        sidebarCollapsed ? "ml-[72px]" : "ml-64",
        className
      )}
    >
      <div className="p-6">
        {children}
      </div>
    </main>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  action, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-page-title">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

interface PageSectionProps {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PageSection({ 
  title, 
  description, 
  action, 
  children, 
  className 
}: PageSectionProps) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-section-title">{title}</h2>
            )}
            {description && (
              <p className="text-muted-sm mt-0.5">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
