// components/charts/LineChartCard.tsx
"use client"

import React, { useEffect, useState } from "react";
import { LineChart, areaElementClasses } from "@mui/x-charts/LineChart";
import {
  axisClasses,
  chartsGridClasses,
  legendClasses,
  useDrawingArea,
  useYScale
} from "@mui/x-charts";
import { markElementClasses } from "@mui/x-charts";

interface ChartData {
  date?: string;
  x?: string;
  y?: number;
  value?: number;
}

interface LineChartCardProps {
  title?: string;
  data?: ChartData[];
  xKey?: string;
  yKey?: string;
  xLabel?: string;
  yLabel?: string;
  timeUnit?: string;
  isArea?: boolean;
  styles?: React.CSSProperties;
}

interface ColorSwitchProps {
  threshold: number;
  color1: string;
  color2: string;
  id: string;
  data: ChartData[];
}

function ColorSwitch({ threshold = 0, color1, color2, id, data }: ColorSwitchProps) {
  const { top, height, bottom } = useDrawingArea();
  const svgHeight = top + bottom + height;

  const scale = useYScale();
  const y0 = scale(threshold) || 0;

  const off = y0 / svgHeight;

  return (
    <defs>
      <linearGradient
        id={id}
        x1="0"
        x2="0"
        y1="0"
        y2={`${svgHeight}px`}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={off} stopColor={color1} stopOpacity={1} />
        <stop offset={off} stopColor={color2} stopOpacity={1} />
      </linearGradient>
    </defs>
  );
}

const LineChartCard: React.FC<LineChartCardProps> = ({
  title = "Line Chart",
  data = [],
  xKey = "date",
  yKey = "value",
  xLabel = "no-xLabel",
  yLabel = "no-yLabel",
  timeUnit = "Day",
  isArea = true,
  styles
}) => {
  const [colors, setColors] = useState({
    primary: "#2563EB",
    profit: "#22C55E",
    loss: "#EF4444",
    chartText: "#9CA3AF",
    border: "#262626"
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      setColors({
        primary: computedStyle.getPropertyValue('--primary').trim() || "#2563EB",
        profit: computedStyle.getPropertyValue('--profit').trim() || "#22C55E",
        loss: computedStyle.getPropertyValue('--loss').trim() || "#EF4444",
        chartText: computedStyle.getPropertyValue('--chart-text').trim() || "#9CA3AF",
        border: computedStyle.getPropertyValue('--border').trim() || "#262626"
      });
    }
  }, []);

  const validData = Array.isArray(data) ? data.filter(item => item !== null && item !== undefined) : [];
  
  const sortedData = [...validData].sort((a, b) => {
    try {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  });

  const xLabels = sortedData.map((d) => d.x || d.date || "").filter(Boolean);

  return (
    <div className="w-full h-full">
      <div style={{ width: "100%", height: "100%" }}>
        <LineChart
          xAxis={[
            {
              data: xLabels,
              scaleType: "point" as const,
              label: xLabel,
            },
          ]}
          grid={{ horizontal: true }}
          yAxis={[
            {
              tickFormat: (value: number) => `$${value.toLocaleString()}`,
              width: 65,
            },
          ]}
          series={[
            {
              data: sortedData.map((d) => d.y || d.value || 0),
              label: yLabel,
              area: isArea,
              showMark: true,
              color: colors.primary,
            },
          ]}
          sx={{
            [`.${axisClasses.left} .${axisClasses.label}`]: { 
              fill: colors.chartText
            },
            [`.${axisClasses.bottom} .${axisClasses.label}`]: { 
              fill: colors.chartText
            },
            [`.${axisClasses.left} .${axisClasses.tickLabel}`]: { 
              fill: colors.chartText,
              fontSize: 11 
            },
            [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: { 
              fill: colors.chartText,
              fontSize: 11 
            },
            [`.${axisClasses.left} .${axisClasses.line}`]: { 
              stroke: colors.border
            },
            [`.${axisClasses.bottom} .${axisClasses.line}`]: { 
              stroke: colors.border
            },
            [`.${chartsGridClasses.horizontalLine}`]: {
              stroke: colors.border,
              strokeDasharray: "4 4",
              strokeOpacity: 0.5
            },
            [`.${legendClasses.root}`]: { 
              display: "none"
            },
            [`.${markElementClasses.root}`]: {
              strokeWidth: 2,
              fill: colors.primary,
              r: 3,
            },
            [`& .${areaElementClasses.root}`]: {
              fill: "url(#switch-color-id-1)",
              opacity: 0.3
            },
            background: "transparent",
            borderRadius: 8,
            ...styles
          }}
        >
          <ColorSwitch
            color1={colors.profit}
            color2={colors.loss}
            threshold={0}
            id="switch-color-id-1"
            data={sortedData}
          />
        </LineChart>
      </div>
    </div>
  );
};

export default LineChartCard;
