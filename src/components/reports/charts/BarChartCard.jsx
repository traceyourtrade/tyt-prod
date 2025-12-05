// components/charts/BarChartCard.jsx
"use client"

import React, { useEffect, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  areaElementClasses,
  axisClasses,
  chartsGridClasses,
  legendClasses,
} from "@mui/x-charts";
import { formatCompactNumber } from "@/utils/formatNumber";

const BarChartCard = ({
  title = "Bar Chart",
  data = [],
  xKey = "date",
  yKey = "value",
  xLabel = "no-xLabel",
  yLabel = "no-yLabel",
  timeUnit = "Day",
}) => {
  const [colors, setColors] = useState({
    profit: "#22C55E",
    loss: "#EF4444",
    chartText: "#9CA3AF",
    border: "#262626"
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      setColors({
        profit: computedStyle.getPropertyValue('--profit').trim() || "#22C55E",
        loss: computedStyle.getPropertyValue('--loss').trim() || "#EF4444",
        chartText: computedStyle.getPropertyValue('--chart-text').trim() || "#9CA3AF",
        border: computedStyle.getPropertyValue('--border').trim() || "#262626"
      });
    }
  }, []);

  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const xLabels = sortedData.map((d) => d.x || d.date);
  const yValues = sortedData.map((d) => d.y || d.value);

  const positiveData = yValues.map((val) => (val >= 0 ? val : null));
  const negativeData = yValues.map((val) => (val < 0 ? val : null));

  return (
    <div className="w-full h-full">
      <div style={{ width: "100%", height: "100%" }}>
        <BarChart
          xAxis={[
            {
              data: xLabels,
              scaleType: "band",
              label: xLabel,
              valueFormatter: (value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                });
              },
            },
          ]}
          grid={{ horizontal: true }}
          yAxis={[
            {
              tickFormat: (value) => `$${formatCompactNumber(value, 0)}`,
              width: 65,
            },
          ]}
          series={[
            {
              data: positiveData,
              label: `${yLabel} (Positive)`,
              color: colors.profit,
              stack: "total",
            },
            {
              data: negativeData,
              label: `${yLabel} (Negative)`,
              color: colors.loss,
              stack: "total",
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
            background: "transparent",
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );
};

export default BarChartCard;
