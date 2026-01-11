"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  secondaryColor?: string;
  showValue?: boolean;
  valueLabel?: string;
  className?: string;
  animate?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 60,
  strokeWidth = 6,
  primaryColor = "#4EBF94",
  secondaryColor,
  showValue = false,
  valueLabel,
  className,
  animate = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;

  const getSecondaryColor = () => {
    if (secondaryColor) return secondaryColor;
    return "rgba(255,255,255,0.1)";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getSecondaryColor()}
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            animate && "transition-all duration-700 ease-out"
          )}
          style={{
            filter: `drop-shadow(0 0 6px ${primaryColor}40)`,
          }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-foreground">
            {valueLabel || `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  );
};

interface DualCircularProgressProps {
  value1: number;
  value2: number;
  size?: number;
  strokeWidth?: number;
  color1?: string;
  color2?: string;
  label1?: string;
  label2?: string;
  centerValue?: string;
  className?: string;
}

export const DualCircularProgress: React.FC<DualCircularProgressProps> = ({
  value1,
  value2,
  size = 70,
  strokeWidth = 5,
  color1 = "#4EBF94",
  color2 = "#EF4444",
  label1,
  label2,
  centerValue,
  className,
}) => {
  const total = value1 + value2;
  const percentage1 = total > 0 ? (value1 / total) * 100 : 0;
  const percentage2 = total > 0 ? (value2 / total) * 100 : 0;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const offset1 = circumference - (percentage1 / 100) * circumference;
  const offset2Start = percentage1 > 0 ? circumference * (percentage1 / 100) : 0;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color1}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset1}
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color1}50)`,
          }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color2}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(percentage2 / 100) * circumference} ${circumference}`}
          strokeDashoffset={-offset2Start}
          className="transition-all duration-700 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color2}50)`,
          }}
        />
      </svg>
      {centerValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{centerValue}</span>
        </div>
      )}
      {(label1 || label2) && (
        <div className="flex items-center gap-2 mt-1.5">
          {label1 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-profit/20 text-profit">
              {label1}
            </span>
          )}
          {label2 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-loss/20 text-loss">
              {label2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CircularProgress;
