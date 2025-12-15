'use client';

import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  progressBar?: {
    value: number;
    label?: string;
    secondaryLabel?: string;
  };
  tooltip?: string;
  className?: string;
  animate?: boolean;
}

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return <span className="tabular-nums">{displayValue}</span>;
}

export default function MetricCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendValue,
  progressBar,
  className = '',
  animate = true,
}: MetricCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numericValue);
  
  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-[rgba(255,255,255,0.05)] flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={icon} className="h-3 w-3 text-[var(--foreground-muted)]" />
        </div>
        <span className="text-xs text-[var(--foreground-muted)] font-medium">{title}</span>
      </div>
      
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
            {animate && isNumeric ? (
              <>
                {value.toString().replace(/[0-9.-]/g, '').charAt(0)}
                <AnimatedNumber value={Math.abs(numericValue)} />
                {value.toString().replace(/[0-9.-]/g, '').slice(1)}
              </>
            ) : (
              value
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
            trend === 'up' ? 'bg-[var(--profit-bg)] text-[var(--profit)]' :
            trend === 'down' ? 'bg-[var(--loss-bg)] text-[var(--loss)]' :
            'bg-[rgba(255,255,255,0.05)] text-[var(--foreground-secondary)]'
          }`}>
            {trend === 'up' && <span>↑</span>}
            {trend === 'down' && <span>↓</span>}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      {progressBar && (
        <div className="mt-2.5">
          <div className="progress-bar h-1">
            <div 
              className="progress-bar-fill bg-[#3b82f6]"
              style={{ width: `${progressBar.value}%` }}
            />
          </div>
          {(progressBar.label || progressBar.secondaryLabel) && (
            <div className="flex justify-between mt-1.5 text-[10px]">
              {progressBar.label && (
                <span className="text-[var(--foreground-muted)]">{progressBar.label}</span>
              )}
              {progressBar.secondaryLabel && (
                <span className="text-[var(--foreground-muted)]">{progressBar.secondaryLabel}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
