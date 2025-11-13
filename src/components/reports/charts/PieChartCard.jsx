import { PieChart } from "@mui/x-charts/PieChart";
import {
  areaElementClasses,
  axisClasses,
  chartsGridClasses,
  legendClasses,
} from "@mui/x-charts";
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';

function PieChartCard({data,title='Trades'}) {
  function PieCenterLabel({ children }) {
        const { width, height, left, top } = useDrawingArea();
        return (
            <StyledText x={left + width / 2} y={top + height / 2}>
                {children}
            </StyledText>
        );
    }
        const StyledText = styled('text')(({ theme }) => ({
            fill: 'white',
            textAnchor: 'middle',
            dominantBaseline: 'central',
            fontSize: 20,
        }));
        const settings = {
            margin: { right: 20 },
            width: 300,
            height: 300,
            hideLegend: false,
        };
  return (
    <PieChart
      series={[{ innerRadius: 70, outerRadius: 100, data }]}
      {...settings}
      sx={{
        [`.${axisClasses.left} .${axisClasses.label}`]: { fill: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.label}`]: { fill: "#fff" },
        [`.${axisClasses.left} .${axisClasses.tickLabel}`]: { fill: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
          fill: "#fff",
        },
        [`.${axisClasses.left} .${axisClasses.line}`]: { stroke: "#fff" },
        [`.${axisClasses.bottom} .${axisClasses.line}`]: { stroke: "#fff" },
        [`.${chartsGridClasses.horizontalLine}`]: {
          stroke: "#ffffffff",
          strokeDasharray: "5 3",
        },
        [`.${legendClasses.root}`]: { color: "#fff" },
        [`& .${areaElementClasses.root}`]: {
          fill: "url(#switch-color-id-1)",
        },
        background: "#212122ff",
        borderBottomRightRadius: 8,
        borderBottomLeftRadius: 8,
        textColor: "white",
      }}
    >
      <PieCenterLabel>{title}</PieCenterLabel>
    </PieChart>
  );
}
export default PieChartCard
