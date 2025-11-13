// SummaryTable.tsx
import React from 'react';

interface SummaryTableRow {
  day: string;
  winPercent: string;
  netPnl: string;
  tradeCount: number;
  avgDailyVolume: string;
  avgWin: string;
  avgLoss: string;
}

interface SummaryTableProps {
  data: SummaryTableRow[];
}

const SummaryTable: React.FC<SummaryTableProps> = ({ data }) => {
  const headers = ['Days', 'Win %', 'Net P&L', 'Trade count', 'Avg daily volume', 'Avg win', 'Avg loss'];

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-white mb-4">Summary</h3>
      <table className="w-full border-collapse bg-gray-900 rounded-xl border border-gray-800 shadow-lg overflow-hidden">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="bg-gray-800 px-4 py-3 text-sm font-semibold text-white border-b border-gray-700 text-center">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-800 transition-colors duration-200 hover:bg-gray-800">
              <td className="px-4 py-2 text-sm text-white text-center">{row.day}</td>
              <td className="px-4 py-2 text-sm text-white text-center">{row.winPercent}%</td>
              <td className={`px-4 py-2 text-sm font-semibold text-center ${
                row.netPnl.startsWith('-') ? 'text-red-500' : 'text-green-500'
              }`}>
                {row.netPnl}
              </td>
              <td className="px-4 py-2 text-sm text-white text-center">{row.tradeCount}</td>
              <td className="px-4 py-2 text-sm text-white text-center">{row.avgDailyVolume}</td>
              <td className={`px-4 py-2 text-sm font-semibold text-center ${
                row.avgWin.startsWith('-') ? 'text-red-500' : 'text-green-500'
              }`}>
                {row.avgWin}
              </td>
              <td className={`px-4 py-2 text-sm font-semibold text-center ${
                row.avgLoss.startsWith('-') ? 'text-red-500' : 'text-green-500'
              }`}>
                {row.avgLoss}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryTable;