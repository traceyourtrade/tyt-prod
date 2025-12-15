'use client';

import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    <div className={`rounded-xl border border-border bg-card p-5 group hover:shadow-md transition-all ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <div className="text-2xl font-semibold text-foreground mt-2 tracking-tight">
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
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend === 'up' ? 'text-profit' :
              trend === 'down' ? 'text-loss' :
              'text-muted-foreground'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
              {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
              {trend === 'neutral' && <Minus className="h-3.5 w-3.5" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="text-muted-foreground group-hover:text-primary transition-colors">
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        </div>
      </div>
      
      {progressBar && (
        <div className="mt-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressBar.value, 100)}%` }}
            />
          </div>
          {(progressBar.label || progressBar.secondaryLabel) && (
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              {progressBar.label && <span>{progressBar.label}</span>}
              {progressBar.secondaryLabel && <span>{progressBar.secondaryLabel}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
