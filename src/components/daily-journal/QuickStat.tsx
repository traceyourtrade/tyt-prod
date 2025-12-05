"use client";

interface Trade {
  Profit: number;
}

interface QuickStatsProps {
  dailyData: Trade[];
}

const QuickStats = ({ dailyData }: QuickStatsProps) => {
  const totalPnL = (dailyData || []).reduce((sum, trade) => sum + (trade.Profit || 0), 0);
  const formattedPnL = totalPnL < 0 ? `-$${Math.abs(totalPnL).toFixed(2)}` : `$${totalPnL.toFixed(2)}`;
  const winners = (dailyData || []).filter(trade => trade.Profit > 0).length;
  const losers = (dailyData || []).filter(trade => trade.Profit < 0).length;
  const winRate = dailyData?.length ? Math.round((winners / dailyData.length) * 100) : 0;
  
  const totalWins = (dailyData || []).filter(t => t.Profit > 0).reduce((sum, t) => sum + t.Profit, 0);
  const totalLosses = Math.abs((dailyData || []).filter(t => t.Profit < 0).reduce((sum, t) => sum + t.Profit, 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : "N/A";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Quick Stats</h2>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gross P&L</span>
            <p className={`text-xl font-bold mt-1 ${
              totalPnL > 0 ? "text-profit" : totalPnL < 0 ? "text-loss" : "text-muted-foreground"
            }`}>
              {formattedPnL}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</span>
            <p className="text-xl font-bold text-foreground mt-1">{winRate}%</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Winners</span>
            <p className="text-xl font-bold text-profit mt-1">{winners}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Losers</span>
            <p className="text-xl font-bold text-loss mt-1">{losers}</p>
          </div>
        </div>

        <div className="flex items-center justify-around p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Profit Factor
            </span>
            <span className="text-2xl font-bold text-primary">{profitFactor}</span>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
              Total Trades
            </span>
            <span className="text-2xl font-bold text-primary">{dailyData?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;
