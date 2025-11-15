// CrossAnalysisTable.tsx
import React, { useState } from 'react';

interface CrossAnalysisTableProps {
  data: Array<{
    day: string;
    values: string[];
  }>;
  symbols: string[];
}

const CrossAnalysisTable: React.FC<CrossAnalysisTableProps> = ({ data, symbols }) => {
  const [selectedOption, setSelectedOption] = useState<string>('Top 10');
  
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-white mb-4">Cross analysis</h3>
      <div className="flex gap-2 mb-2">
        <button 
          className={`px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
            selectedOption === 'Top 10' 
              ? 'bg-green-500 text-white border border-green-500' 
              : 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-green-500 hover:text-green-500'
          }`}
          onClick={() => setSelectedOption('Top 10')}
        >
          Top 10 symbols
        </button>
        <button 
          className={`px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
            selectedOption === 'Win Rate' 
              ? 'bg-green-500 text-white border border-green-500' 
              : 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-green-500 hover:text-green-500'
          }`}
          onClick={() => setSelectedOption('Win Rate')}
        >
          Win rate
        </button>
        <button 
          className={`px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
            selectedOption === 'P&L' 
              ? 'bg-green-500 text-white border border-green-500' 
              : 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-green-500 hover:text-green-500'
          }`}
          onClick={() => setSelectedOption('P&L')}
        >
          P&L
        </button>
        <button 
          className={`px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
            selectedOption === 'Trades' 
              ? 'bg-green-500 text-white border border-green-500' 
              : 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 hover:border-green-500 hover:text-green-500'
          }`}
          onClick={() => setSelectedOption('Trades')}
        >
          Trades
        </button>
      </div>
      <table className="w-full border-collapse bg-gray-900 rounded-xl border border-gray-800 shadow-lg overflow-hidden">
        <thead>
          <tr>
            <th className="bg-gray-800 px-4 py-3 text-sm font-semibold text-white border-b border-gray-700 text-center">Days</th>
            {symbols.map((symbol, index) => (
              <th key={index} className="bg-gray-800 px-4 py-3 text-sm font-semibold text-white border-b border-gray-700 text-center">
                {symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-800 transition-colors duration-200 hover:bg-gray-800">
              <td className="px-4 py-2 text-sm text-white text-center">{row.day}</td>
              {row.values.map((value, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-2 text-sm font-semibold text-center ${
                    value.startsWith('-') 
                      ? 'text-red-500 bg-red-900/30' 
                      : value === '$0' 
                        ? 'text-gray-400 bg-gray-800' 
                        : 'text-green-500 bg-green-900/30'
                  }`}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CrossAnalysisTable;