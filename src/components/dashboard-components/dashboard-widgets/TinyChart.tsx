import { Box } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

interface DataPoint {
  x: number;
  y: number;
}

interface FullScreenChartProps {
  data: DataPoint[];
}

interface TinyChartProps {
  data: { value: number }[];
}

const FullScreenChart: React.FC<FullScreenChartProps> = ({ data }) => {
  const values = data.map(item => item.y);
  const minY = Math.min(...values, 0);
  const maxY = Math.max(...values, 0);

  return (
    <Box
      sx={{
        width: '80%',
        height: '60px',
        bgcolor: 'transparent',
        overflow: 'hidden',
        borderRadius: 1,
        marginTop: "45px",
        marginRight: "5px"
      }}
    >
      <LineChart
        dataset={data}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        xAxis={[{
          dataKey: 'x',
          hide: true,
          axisLine: { visible: false },
          tick: { visible: false },
        }]}
        yAxis={[{
          hide: true,
          axisLine: { visible: false },
          tick: { visible: false },
          scaleType: 'linear',
          min: minY,
          max: maxY,
        }]}
        series={[
          {
            dataKey: 'y',
            color: 'rgb(66, 84, 251)',
            showMark: false,
            area: true,
            curve: 'linear'
          },
        ]}
        grid={null}
        sx={{
          '.MuiLineElement-root': {
            strokeWidth: 2,
          },
          '.MuiAreaElement-root': {
            fill: 'url(#area-gradient)',
          },
          '.MuiChartsAxis-tickContainer': {
            display: 'none',
          },
          '.MuiChartsAxis-left .MuiChartsAxis-line, .MuiChartsAxis-bottom .MuiChartsAxis-line': {
            display: 'none',
          },
        }}
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.00005} />
          </linearGradient>
        </defs>
      </LineChart>
    </Box>
  );
};

const TinyChart: React.FC<TinyChartProps> = ({ data }) => {
  const chartData = data.map((item, index) => ({
    x: index,
    y: item.value
  }));

  return <FullScreenChart data={chartData} />;
}

export default TinyChart;