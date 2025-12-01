import React from 'react';
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";

// Components
import TinyChart from "./TinyChart";
import Donut from "./Donut";


ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

interface DashWidgetsProps {
  data: { value: number }[];
  pnl: number;
  winners?: number;
  losers?: number;
  profitF: number;
  avgProfits: number;
  avgLoses: number;
  rrRatio: number;
  accBal: number;
  totalProfits: number;
  totalLoses: number;
}

const DashWidgets: React.FC<DashWidgetsProps> = ({ 
  data, 
  pnl, 
  winners = 0, 
  losers = 0, 
  profitF, 
  avgProfits, 
  avgLoses, 
  rrRatio, 
  accBal, 
  totalProfits, 
  totalLoses 
}) => {
  const winrate = winners || losers ? ((winners / (winners + losers)) * 100).toFixed(2) : 0;

  const dataWinLoss = {
    labels: ["Wins", "Losses"],
    datasets: [
      {
        data: [winners, losers],
        backgroundColor: ["#2fa87a", "lightcoral"],
        hoverBackgroundColor: ["#6dcbb4", "#F08080"],
        borderWidth: 5,
        borderColor: "transparent",
        spacing: 5,
      },
    ],
  };

  const optionsWinLoss = {
    responsive: true,
    cutout: "80%",
    rotation: -90,
    circumference: 180,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    elements: {
      arc: {
        borderRadius: 2,
      },
    },
  };

  const profitColor = pnl < 0 ? "text-red-400" : "text-[#2fa87aff]";
  const pnlFormatted = new Intl.NumberFormat('en', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(Math.abs(pnl));

  const avgProfitPercentage = avgProfits && avgLoses ? (avgProfits / (avgProfits + avgLoses)) * 100 : 0;
  const avgLossPercentage = avgProfits && avgLoses ? (avgLoses / (avgProfits + avgLoses)) * 100 : 0;

  return (
    <div className="w-full h-auto p-2.5 flex flex-wrap justify-between cursor-pointer ">
      {/* Net P&L Widget */}
      <div className="w-[18%] h-28 bg-[#141414] bg-cover bg-center bg-no-repeat rounded-xl transition-all duration-200 border border-[#1b1b1b] ">
        <div className="w-full h-28 rounded-xl flex flex-row items-start justify-start bg-[#141414]">
          <div className="w-2/5 flex flex-col items-start justify-center">
            <span className="font-inter text-xs font-semibold text-[#a6a6a6] mt-5 ml-5">
              Net P&L
              <label className="w-14 bg-green-500/10 flex items-center justify-evenly text-[#2fa87aff] text-xs rounded-lg absolute mt-[-19px] ml-14 border border-green-500">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="rise" width="1em" height="1em" fill="currentColor" aria-hidden="true" >
                                    <path d="M917 211.1l-199.2 24c-6.6.8-9.4 8.9-4.7 13.6l59.3 59.3-226 226-101.8-101.7c-6.3-6.3-16.4-6.2-22.6 0L100.3 754.1a8.03 8.03 0 000 11.3l45 45.2c3.1 3.1 8.2 3.1 11.3 0L433.3 534 535 635.7c6.3 6.2 16.4 6.2 22.6 0L829 364.5l59.3 59.3a8.01 8.01 0 0013.6-4.7l24-199.2c.7-5.1-3.7-9.5-8.9-8.8z" ></path>
                                </svg>
                70.5%
              </label>
            </span>
            <p className={`font-inter text-xl font-medium mt-5 ml-5 ${profitColor}`}>
              {pnl >= 0 ? `$${pnlFormatted}` : `-$${pnlFormatted}`}
            </p>
          </div>
          <div className="w-3/5 flex flex-col items-center justify-center">
            <TinyChart data={data} />
          </div>
        </div>
      </div>

      {/* Win-Rate Widget */}
      <div className="w-[18%] mx-[5] h-28 bg-[#141414] bg-cover bg-center bg-no-repeat rounded-xl transition-all duration-200 border border-[#1b1b1b]">
        <div className="w-full h-28 rounded-xl flex flex-row items-start justify-start bg-[#141414]/60 ">
          <div className="w-2/5 flex flex-col items-start justify-center">
            <span className="font-inter text-xs font-semibold text-[#a6a6a6] mt-5 ml-5">
              Win-Rate %
              {/* <InformationCircleIcon className="w-3 h-3 text-gray-400 ml-1" /> */}
            </span>
            <p className="font-inter text-xl text-gray-400 font-medium mt-5 ml-5">
              {winrate}%
            </p>
          </div>
          <div className="w-3/5 flex flex-col items-center justify-center">
            <div className="w-full h-auto flex flex-col items-center justify-center">
              <div className="w-20 h-20">
                <Doughnut data={dataWinLoss} options={optionsWinLoss} />
              </div>
              <div className="w-28 flex relative top-[-25px] items-center justify-between font-semibold">
                <span className="px-1 text-xs rounded text-green-500 bg-green-500/20">
                  {winners}
                </span>
                <span className="px-1 text-xs rounded text-red-400 bg-red-500/20">
                  {losers}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Factor Widget */}
      <div className="w-[18%] mx-[5] h-28 bg-[#141414] bg-cover bg-center bg-no-repeat rounded-xl transition-all duration-200 border border-[#1b1b1b]">
        <div className="w-full h-28 rounded-xl flex flex-row items-start justify-start bg-[#141414]/60  ">
          <div className="w-2/5 flex flex-col items-start justify-center">
            <span className="font-inter text-xs font-semibold text-[#a6a6a6] mt-5 ml-5">
              Profit Factor
              {/* <InformationCircleIcon className="w-3 h-3 text-gray-400 ml-1" /> */}
            </span>
            <p className="font-inter text-xl text-gray-400 font-medium mt-5 ml-5">
              {profitF}
            </p>
          </div>
          <div className="w-3/5 flex flex-col items-center justify-center">
            {/* <Donut totalProfits={totalProfits} totalLoses={totalLoses} /> */}
          </div>
        </div>
      </div>

      {/* Account Balance Widget */}
      <div className="w-[18%] mx-[5] h-28 bg-[#141414] bg-cover bg-center bg-no-repeat rounded-xl transition-all duration-200 border border-[#1b1b1b]">
        <div className="w-full h-28 rounded-xl flex flex-row items-start justify-start bg-[#141414]/60 p-5">
          <div className="w-2/5 flex flex-col items-start justify-center">
            <span className="absolute pt-10 font-inter text-xs font-semibold text-[#a6a6a6]">
              Account Balance
              <label className="ml-28 w-14 bg-green-500/10 flex items-center justify-evenly text-[#2fa87aff] text-xs rounded-lg border border-green-500">
                <svg viewBox="64 64 896 896" focusable="false" data-icon="rise" width="1em" height="1em" fill="currentColor" aria-hidden="true" >
                                    <path d="M917 211.1l-199.2 24c-6.6.8-9.4 8.9-4.7 13.6l59.3 59.3-226 226-101.8-101.7c-6.3-6.3-16.4-6.2-22.6 0L100.3 754.1a8.03 8.03 0 000 11.3l45 45.2c3.1 3.1 8.2 3.1 11.3 0L433.3 534 535 635.7c6.3 6.2 16.4 6.2 22.6 0L829 364.5l59.3 59.3a8.01 8.01 0 0013.6-4.7l24-199.2c.7-5.1-3.7-9.5-8.9-8.8z" ></path>
                                </svg>
                70.5%
              </label>
            </span>
            <p className="absolute pt-28 text-[#2fa87aff] text-xl font-inter font-medium">
              $ {accBal}
            </p>
          </div>
          <div className="w-3/5 flex flex-col items-center justify-center">
            <TinyChart data={data} />
          </div>
        </div>
      </div>

      {/* Risk-to-Reward Widget */}
      <div className="w-[18%] mx-[5] h-28 bg-[#141414] bg-cover bg-center bg-no-repeat rounded-xl transition-all duration-200 border border-[#1b1b1b]">
        <div className="w-full h-28 rounded-xl flex flex-col items-start justify-start bg-[#141414]/60">
          <div className="w-full flex flex-col items-start justify-center">
            <span className="font-inter text-xs font-semibold text-[#a6a6a6] mt-5 ml-5">
              Risk-to-Reward ratio
              {/* <InformationCircleIcon className="w-3 h-3 text-gray-400 ml-1" /> */}
            </span>
          </div>
          <div className="w-full flex flex-row items-center justify-start h-16">
            <p className="w-10 font-inter text-xl text-gray-400 font-medium mt-5 ml-5">
              {rrRatio}
            </p>

            <div className="w-2/3 h-2 bg-white/15 rounded-full ml-5 mt-4 flex">
              <div 
                className="h-2 rounded-l-full transition-all duration-300 hover:bg-green-500/80"
                style={{ 
                  width: `${avgProfitPercentage}%`,
                  backgroundColor: avgProfits ? "rgb(51, 157, 84)" : "transparent"
                }}
              >
                <p className="bg-green-500/10 text-[#2fa87aff] text-xs rounded border border-green-500 px-1 mt-4 float-left">
                  ${avgProfits || ""}
                </p>
              </div>
              <div 
                className="h-2 rounded-r-full transition-all duration-300 hover:bg-red-400/80"
                style={{ 
                  width: `${avgLossPercentage}%`,
                  backgroundColor: avgLoses ? "rgb(255, 99, 99)" : "transparent"
                }}
              >
                <p className="bg-red-500/10 text-red-400 text-xs rounded border border-red-400 px-1 mt-4 float-right">
                  -${avgLoses || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashWidgets;