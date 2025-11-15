// CompareMain.tsx
import React, { useState, useEffect } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { areaElementClasses, axisClasses, chartsGridClasses, legendClasses, LineChart } from "@mui/x-charts";
import LineChartCard from "../charts/LineChartCard";
import { useMemo } from 'react';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';
import TradeGroupForm from './TradeGroupForm';
import { calculateCumulativePnL } from '@/utils/reports/calculateCumulativePnL';
import { calculatePerformanceMetrics } from '@/utils/reports/calculatePerformanceMetrics';
import useAccountDetails from '@/store/accountdetails';

interface Trade {
  Item: string;
  Profit: number;
  Commission?: number;
  Swap?: number;
  OpenTime: string;
  Type?: string;
  Side?: string;
  // Add other trade properties as needed
}

interface PerformanceMetrics {
  netPnL: number;
  avgDailyVolume: number;
  avgTradeWinLoss: number;
  maxTradeProfit: number;
  maxTradeLoss: number;
  avgNetTradePnL: number;
  profitFactor: number;
  avgHoldTime: string;
  // Add other metrics as needed
}

interface FormValues {
  symbol: string;
  startDate: string;
  endDate: string;
  tradeType: string;
  tradePL: string;
}

interface EnteredValues {
  group1: FormValues;
  group2: FormValues;
}

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

type Props = { selectedAccounts: any[]; trades: Trade[] }

