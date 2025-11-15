// components/charts/LineChartCard.tsx
import React from "react";
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

function ColorSwitch({ threshold=0, color1, color2, id,data }: ColorSwitchProps) {
  const { top, height, bottom } = useDrawingArea();
  const svgHeight = top + bottom + height;

  const scale = useYScale(); // Debugging line to check the scale function
  const y0 = scale(threshold)|| 0;
  console.log("data",data.length,"Y0 Position:", y0,"svgHeight",svgHeight); // Debugging line to check the y0 position
  
  // Fix: Ensure offset is always a valid number between 0 and 1
  const off = y0 / svgHeight// Default to middle if calculation fails
  console.log("data",data.length,"Offset:", off); // Debugging line to check the offset value

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
  // Ensure data is valid before processing
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
    <div>
      <div style={{ width: "100%", height: 300 }}>
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
              color: "#4EBF94",
            },
          ]}
          sx={{
            [`.${axisClasses.left} .${axisClasses.label}`]: { fill: "#fff" },
            [`.${axisClasses.bottom} .${axisClasses.label}`]: { fill: "#fff" },
            [`.${axisClasses.left} .${axisClasses.tickLabel}`]: { fill: "#fff" },
            [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: { fill: "#fff" },
            [`.${axisClasses.left} .${axisClasses.line}`]: { stroke: "#fff" },
            [`.${axisClasses.bottom} .${axisClasses.line}`]: { stroke: "#fff" },
            [`.${chartsGridClasses.horizontalLine}`]: {
              stroke: "#ffffff80",
              strokeDasharray: "5 3",
            },
            [`.${legendClasses.root}`]: { color: "#fff" },
            [`.${markElementClasses.root}`]: {
              strokeWidth: 1,
              fill: "#28b384ff",
              r: 2,
            },
            [`& .${areaElementClasses.root}`]: {
              fill: "url(#switch-color-id-1)",
            },
            background: "#212122ff",
            borderRadius: 8,
            textColor: "white",
            ...styles
          }}
        >
          <ColorSwitch
            color1="#11B678"
            color2="#FF3143"
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