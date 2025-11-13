// TradeInputGroup.tsx
import React from 'react';

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

interface TradeGroupFormProps {
  title: string;
  values: EnteredValues;
  updateValues: (group: keyof EnteredValues, field: keyof FormValues, value: string) => void;
  group: keyof EnteredValues;
}

const TradeGroupForm: React.FC<TradeGroupFormProps> = ({ title, values, updateValues, group }) => {
  return (
    <div className="bg-gray-900 p-5 rounded-xl shadow-lg border border-gray-800 transition-all duration-200 hover:border-green-500 m-4 w-full">
      <h3 className="text-base font-semibold text-white mb-5 pb-3 border-b border-gray-800">{title}</h3>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 w-18 text-left">Symbol</label>
        <input 
          type="text" 
          className="px-4 py-3 border border-gray-800 rounded-lg text-sm bg-gray-800 text-white outline-none transition-all duration-200 w-50 hover:bg-gray-700 hover:border-green-500 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 focus:bg-gray-700" 
          placeholder="Enter Symbol" 
          value={values[group].symbol} 
          onChange={e => updateValues(group, "symbol", e.target.value)} 
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 w-18 text-left">Tags</label>
        <input 
          type="text" 
          className="px-4 py-3 border border-gray-800 rounded-lg text-sm bg-gray-800 text-white outline-none transition-all duration-200 w-50 hover:bg-gray-700 hover:border-green-500 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 focus:bg-gray-700" 
          placeholder="" 
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 w-18 text-left">Side</label>
        <select 
          className={`px-4 py-3 border border-gray-800 rounded-lg text-sm bg-gray-800 text-white outline-none transition-all duration-200 w-50 hover:bg-gray-700 hover:border-green-500 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 focus:bg-gray-700 appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"%3e%3cpath d=\"M7 10l5 5 5-5z\" fill=\"%234ebf94\"/%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]"`}
          value={values[group].tradeType} 
          onChange={e => updateValues(group, "tradeType", e.target.value)}
        >
          <option value="buy">Long</option>
          <option value="sell">Short</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 w-18 text-left">Start date</label>
        <input 
          type="text" 
          className="px-4 py-3 border border-gray-800 rounded-lg text-sm bg-gray-800 text-white outline-none transition-all duration-200 w-50 hover:bg-gray-700 hover:border-green-500 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 focus:bg-gray-700" 
          placeholder="DD-MM-YYYY" 
          value={values[group].startDate} 
          onChange={e => updateValues(group, "startDate", e.target.value)} 
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 w-18 text-left">Trade P&L</label>
        <select 
          className={`px-4 py-3 border border-gray-800 rounded-lg text-sm bg-gray-800 text-white outline-none transition-all duration-200 w-50 hover:bg-gray-700 hover:border-green-500 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 focus:bg-gray-700 appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"%3e%3cpath d=\"M7 10l5 5 5-5z\" fill=\"%234ebf94\"/%3e%3c/svg%3e')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]"`}
          value={values[group].tradePL} 
          onChange={e => updateValues(group, "tradePL", e.target.value)}
        >
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </select>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-500 w-18 text-left">End date</label>
        <input 
          type="text" 
          className="px-4 py-3 border border-gray-800 rounded-lg text-sm bg-gray-800 text-white outline-none transition-all duration-200 w-50 hover:bg-gray-700 hover:border-green-500 focus:border-green-500 focus:shadow-lg focus:shadow-green-500/20 focus:bg-gray-700" 
          placeholder="DD-MM-YYYY" 
          value={values[group].endDate} 
          onChange={e => updateValues(group, "endDate", e.target.value)} 
        />
      </div>
    </div>
  );
};

export default TradeGroupForm;