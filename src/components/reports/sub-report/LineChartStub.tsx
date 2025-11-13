// LineChartStub.tsx
import React from 'react';
import { areaElementClasses, axisClasses, chartsGridClasses, legendClasses, LineChart } from '@mui/x-charts';
import ColorSwitch from '@/utils/reports/colorSwitch';

const LineChartStub: React.FC = () => {
  return (
    <LineChart
      series={[
        {
          data: [2, 5.5, 2, 8.5, 1.5, -5],
        },
        {
          data: [21, 15.15, 12, 18.5, 11.5, 15],
        },
      ]}
      sx={{
        [`.${axisClasses.left} .${axisClasses.label}`]: { fill: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.label}`]: { fill: "#fff" },
        [`.${axisClasses.left} .${axisClasses.tickLabel}`]: { fill: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: { fill: "#fff" },
        [`.${axisClasses.left} .${axisClasses.line}`]: { stroke: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.line}`]: { stroke: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.tick}`]: { stroke: "#fff" },
        [`.${axisClasses.left} .${axisClasses.tick}`]: { stroke: "#fff" },
        [`.${chartsGridClasses.horizontalLine}`]: {
          stroke: "#ffffffff",
          strokeDasharray: "5 3",
        },
        [`.${legendClasses.root}`]: { color: '#fff' },
        [`& .${areaElementClasses.root}`]: {
          fill: 'url(#switch-color-id-1)',
          filter: 'none',
        },
        background: "#212122ff",
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        borderTopLeftRadius: 8,
        textColor: "white",
      }}
    >
      <ColorSwitch
        color1="#11B678"
        color2="#FF3143"
        threshold={0}
        id="switch-color-id-1"
      />
      <rect x={0} y={0} width={5} height="100%" fill="url(#switch-color-id-1)" />
    </LineChart>
  );
};

export default LineChartStub;