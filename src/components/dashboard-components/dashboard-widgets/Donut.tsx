import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';

interface DonutProps {
  totalProfits: number;
  totalLoses: number;
}

const Donut: React.FC<DonutProps> = ({ totalProfits, totalLoses }) => {
  const data = [
    {
      id: 0,
      value: totalProfits,
      label: 'Total Profits',
      color: '#2fa87a'
    },
    {
      id: 1,
      value: Math.abs(totalLoses),
      label: 'Total Loses',
      color: 'rgb(255, 99, 99)'
    },
  ];

  return (
    <div className="w-full h-auto">
      <PieChart
        series={[
          {
            data,
            innerRadius: 80,
            outerRadius: 100,
            paddingAngle: 2,
            cornerRadius: 5,
            startAngle: 0,
            endAngle: 360,
            cx: 150,
            cy: 150,
          }
        ]}
        slotProps={{
          legend: {
            direction: 'row',
            position: { vertical: 'top', horizontal: 'right' },
            padding: 10,
            itemMarkWidth: 12,
            itemMarkHeight: 6,
            markGap: 10,
            itemGap: 20,
            labelStyle: {
              fill: 'white',
              fontSize: 14,
              fontWeight: 'bold',
            }
          }
        }}
        sx={{
          '& .MuiChartsText-cell': {
            fill: 'white'
          }
        }}
        width={300}
        height={300}
      />
    </div>
  );
};

export default Donut;