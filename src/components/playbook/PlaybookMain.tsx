"use client"

import { useState, useEffect } from "react"
import { BookOpen, Sparkles, Plus, Target, TrendingUp, Clock, Calendar, BarChart3, Zap, ChevronRight, Trash2, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import useCurrencyStore, { formatCompactCurrency } from "@/store/currencyStore"

interface PatternStats {
  totalTrades: number
  winCount: number
  lossCount: number
  winRate: number
  totalProfit: number
  avgWin: number
  avgLoss: number
  profitFactor: number
}

interface DetectedPattern {
  type: 'strategy' | 'symbol' | 'time' | 'day'
  name: string
  value: string
  stats: PatternStats
  description: string
}

interface NearMissPattern {
  type: 'strategy' | 'symbol' | 'time' | 'day'
  name: string
  value: string
  currentTrades: number
  requiredTrades: number
  currentWinRate: number
  requiredWinRate: number
  reason: string
}

interface DiagnosticInfo {
  totalTrades: number
  tradesWithStrategy: number
  tradesWithSymbol: number
  tradesWithTime: number
  tradesWithDay: number
  strategyDistribution: Record<string, number>
  symbolDistribution: Record<string, number>
  timeDistribution: Record<string, number>
  dayDistribution: Record<string, number>
  tradesNeeded?: number
}

interface PlaybookEntry {
  _id: string
  name: string
  description?: string
  strategy?: string
  rules: any[]
  optimalTimeStart?: string
  optimalTimeEnd?: string
  optimalDays?: string[]
  preferredSymbols?: string[]
  stats: PatternStats & { lastUpdated: string }
  isAutoDetected: boolean
  isActive: boolean
  createdAt: string
}

const typeIcons = {
  strategy: Target,
  symbol: BarChart3,
  time: Clock,
  day: Calendar
}

const typeColors = {
  strategy: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  symbol: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  time: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  day: "text-purple-500 bg-purple-500/10 border-purple-500/20"
}

const demoPatterns: DetectedPattern[] = [
  {
    type: 'strategy',
    name: 'Breakout Strategy',
    value: 'Breakout',
    description: 'Your breakout strategy shows consistent profitability with strong risk-reward. Best when combined with volume confirmation.',
    stats: {
      totalTrades: 47,
      winCount: 31,
      lossCount: 16,
      winRate: 66,
      totalProfit: 8450,
      avgWin: 385,
      avgLoss: 142,
      profitFactor: 3.71
    }
  },
  {
    type: 'symbol',
    name: 'EUR/USD',
    value: 'EUR/USD',
    description: 'Strong performance on EUR/USD with high win rate and excellent profit factor. Focus on London-NY overlap sessions.',
    stats: {
      totalTrades: 38,
      winCount: 26,
      lossCount: 12,
      winRate: 68,
      totalProfit: 6230,
      avgWin: 325,
      avgLoss: 118,
      profitFactor: 4.12
    }
  },
  {
    type: 'time',
    name: '9:00 AM Session',
    value: '09',
    description: 'Morning session at 9 AM shows highest win rate. Market volatility at open provides best setups for quick entries.',
    stats: {
      totalTrades: 29,
      winCount: 19,
      lossCount: 10,
      winRate: 66,
      totalProfit: 4180,
      avgWin: 295,
      avgLoss: 127,
      profitFactor: 2.85
    }
  },
  {
    type: 'day',
    name: 'Tuesday Trading',
    value: 'Tuesday',
    description: 'Tuesday performs best with consistent institutional flow. Avoid trading on Mondays and Fridays based on your data.',
    stats: {
      totalTrades: 24,
      winCount: 17,
      lossCount: 7,
      winRate: 71,
      totalProfit: 3890,
      avgWin: 310,
      avgLoss: 145,
      profitFactor: 3.42
    }
  },
  {
    type: 'strategy',
    name: 'Pullback Scalp',
    value: 'Pullback Scalp',
    description: 'Quick pullback entries on trending moves show solid results. Works best during high-volume periods.',
    stats: {
      totalTrades: 52,
      winCount: 32,
      lossCount: 20,
      winRate: 62,
      totalProfit: 5670,
      avgWin: 245,
      avgLoss: 98,
      profitFactor: 2.88
    }
  },
  {
    type: 'symbol',
    name: 'GBP/USD',
    value: 'GBP/USD',
    description: 'Cable trades show strong momentum captures. Especially profitable during London session.',
    stats: {
      totalTrades: 31,
      winCount: 18,
      lossCount: 13,
      winRate: 58,
      totalProfit: 3420,
      avgWin: 285,
      avgLoss: 112,
      profitFactor: 2.35
    }
  }
]

const demoPlaybooks: PlaybookEntry[] = [
  {
    _id: 'demo-1',
    name: 'Breakout Strategy',
    description: 'Your breakout strategy shows consistent profitability with strong risk-reward.',
    strategy: 'Breakout',
    rules: [],
    optimalTimeStart: '09:00',
    optimalTimeEnd: '11:00',
    optimalDays: ['Tuesday', 'Wednesday'],
    preferredSymbols: ['EUR/USD', 'GBP/USD'],
    stats: {
      totalTrades: 47,
      winCount: 31,
      lossCount: 16,
      winRate: 66,
      totalProfit: 8450,
      avgWin: 385,
      avgLoss: 142,
      profitFactor: 3.71,
      lastUpdated: new Date().toISOString()
    },
    isAutoDetected: true,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'demo-2',
    name: 'EUR/USD Morning Setup',
    description: 'Focus on EUR/USD during London-NY overlap for best results.',
    strategy: 'Pullback Scalp',
    rules: [],
    optimalTimeStart: '08:00',
    optimalTimeEnd: '10:00',
    optimalDays: ['Tuesday'],
    preferredSymbols: ['EUR/USD'],
    stats: {
      totalTrades: 38,
      winCount: 26,
      lossCount: 12,
      winRate: 68,
      totalProfit: 6230,
      avgWin: 325,
      avgLoss: 118,
      profitFactor: 4.12,
      lastUpdated: new Date().toISOString()
    },
    isAutoDetected: true,
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

export default function PlaybookMain() {
  const [activeTab, setActiveTab] = useState<'patterns' | 'playbook'>('patterns')
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([])
  const [nearMissPatterns, setNearMissPatterns] = useState<NearMissPattern[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null)
  const [apiMessage, setApiMessage] = useState<string>('')
  const [playbooks, setPlaybooks] = useState<PlaybookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [totalTrades, setTotalTrades] = useState(0)
  const [isDemo, setIsDemo] = useState(false)
  const { currency, exchangeRate } = useCurrencyStore()

  const formatCurrency = (value: number) => {
    return formatCompactCurrency(value, currency, exchangeRate)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [patternsRes, playbooksRes] = await Promise.all([
        fetch('/api/playbook/get?apiName=detectPatterns', { credentials: 'include' }),
        fetch('/api/playbook/get?apiName=getPlaybooks', { credentials: 'include' })
      ])

      let fetchedTotalTrades = 0
      let hasRealPatternData = false

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json()
        fetchedTotalTrades = patternsData.totalTrades || 0
        setTotalTrades(fetchedTotalTrades)
        setApiMessage(patternsData.message || '')
        
        if (patternsData.diagnostics) {
          setDiagnostics(patternsData.diagnostics)
        } else {
          setDiagnostics(null)
        }
        
        setNearMissPatterns(patternsData.nearMissPatterns || [])
        setDetectedPatterns(patternsData.data || [])
        
        if ((patternsData.data && patternsData.data.length > 0) || 
            (patternsData.nearMissPatterns && patternsData.nearMissPatterns.length > 0) ||
            patternsData.diagnostics) {
          hasRealPatternData = true
        }
      }

      if (playbooksRes.ok) {
        const playbooksData = await playbooksRes.json()
        setPlaybooks(playbooksData.data || [])
      }

      if (!hasRealPatternData && fetchedTotalTrades < 10) {
        setDetectedPatterns(demoPatterns)
        setPlaybooks(demoPlaybooks)
        setNearMissPatterns([])
        setDiagnostics(null)
        setTotalTrades(221)
        setIsDemo(true)
      } else {
        setIsDemo(false)
      }
    } catch (error) {
      console.error('Error fetching playbook data:', error)
      setDetectedPatterns(demoPatterns)
      setPlaybooks(demoPlaybooks)
      setNearMissPatterns([])
      setDiagnostics(null)
      setTotalTrades(221)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  const addToPlaybook = async (pattern: DetectedPattern) => {
    try {
      const response = await fetch('/api/playbook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiName: 'createPlaybook',
          name: pattern.name,
          description: pattern.description,
          strategy: pattern.type === 'strategy' ? pattern.value : undefined,
          preferredSymbols: pattern.type === 'symbol' ? [pattern.value] : [],
          optimalDays: pattern.type === 'day' ? [pattern.value] : [],
          optimalTimeStart: pattern.type === 'time' ? `${pattern.value}:00` : undefined,
          optimalTimeEnd: pattern.type === 'time' ? `${parseInt(pattern.value) + 1}:00` : undefined,
          isAutoDetected: true
        })
      })

      if (response.ok) {
        await fetchData()
        setActiveTab('playbook')
      }
    } catch (error) {
      console.error('Error adding to playbook:', error)
    }
  }

  const togglePlaybookActive = async (playbookId: string, isActive: boolean) => {
    try {
      await fetch('/api/playbook/put', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiName: 'updatePlaybook',
          playbookId,
          updates: { isActive: !isActive }
        })
      })
      await fetchData()
    } catch (error) {
      console.error('Error updating playbook:', error)
    }
  }

  const deletePlaybook = async (playbookId: string) => {
    if (!confirm('Are you sure you want to delete this playbook entry?')) return
    
    try {
      await fetch('/api/playbook/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          apiName: 'deletePlaybook',
          playbookId
        })
      })
      await fetchData()
    } catch (error) {
      console.error('Error deleting playbook:', error)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Trade Playbook</h1>
            <p className="text-sm text-muted-foreground">Your winning patterns and trading setups</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('patterns')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'patterns'
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Detected Patterns
        </button>
        <button
          onClick={() => setActiveTab('playbook')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'playbook'
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-4 h-4" />
          My Playbook
          {playbooks.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {playbooks.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === 'patterns' ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-foreground">AI Pattern Detection</h2>
                  {isDemo && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20">
                      Demo Data
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyzed {totalTrades.toLocaleString()} trades to find your most profitable setups. 
                  Add winning patterns to your playbook to track and replicate success.
                </p>
              </div>
            </div>
          </div>

          {detectedPatterns.length === 0 ? (
            <div className="space-y-6">
              {apiMessage && !isDemo && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{apiMessage}</p>
                    {diagnostics && diagnostics.tradesNeeded && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add {diagnostics.tradesNeeded} more trades to enable pattern detection
                      </p>
                    )}
                  </div>
                </div>
              )}

              {nearMissPatterns.length > 0 && !isDemo && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Almost Qualifying Patterns</h3>
                    <span className="text-xs text-muted-foreground">({nearMissPatterns.length} patterns close to detection)</span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {nearMissPatterns.map((pattern, index) => {
                      const Icon = typeIcons[pattern.type]
                      const colorClass = typeColors[pattern.type]
                      const progress = (pattern.currentTrades / pattern.requiredTrades) * 100

                      return (
                        <div
                          key={index}
                          className="bg-card/50 border border-dashed border-border rounded-xl p-4"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border opacity-60", colorClass)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground text-sm">{pattern.name}</h4>
                              <span className="text-xs text-muted-foreground capitalize">{pattern.type}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-foreground font-medium">{pattern.currentTrades}/{pattern.requiredTrades} trades</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary/60 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400">{pattern.reason}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {diagnostics && !isDemo && Object.keys(diagnostics.strategyDistribution).length > 0 && (
                <div className="bg-card/30 border border-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Trade Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">By Symbol</p>
                      {Object.entries(diagnostics.symbolDistribution).slice(0, 3).map(([symbol, count]) => (
                        <p key={symbol} className="text-foreground">{symbol}: {count}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">By Strategy</p>
                      {Object.entries(diagnostics.strategyDistribution).slice(0, 3).map(([strategy, count]) => (
                        <p key={strategy} className="text-foreground">{strategy}: {count}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">By Day</p>
                      {Object.entries(diagnostics.dayDistribution).slice(0, 3).map(([day, count]) => (
                        <p key={day} className="text-foreground">{day}: {count}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">By Time</p>
                      {Object.entries(diagnostics.timeDistribution).slice(0, 3).map(([time, count]) => (
                        <p key={time} className="text-foreground">{time}: {count}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(nearMissPatterns.length === 0 || isDemo) && (
                <div className="text-center py-16 bg-card/50 rounded-2xl border border-border">
                  <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No patterns detected yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {isDemo 
                      ? "This is demo data. Continue trading and logging your trades with at least 10 trades to see real pattern detection."
                      : "Continue trading and logging your trades. Ensure you select a strategy for each trade and have at least 5 trades per category."
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {detectedPatterns.map((pattern, index) => {
                const Icon = typeIcons[pattern.type]
                const colorClass = typeColors[pattern.type]
                const isAlreadyAdded = playbooks.some(p => p.name === pattern.name)

                return (
                  <div
                    key={index}
                    className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", colorClass)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{pattern.name}</h3>
                          <span className="text-xs text-muted-foreground capitalize">{pattern.type} pattern</span>
                        </div>
                      </div>
                      {!isAlreadyAdded && (
                        <button
                          onClick={() => addToPlaybook(pattern)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      )}
                      {isAlreadyAdded && (
                        <span className="text-xs text-emerald-500 font-medium">In Playbook</span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{pattern.description}</p>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-bold text-foreground">{pattern.stats.winRate.toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Win Rate</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-bold text-foreground">{pattern.stats.totalTrades}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trades</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className={cn("text-lg font-bold", pattern.stats.totalProfit >= 0 ? "text-profit" : "text-loss")}>
                          {formatCurrency(pattern.stats.totalProfit)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-bold text-foreground">
                          {pattern.stats.profitFactor >= 999 ? '∞' : pattern.stats.profitFactor.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PF</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {playbooks.length === 0 ? (
            <div className="text-center py-16 bg-card/50 rounded-2xl border border-border">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Your playbook is empty</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                Add winning patterns from the Detected Patterns tab to build your trading playbook.
              </p>
              <button
                onClick={() => setActiveTab('patterns')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                View Detected Patterns
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {playbooks.map((playbook) => (
                <div
                  key={playbook._id}
                  className={cn(
                    "bg-card border rounded-xl p-5 transition-all",
                    playbook.isActive ? "border-border" : "border-border/50 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        playbook.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{playbook.name}</h3>
                        {playbook.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{playbook.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => togglePlaybookActive(playbook._id, playbook.isActive)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          playbook.isActive 
                            ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        )}
                        title={playbook.isActive ? "Disable" : "Enable"}
                      >
                        {playbook.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deletePlaybook(playbook._id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {playbook.strategy && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">
                        Strategy: {playbook.strategy}
                      </span>
                    )}
                    {playbook.preferredSymbols && playbook.preferredSymbols.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">
                        {playbook.preferredSymbols.join(', ')}
                      </span>
                    )}
                    {playbook.optimalDays && playbook.optimalDays.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-500 text-xs font-medium border border-purple-500/20">
                        {playbook.optimalDays.join(', ')}
                      </span>
                    )}
                    {playbook.optimalTimeStart && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-medium border border-amber-500/20">
                        {playbook.optimalTimeStart} - {playbook.optimalTimeEnd}
                      </span>
                    )}
                    {playbook.isAutoDetected && (
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                        <Zap className="w-3 h-3 inline mr-1" />
                        Auto-detected
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-foreground">{playbook.stats.winRate?.toFixed(0) || 0}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Win Rate</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-foreground">{playbook.stats.totalTrades || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Trades</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className={cn("text-lg font-bold", (playbook.stats.totalProfit || 0) >= 0 ? "text-profit" : "text-loss")}>
                        {formatCurrency(playbook.stats.totalProfit || 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-foreground">
                        {(playbook.stats.profitFactor || 0) >= 999 ? '∞' : (playbook.stats.profitFactor || 0).toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PF</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-profit">{formatCurrency(playbook.stats.avgWin || 0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Win</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-loss">{formatCurrency(playbook.stats.avgLoss || 0)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Loss</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-foreground">{playbook.stats.winCount || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wins</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-bold text-foreground">{playbook.stats.lossCount || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Losses</p>
                    </div>
                  </div>

                  {playbook.stats.lastUpdated && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Last updated: {new Date(playbook.stats.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