const CompareMain = () => {
  
    const { selectedAccounts } = useAccountDetails()
    const allTrades =  selectedAccounts.flatMap((account: any) => account.tradeData || [])
  const [group1Trades, setGroup1Trades] = useState<Trade[]>([]);
  const [group2Trades, setGroup2Trades] = useState<Trade[]>([]);
  const [group1Metrics, setGroup1Metrics] = useState<PerformanceMetrics | null>(null);
  const [group2Metrics, setGroup2Metrics] = useState<PerformanceMetrics | null>(null);
  // const showStats =true;
  const showStats = group1Metrics && group2Metrics;
  
  const [enteredValues, setEnteredValues] = useState<EnteredValues>({
    group1: {
      symbol: '',
      startDate: '01-01-2000',
      endDate: new Date().toLocaleDateString('en-IN'),
      tradeType: 'buy',
      tradePL: 'win',
    },
    group2: {
      symbol: '',
      startDate: '01-01-2000',
      endDate: new Date().toLocaleDateString('en-IN'),
      tradeType: 'buy',
      tradePL: 'win',
    }
  });

  const handleInputChange = (group: keyof EnteredValues, field: keyof FormValues, value: string) => {
    console.log("called")
    setEnteredValues(prevValues => {
      const updatingGroup = prevValues[group];
      const updatedGroup = {
        ...updatingGroup,
        [field]: value
      };
      return { ...prevValues, [group]: updatedGroup };
    });
  };

  const handleCompare = () => {
    setGroup1Metrics(null);
    setGroup2Metrics(null);
    
    const group1TempTrades = allTrades.filter(trade => 
      trade.Item.toLowerCase() === enteredValues.group1.symbol.toLowerCase()
      // && trade.Type === enteredValues.group1.tradeType 
      // && (new Date(trade.OpenTime) >= new Date(enteredValues.group1.startDate) 
      // && new Date(trade.OpenTime) <= new Date(enteredValues.group1.endDate))
    );
    
    const group2TempTrades = allTrades.filter(trade => 
      trade.Item.toLowerCase() === enteredValues.group2.symbol.toLowerCase()
      // && trade.Type === enteredValues.group2.tradeType 
      // && (new Date(trade.OpenTime) >= new Date(enteredValues.group2.startDate) 
      // && new Date(trade.OpenTime) <= new Date(enteredValues.group2.endDate))
    );

    setGroup1Trades(group1TempTrades.length > 0 ? group1TempTrades : allTrades);
    setGroup2Trades(group2TempTrades.length > 0 ? group2TempTrades : allTrades);
  };

  useEffect(() => {
    if (group1Trades.length > 0) {
      setGroup1Metrics(calculatePerformanceMetrics(group1Trades));
    }
    if (group2Trades.length > 0) {
      setGroup2Metrics(calculatePerformanceMetrics(group2Trades));
    }
  }, [group1Trades, group2Trades]);

  const data1: PieChartData[] = [
    { label: 'Win Trades', value: group1Trades.filter(trade => trade.Profit > 0).length || 0, color: '#59c0a4' },
    { label: 'Loss Trades', value: group1Trades.filter(trade => trade.Profit < 0).length || 0, color: '#ec787dff' }
  ];

  const data2: PieChartData[] = [
    { label: 'Win Trades', value: group2Trades.filter(trade => trade.Profit > 0).length || 0, color: '#59c0a4' },
    { label: 'Loss Trades', value: group2Trades.filter(trade => trade.Profit < 0).length || 0, color: '#ec787dff' }
  ];

  const PieCenterLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { width, height, left, top } = useDrawingArea();
    return (
      <StyledText x={left + width / 2} y={top + height / 2}>
        {children}
      </StyledText>
    );
  };

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

  const getStats = (trades: Trade[], metrics: PerformanceMetrics | null) => {
    if (!trades || !metrics) return [];

    const totalCommissions = trades.reduce((sum, trade) => sum + (trade.Commission || 0), 0);
    const totalSwap = trades.reduce((sum, trade) => sum + (trade.Swap || 0), 0);

    return [
      { label: 'Total P&L', value: `$${metrics.netPnL.toFixed(2)}` },
      { label: 'Average daily volume', value: metrics.avgDailyVolume.toFixed(2) },
      { label: 'Average winning trade', value: `$${metrics.avgTradeWinLoss.toFixed(2)}` },
      { label: 'Average losing trade', value: `-$${Math.abs(metrics.avgTradeWinLoss).toFixed(2)}` },
      { label: 'Total number of trades', value: trades.length.toString() },
      { label: 'Number of winning trades', value: trades.filter(t => (t.Profit || 0) > 0).length.toString() },
      { label: 'Number of losing trades', value: trades.filter(t => (t.Profit || 0) < 0).length.toString() },
      { label: 'Number of break even trades', value: trades.filter(t => (t.Profit || 0) === 0).length.toString() },
      { label: 'Max consecutive wins', value: 'N/A' },
      { label: 'Max consecutive losses', value: 'N/A' },
      { label: 'Total commissions', value: `$${totalCommissions.toFixed(2)}` },
      { label: 'Total fees', value: '$0' },
      { label: 'Total swap', value: `$${totalSwap.toFixed(2)}` },
      { label: 'Largest profit', value: `$${metrics.maxTradeProfit.toFixed(2)}` },
      { label: 'Largest loss', value: `$${metrics.maxTradeLoss.toFixed(2)}` },
      { label: 'Average hold time (All trades)', value: metrics.avgHoldTime },
      { label: 'Average hold time (Winning trades)', value: 'N/A' },
      { label: 'Average hold time (Losing trades)', value: 'N/A' },
      { label: 'Average hold time (Scratch trades)', value: 'N/A' },
      { label: 'Average trade P&L', value: `$${metrics.avgNetTradePnL.toFixed(2)}` },
      { label: 'Profit factor', value: metrics.profitFactor.toFixed(2) },
    ];
  };

  const group1Stats = getStats(group1Trades, group1Metrics);
  const group2Stats = getStats(group2Trades, group2Metrics);

  const pieChartComp = (data: PieChartData[]) => {
    return (
      <PieChart
        series={[{ innerRadius: 70, outerRadius: 100, data }]}
        {...settings}
        sx={{
          [`.${axisClasses.left} .${axisClasses.label}`]: { fill: "#fff" },
          [`.${axisClasses.bottom} .${axisClasses.label}`]: { fill: "#fff" },
          [`.${axisClasses.left} .${axisClasses.tickLabel}`]: { fill: "#fff" },
          [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: { fill: "#fff" },
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
        <PieCenterLabel>Trades</PieCenterLabel>
      </PieChart>
    );
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-row justify-around">
        <TradeGroupForm 
          title={`Group #1 ${group1Trades.length} Trades Matched)`} 
          values={enteredValues} 
          updateValues={handleInputChange} 
          group={'group1'} 
        />
        <TradeGroupForm 
          title={`Group #2 ${group2Trades.length} Trades Matched)`} 
          values={enteredValues} 
          updateValues={handleInputChange} 
          group={'group2'} 
        />
      </div>
      <div className="my-2 rounded-lg text-center">
        <button 
          className="border-none bg-red-400 text-white px-5 py-2 rounded cursor-pointer font-bold transition-colors duration-300 hover:bg-red-500"
          onClick={handleCompare}
        >
          Apply
        </button>
      </div>
      {showStats && (
        <div className="flex flex-row w-full justify-between">
          <div className="w-1/2">
            <div className="border border-gray-400 mx-2 rounded-lg">
              <p className="text-xl px-2">STATISTICS (Group #1)</p>
              <p className="text-base px-2 pb-2">(ALL DATES)</p>
              <div className="flex flex-col gap-2 border-t border-gray-800">
                {group1Stats.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-800 mx-2">
                    <div className="text-sm text-gray-300 font-medium">{item.label}</div>
                    <div className="text-sm text-white font-semibold text-right">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-400 mx-2 rounded-lg mt-4">
              <p className="text-xl px-2">OVERALL EVALUATION (GROUP #1)</p>
              <p className="text-base px-2 pb-2">(ALL DATES)</p>
              <div className="flex flex-col gap-2 border-t border-gray-800">
                {pieChartComp(data1)}
              </div>
            </div>
            <div className="border border-gray-400 mx-2 rounded-lg mt-4">
              <div className="flex flex-row justify-start items-center">
                <p className="text-xl px-2">OVERALL EVALUATION (GROUP #1)</p>
                <p className="text-base px-2">(ALL DATES)</p>
              </div>
              <div className="flex flex-col gap-2 border-t border-gray-800">
                <LineChartCard 
                  title="Hello" 
                  xLabel="Date" 
                  yLabel="DAILY NET CUMULATIVE P&L" 
                  data={calculateCumulativePnL(group1Trades,"comparemain group1")} 
                  styles={{
                    borderBottomRightRadius: 8,
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                  }} 
                />
              </div>
            </div>
          </div>
          <div className="w-1/2">
            <div className="border border-gray-400 mx-2 rounded-lg">
              <p className="text-xl px-2">STATISTICS (Group #2)</p>
              <p className="text-base px-2 pb-2">(ALL DATES)</p>
              <div className="flex flex-col gap-2 border-t border-gray-800">
                {group2Stats.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-800 mx-2">
                    <div className="text-sm text-gray-300 font-medium">{item.label}</div>
                    <div className="text-sm text-white font-semibold text-right">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-400 mx-2 rounded-lg mt-4">
              <p className="text-xl px-2">OVERALL EVALUATION (GROUP #2)</p>
              <p className="text-base px-2 pb-2">(ALL DATES)</p>
              <div className="flex flex-col gap-2 border-t border-gray-800">
                {pieChartComp(data2)}
              </div>
            </div>
            <div className="border border-gray-400 mx-2 rounded-lg mt-4">
              <div className="flex flex-row justify-start items-center">
                <p className="text-xl px-2">OVERALL EVALUATION (GROUP #2)</p>
                <p className="text-base px-2">(ALL DATES)</p>
              </div>
              <div className="flex flex-col gap-2 border-t border-gray-800">
                <LineChartCard 
                  title="Hello" 
                  xLabel="Date" 
                  yLabel="DAILY NET CUMULATIVE P&L" 
                  data={calculateCumulativePnL(group2Trades,"comparemain group2")} 
                  styles={{
                    borderBottomRightRadius: 8,
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareMain;