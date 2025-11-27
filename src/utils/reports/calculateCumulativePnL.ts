// utils/calculateCumulativePnL.ts

interface Trade {
  date: string;
  Profit: number;
  Commission: number;
  Swap: number;
}

interface CumulativePnLDataPoint {
  date: string;
  value: number;
}

/**
 * Calculates cumulative P&L data points from an array of trade objects.
 * @param {Array} trades - Array of trade objects.
 * @returns {Array} An array of objects with 'date' and 'value' properties for the cumulative P&L chart.
 */
export const calculateCumulativePnL = (trades: Trade[]): CumulativePnLDataPoint[] => {
  if (!Array.isArray(trades) || trades.length === 0) {
    // Return default structure instead of empty array to prevent crashes
    return [
      {
        date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        value: 0
      }
    ];
  }

  // --- Aggregate P&L by Date ---
  const dailyPnL: { [key: string]: number } = {}; // date (YYYY-MM-DD) -> cumulative P&L for that date

  trades.forEach(trade => {
    // Calculate P&L for this trade (Profit + Commission + Swap)
    const tradePnL = trade.Profit + Number(trade.Commission)||0 + trade.Swap;
    const dateKey = trade.date; // Assuming 'date' is YYYY-MM-DD

    if (!dailyPnL[dateKey]) {
      dailyPnL[dateKey] = 0;
    }
    dailyPnL[dateKey] += tradePnL;
  });

  // --- Sort dates and Calculate Cumulative Total ---
  const sortedDates = Object.keys(dailyPnL).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const cumulativePnLData: CumulativePnLDataPoint[] = [];
  let runningTotal = 0;

  sortedDates.forEach(date => {
    runningTotal += dailyPnL[date];
    cumulativePnLData.push({
      date: date,
      value: parseFloat(runningTotal.toFixed(2)) // Round to 2 decimal places
    });
  });

  return cumulativePnLData;
};