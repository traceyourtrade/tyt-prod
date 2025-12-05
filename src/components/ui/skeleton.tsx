import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse bg-muted rounded-md", className)}
      {...props}
    />
  )
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card p-6", className)}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-9 w-32 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full max-w-[100px]" />
        </td>
      ))}
    </tr>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card p-6", className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </div>
  )
}
