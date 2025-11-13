// components/charts/BarChartCard.jsx
import React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import {
    areaElementClasses,
  axisClasses,
  chartsGridClasses,
  legendClasses,
   useDrawingArea, useYScale
} from "@mui/x-charts";

import "./ChartCard.css";

const BarChartCard = ({
  title = "Bar Chart",
  data = [],
  xKey = "date",
  yKey = "value",
  xLabel = "no-xLabel",
  yLabel = "no-yLabel",
  timeUnit = "Day",
}) => {
data.sort((a, b) => new Date(a.date) - new Date(b.date));
  const xLabels = data.map((d) => d.x || d.date);
  const yValues = data.map((d) => d.y || d.value);

  const positiveData = yValues.map((val) => (val >= 0 ? val : null));
  const negativeData = yValues.map((val) => (val < 0 ? val : null));
  return (
    <div>
      <div style={{ width: "100%", height: 300}}>
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
          series={[
          {
            data: positiveData,
            label: `${yLabel} (Positive)`,
            color: "#11B678",
            stack: "total",
          },
          {
            data: negativeData,
            label: `${yLabel} (Negative)`,
            color: "#FF3143",
            stack: "total",
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
            [`& .${areaElementClasses.root}`]: {
              fill: "url(#switch-color-id-1)",
            },
            background: "#212122ff",
            borderRadius: 8,
            textColor: "white",
          }}
        />
      </div>

    </div>
  );
};

export default BarChartCard;
