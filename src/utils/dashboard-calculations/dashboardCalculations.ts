interface Trade {
    Profit: number;
}

interface Account {
    accountBalance?: number;
}

interface RiskRewardResult {
    rrRatio: string;
    avgWin: string;
    avgLoss: string;
}

function calculateProfitFactor(trades: Trade[]): string {
    let totalWins = 0;
    let totalLosses = 0;

    trades.forEach(trade => {
        if (trade.Profit > 0) {
            totalWins += trade.Profit;
        } else if (trade.Profit < 0) {
            totalLosses += Math.abs(trade.Profit);
        }
    });

    if (totalWins === 0 && totalLosses === 0) return '-';
    if (totalLosses === 0 && totalWins > 0) return '2+';
    if (totalWins === 0 && totalLosses > 0) return '0';

    const profitFactor = totalWins / totalLosses;
    return profitFactor.toFixed(2);
}

function calculateRiskRewardRatio(trades: Trade[]): RiskRewardResult {
    let winningTrades: number[] = [];
    let losingTrades: number[] = [];
    let totalProfits = 0;
    let totalLoses = 0;

    trades.forEach(trade => {
        if (trade.Profit > 0) {
            winningTrades.push(trade.Profit);
            totalProfits = totalProfits + trade.Profit;
        } else if (trade.Profit < 0) {
            losingTrades.push(Math.abs(trade.Profit));
            totalLoses = totalLoses + Math.abs(trade.Profit);
        }
    });

    const avgWin = (winningTrades.length > 0) 
        ? winningTrades.reduce((sum, profit) => sum + profit, 0) / winningTrades.length 
        : 0;

    const avgLoss = (losingTrades.length > 0) 
        ? losingTrades.reduce((sum, loss) => sum + loss, 0) / losingTrades.length 
        : 0;

    if (avgWin === 0 && avgLoss === 0) return { 
        rrRatio: '-', 
        avgWin: avgWin.toFixed(2), 
        avgLoss: avgLoss.toFixed(2) 
    };
    
    if (avgLoss === 0 && avgWin > 0) return { 
        rrRatio: '2+', 
        avgWin: avgWin.toFixed(2), 
        avgLoss: avgLoss.toFixed(2) 
    };
    
    if (avgWin === 0 && avgLoss > 0) return { 
        rrRatio: '0', 
        avgWin: avgWin.toFixed(2), 
        avgLoss: avgLoss.toFixed(2) 
    };

    const riskRewardRatio = avgWin / avgLoss;
    return { 
        rrRatio: riskRewardRatio.toFixed(2), 
        avgWin: avgWin.toFixed(2), 
        avgLoss: avgLoss.toFixed(2) 
    };
}

function calculateBalance(accounts: Account[]): number {
    let totalBalance = 0;
    totalBalance = accounts.reduce((sum, account) => sum + (account.accountBalance || 0), 0);
    
    return totalBalance;
}

export { calculateProfitFactor, calculateRiskRewardRatio, calculateBalance };
export type { Trade, Account, RiskRewardResult };