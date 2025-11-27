// utils/calculateWeeklyPnL.ts

interface WeeklyPnLData {
    week: number;
    pnl: number;
}

export const calculateWeeklyPnL = (monthIndex: number, year: number, monthData: {[key: string]: any}[]): WeeklyPnLData[] => {
    // If no data, return default structure with all weeks at 0 PnL
    if (!Array.isArray(monthData) || monthData.length === 0) {
        const defaultWeeklyPnl: WeeklyPnLData[] = [];
        for (let i = 1; i <= 6; i++) {
            defaultWeeklyPnl.push({
                week: i,
                pnl: 0
            });
        }
        return defaultWeeklyPnl;
    }

    // 1. Initialize PNL storage for all potential weeks (1-6) with 0.
    const weeklyPnl = {};
    for (let i = 1; i <= 6; i++) {
        weeklyPnl[i] = 0;
    }
    
    // 2. Prepare for daily PNL aggregation and filtering.
    const dailyPnl = {};
    const targetMonthStr = String(monthIndex + 1).padStart(2, '0');
    const targetDatePrefix = `${year}-${targetMonthStr}`;

    monthData.forEach(trade => {
        // Only process trades in the target month/year
        if (!trade.date.startsWith(targetDatePrefix)) {
            return;
        }
        
        const profit = Number(trade.Profit) || 0;
        const dateKey = trade.date; 
        dailyPnl[dateKey] = (dailyPnl[dateKey] || 0) + profit;
    });

    // 3. Map Daily PNL to Calendar Weeks (Sunday to Saturday)
    for (const dateKey in dailyPnl) {
        if (dailyPnl.hasOwnProperty(dateKey)) {
            // Create a Date object from the key (YYYY-MM-DD)
            const tradeDate = new Date(dateKey + 'T00:00:00'); 
            
            const dayOfMonth = tradeDate.getDate();
            const dayOfWeek = tradeDate.getDay(); // 0=Sunday, 6=Saturday

            // Get the day of the week for the first day of the month
            const firstDayOfMonth = new Date(year, monthIndex, 1);
            const firstDayOfWeek = firstDayOfMonth.getDay(); 
            
            // Calculate the 1-indexed week number (1 for the first calendar week)
            const dayOffset = (dayOfMonth + firstDayOfWeek - dayOfWeek - 1);
            let weekNumber = Math.floor(dayOffset / 7) + 1;
            
            // Safety clamp to ensure weekNumber doesn't exceed 6 (shouldn't happen for any month)
            if (weekNumber > 6) weekNumber = 6; 
            
            // Aggregate PNL for the calculated calendar week number
            weeklyPnl[weekNumber] = (weeklyPnl[weekNumber] || 0) + dailyPnl[dateKey];
        }
    }

    // 4. Transform the aggregated object into the required array format
    const finalPnlArray: WeeklyPnLData[] = [];
    
    // Iterate from week 1 to 6 to guarantee order and inclusion of 0-PNL weeks
    for (let weekNumber = 1; weekNumber <= 6; weekNumber++) {
        const pnl = weeklyPnl[weekNumber];
        
        // Round to 2 decimal places
        const roundedPnl = Math.round(pnl * 100) / 100;
        
        finalPnlArray.push({
            week: weekNumber,
            pnl: roundedPnl
        });
    }

    // Optional: Log the result for confirmation
    console.log(`--- Final Weekly PNL Array for ${year}-${targetMonthStr} ---`);
    console.log(finalPnlArray);
    
    return finalPnlArray;
};