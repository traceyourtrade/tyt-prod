"use client";

import React, { useEffect, useState } from 'react';

interface TinyChartProps {
  data: { value: number }[];
}

const TinyChart: React.FC<TinyChartProps> = ({ data }) => {
  const [colors, setColors] = useState({ profit: '#22C55E', loss: '#EF4444' });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const profit = computedStyle.getPropertyValue('--profit').trim() || '#22C55E';
    const loss = computedStyle.getPropertyValue('--loss').trim() || '#EF4444';
    setColors({ profit, loss });
  }, []);

  if (!data || data.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">No data</span>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const width = 100;
  const height = 40;
  const padding = 2;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  
  const isPositive = values[values.length - 1] >= values[0];
  const lineColor = isPositive ? colors.profit : colors.loss;
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <polygon
        points={areaPoints}
        fill={`url(#${gradientId})`}
      />
      
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TinyChart;
