interface Trade {
  Profit: number;
}

interface QuickStatsProps {
  dailyData: Trade[];
}


const QuickStats = ({ dailyData }: QuickStatsProps) => {
  const totalPnL = (dailyData || []).reduce((sum, trade) => sum + (trade.Profit || 0), 0);
  const formattedPnL = totalPnL < 0 ? `-$${Math.abs(totalPnL).toFixed(2)}` : `$${totalPnL.toFixed(2)}`;

  return (
    <>
      <h2 className="font-sans text-gray-200 relative top-2.5 z-[-1] text-2xl font-semibold">Quick Stats</h2>

      <div className="w-[90%] max-w-[500px] h-auto min-h-[200px] flex flex-col bg-gray-500/25 backdrop-blur-sm shadow-lg border-b border-white/20 rounded-[20px] p-0.5 mt-5 relative">
        <div className="w-full h-auto flex flex-wrap items-center justify-evenly pt-3.5">
          <div className="w-1/3 h-auto mx-1.25 my-2.5 text-center">
            <span className="text-xs text-white font-semibold">GROSS P&L</span>
            <p className={`font-semibold ${
              totalPnL > 0 ? "text-teal-500" : totalPnL < 0 ? "text-red-400" : "text-gray-400"
            }`}>
              {formattedPnL}
            </p>
          </div>
          <div className="w-1/3 h-auto mx-1.25 my-2.5 text-center">
            <span className="text-xs text-white font-semibold">LOSERS</span>
            <p className="font-semibold text-gray-400">{(dailyData || []).filter(trade => trade.Profit < 0).length}</p>
          </div>
          <div className="w-1/3 h-auto mx-1.25 my-2.5 text-center">
            <span className="text-xs text-white font-semibold">WINRATE</span>
            <p className="font-semibold text-gray-400">
              {Math.round(((dailyData || []).filter(trade => trade.Profit > 0).length / (dailyData?.length || 1)) * 100)}%
            </p>
          </div>
          <div className="w-1/3 h-auto mx-1.25 my-2.5 text-center">
            <span className="text-xs text-white font-semibold">WINNERS</span>
            <p className="font-semibold text-gray-400">{(dailyData || []).filter(trade => trade.Profit > 0).length}</p>
          </div>
        </div>

        <div className="w-[70%] h-auto p-2.5 mx-auto bg-gray-500/20 flex flex-row items-center justify-between rounded-[25px] shadow-lg mb-3.5 mt-2.5">
          <p className="text-center text-xs text-white font-semibold leading-6 mx-5">
            Profit Factor <br /> <span className="text-xl text-purple-400 font-semibold">34.02</span>
          </p>
          <p className="text-center text-xs text-white font-semibold leading-6 mx-5">
            Your Accuracy <br /> <span className="text-xl text-purple-400 font-semibold">5%</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default QuickStats;