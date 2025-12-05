"use client"

import { useMemo, useEffect, useState } from "react"
import usePropFirmStore from "@/store/propFirmStore"
import useAccountDetails from "@/store/accountdetails"
import PropFirmSettings from "./PropFirmSettings"
import PropFirmSummaryCard from "./PropFirmSummaryCard"
import PropFirmProgressBars from "./PropFirmProgressBars"
import PropFirmBreachBanner from "./PropFirmBreachBanner"

export default function PropFirmDashboard() {
  const { settings, peakEquity, challengeStatus, updatePeakEquity, setChallengeStatus } = usePropFirmStore()
  const { selectedAccounts } = useAccountDetails()
  const [dailyBreached, setDailyBreached] = useState(false)

  const calculations = useMemo(() => {
    let totalPnL = 0
    const today = new Date().toISOString().split('T')[0]
    let todayPnL = 0
    
    selectedAccounts.forEach(account => {
      if (account.tradeData && Array.isArray(account.tradeData)) {
        const challengeStart = settings.challengeStartDate ? new Date(settings.challengeStartDate) : new Date(0)
        
        account.tradeData.forEach(trade => {
          const tradeDate = new Date(trade.date)
          if (tradeDate >= challengeStart) {
            const profit = trade.Profit || 0
            totalPnL += profit
            
            if (trade.date === today) {
              todayPnL += profit
            }
          }
        })
      }
    })

    const currentEquity = settings.startingBalance + totalPnL
    const profitTargetValue = settings.startingBalance * (settings.profitTargetPercent / 100)
    const maxDrawdownValue = settings.startingBalance * (settings.maxDrawdownPercent / 100)
    
    const dailyDrawdownValue = settings.dailyDrawdownPercent 
      ? settings.startingBalance * (settings.dailyDrawdownPercent / 100)
      : null
    
    const currentProfit = currentEquity - settings.startingBalance
    const profitProgress = (Math.max(currentProfit, 0) / profitTargetValue) * 100
    
    const drawdownFromPeak = Math.max(peakEquity, currentEquity) - currentEquity
    const drawdownUsedPercent = (drawdownFromPeak / maxDrawdownValue) * 100
    
    const dailyLoss = todayPnL < 0 ? Math.abs(todayPnL) : 0
    const dailyDrawdownUsedPercent = dailyDrawdownValue 
      ? (dailyLoss / dailyDrawdownValue) * 100 
      : 0
    const dailyDrawdownBreached = dailyDrawdownValue ? dailyLoss >= dailyDrawdownValue : false

    return {
      currentEquity,
      totalPnL,
      todayPnL,
      profitTargetValue,
      maxDrawdownValue,
      dailyDrawdownValue,
      profitProgress,
      drawdownUsedPercent,
      drawdownFromPeak,
      dailyLoss,
      dailyDrawdownUsedPercent,
      dailyDrawdownBreached,
    }
  }, [selectedAccounts, settings, peakEquity])

  useEffect(() => {
    if (calculations.currentEquity > peakEquity) {
      updatePeakEquity(calculations.currentEquity)
    }
  }, [calculations.currentEquity, peakEquity, updatePeakEquity])

  useEffect(() => {
    const { drawdownUsedPercent, profitProgress, dailyDrawdownBreached } = calculations
    
    if (drawdownUsedPercent >= 100) {
      setChallengeStatus("breached")
      setDailyBreached(false)
    } else if (dailyDrawdownBreached) {
      setChallengeStatus("breached")
      setDailyBreached(true)
    } else if (profitProgress >= 100) {
      setChallengeStatus("completed")
      setDailyBreached(false)
    } else if (drawdownUsedPercent >= 70) {
      setChallengeStatus("at_risk")
      setDailyBreached(false)
    } else {
      setChallengeStatus("active")
      setDailyBreached(false)
    }
  }, [calculations, setChallengeStatus])

  return (
    <div className="space-y-6">
      {challengeStatus === "breached" && (
        <PropFirmBreachBanner type={dailyBreached ? "daily_drawdown" : "drawdown"} />
      )}

      <PropFirmSummaryCard
        status={challengeStatus}
        startingBalance={settings.startingBalance}
        currentEquity={calculations.currentEquity}
        profitTargetPercent={settings.profitTargetPercent}
        maxDrawdownPercent={settings.maxDrawdownPercent}
        dailyDrawdownPercent={settings.dailyDrawdownPercent}
        todayPnL={calculations.todayPnL}
        challengeStartDate={settings.challengeStartDate}
      />

      <PropFirmProgressBars
        currentEquity={calculations.currentEquity}
        startingBalance={settings.startingBalance}
        profitTarget={settings.profitTargetPercent}
        maxDrawdown={settings.maxDrawdownPercent}
        peakEquity={peakEquity}
        dailyDrawdown={settings.dailyDrawdownPercent}
        dailyLoss={calculations.dailyLoss}
      />

      <PropFirmSettings />
    </div>
  )
}
