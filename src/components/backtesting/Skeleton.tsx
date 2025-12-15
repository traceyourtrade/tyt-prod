'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={100} height={16} />
      </div>
      <Skeleton variant="text" width={150} height={32} className="mb-2" />
      <Skeleton variant="text" width={80} height={14} />
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <div className="chart-card">
      <div className="flex justify-between items-center mb-6">
        <Skeleton variant="text" width={120} height={24} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton variant="rectangular" className="w-full h-64" />
    </div>
  );
}
