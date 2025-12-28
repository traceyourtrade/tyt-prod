"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Calculator, TrendingUp, DollarSign, 
  Calendar, ArrowRight, Sparkles, Trophy
} from "lucide-react"
import { cn } from "@/lib/utils"
import usePropFirmStore from "@/store/propFirmStore"

export default function PropFirmScaleUpCalculator() {
  const { settings, getCurrentPhaseInfo } = usePropFirmStore()
  const { preset } = getCurrentPhaseInfo()

  const [monthlyReturn, setMonthlyReturn] = useState(5)
  const [monthsToProject, setMonthsToProject] = useState(12)

  const projections = useMemo(() => {
    if (!preset?.scalingPlan) return []

    const scalingPercent = preset.scalingPlan.increasePercent / 100
    const profitSplit = preset.profitSplit.initial / 100
    const scaledSplit = (preset.profitSplit.scaled || preset.profitSplit.initial) / 100
    
    let currentBalance = settings.startingBalance
    let totalEarnings = 0
    let totalCapital = settings.startingBalance
    const projectionData = []
    let scaleUpCount = 0
    let accumulatedProfit = 0

    for (let month = 1; month <= monthsToProject; month++) {
      const monthlyProfit = currentBalance * (monthlyReturn / 100)
      accumulatedProfit += monthlyProfit
      
      const currentSplit = scaleUpCount >= 1 ? scaledSplit : profitSplit
      const traderShare = monthlyProfit * currentSplit
      totalEarnings += traderShare
      
      const profitPercent = (accumulatedProfit / currentBalance) * 100
      const canScaleUp = profitPercent >= 10 && month >= 4 * (scaleUpCount + 1)
      
      if (canScaleUp) {
        currentBalance = currentBalance * (1 + scalingPercent)
        totalCapital = currentBalance
        scaleUpCount++
        accumulatedProfit = 0
      }

      projectionData.push({
        month,
        balance: currentBalance,
        monthlyProfit: traderShare,
        totalEarnings,
        scaleUpCount,
        profitSplit: currentSplit * 100,
      })
    }

    return projectionData
  }, [preset, settings.startingBalance, monthlyReturn, monthsToProject])

  if (!preset?.scalingPlan) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
          <Calculator className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No Scaling Plan</h3>
        <p className="text-xs text-muted-foreground">Select a prop firm with a scaling plan to use this calculator</p>
      </div>
    )
  }

  const finalProjection = projections[projections.length - 1]

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Scale-Up Calculator</h3>
            <p className="text-xs text-muted-foreground">Project your capital growth</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="p-5 border-b border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Avg Monthly Return
            </label>
            <div className="relative">
              <input
                type="number"
                value={monthlyReturn}
                onChange={(e) => setMonthlyReturn(parseFloat(e.target.value) || 0)}
                min={0}
                max={20}
                step={0.5}
                className="w-full pl-4 pr-8 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Projection Period
            </label>
            <select
              value={monthsToProject}
              onChange={(e) => setMonthsToProject(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-muted/30 border border-border/50 rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
            >
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={18}>18 months</option>
              <option value={24}>24 months</option>
              <option value={36}>36 months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scaling Plan Info */}
      <div className="px-5 py-4 bg-violet-500/5 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-xs font-medium text-foreground">{preset.name} Scaling Plan</span>
        </div>
        <p className="text-xs text-muted-foreground">{preset.scalingPlan.requirement}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-muted-foreground">
            Capital increase: <span className="font-semibold text-violet-500">+{preset.scalingPlan.increasePercent}%</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Profit split: <span className="font-semibold text-emerald-500">{preset.profitSplit.initial}% → {preset.profitSplit.scaled || preset.profitSplit.initial}%</span>
          </span>
        </div>
      </div>

      {/* Projection Summary */}
      {finalProjection && (
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
              <DollarSign className="w-5 h-5 text-violet-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-foreground">
                ${finalProjection.balance.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Final Capital</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-emerald-500">
                ${Math.round(finalProjection.totalEarnings).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total Earnings</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <div className="text-xl font-bold text-foreground">
                {finalProjection.scaleUpCount}x
              </div>
              <div className="text-xs text-muted-foreground mt-1">Scale-Ups</div>
            </div>
          </div>

          {/* Growth Timeline */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-3">Growth Timeline</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {projections.filter((_, i) => i % 3 === 0 || i === projections.length - 1).map((proj, idx) => (
                <motion.div
                  key={proj.month}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-violet-500" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">Month {proj.month}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {proj.profitSplit}% profit split
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      ${proj.balance.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-500">
                      +${Math.round(proj.monthlyProfit).toLocaleString()}/mo
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-muted-foreground text-center">
          * Projections are estimates based on consistent returns. Actual results may vary.
        </p>
      </div>
    </div>
  )
}
