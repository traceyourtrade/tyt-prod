// utils/getDailyPnL.ts

interface Trade {
  date: string;
  Profit: number;
  Commission: number;
  Swap: number;
}

interface DailyPnLData {
  pnl: number;
  trades: number;
}

interface DailyPnLResult {
  [key: string]: DailyPnLData;
}

/**
 * Aggregates daily P&L from an array of trade objects.
 * @param {Array} trades - Array of trade objects with date, Profit, Commission, Swap properties.
 * @param {string} pnlType - 'gross_pnl' or 'net_pnl' to determine calculation method.
 * @returns {Object} An object with dates as keys (dd-mm-yyyy) and daily P&L as values.
 */
export const getDailyPnL = (trades: Trade[], pnlType: string = 'net_pnl'): DailyPnLResult => {
  if (!Array.isArray(trades) || trades.length === 0) {
    // Return default structure instead of empty object to prevent crashes
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
    
    return {
      [formattedDate]: {
        pnl: 0,
        trades: 0
      }
    };
  }

  const dailyPnL: DailyPnLResult = {};

  trades.forEach(trade => {
    let dailyPnLValue;
    
    if (pnlType === 'net_pnl') {
      // Net P&L: (Profit + Swap) - Commission
      dailyPnLValue = (trade.Profit + trade.Swap) - Math.abs(trade.Commission);
    } else {
      // Gross P&L: Profit + Commission + Swap
      dailyPnLValue = trade.Profit + trade.Commission + trade.Swap;
    }

    // Format date as dd-mm-yyyy
    const date = trade.date; // Assuming trade.date is already in a format like YYYY-MM-DD
    const dateObj = new Date(date);
    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;

    // Aggregate P&L for the same date
    if (dailyPnL[formattedDate]) {
      const temp = dailyPnL[formattedDate];
      dailyPnL[formattedDate] = {
        pnl: temp.pnl + dailyPnLValue,
        trades: temp.trades + 1
      };
    } else {
      dailyPnL[formattedDate] = {
        pnl: dailyPnLValue,
        trades: 1,
      };
    }
  });

  return dailyPnL;
};