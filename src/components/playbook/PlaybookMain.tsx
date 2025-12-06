"use client"

import { useState, useEffect } from "react"
import { BookOpen, Sparkles, Plus, Target, TrendingUp, Clock, Calendar, BarChart3, Zap, ChevronRight, Trash2, Eye, EyeOff } from "lucide-react"
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

export default function PlaybookMain() {
  const [activeTab, setActiveTab] = useState<'patterns' | 'playbook'>('patterns')
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([])
  const [playbooks, setPlaybooks] = useState<PlaybookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [totalTrades, setTotalTrades] = useState(0)
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

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json()
        setDetectedPatterns(patternsData.data || [])
        setTotalTrades(patternsData.totalTrades || 0)
      }

      if (playbooksRes.ok) {
        const playbooksData = await playbooksRes.json()
        setPlaybooks(playbooksData.data || [])
      }
    } catch (error) {
      console.error('Error fetching playbook data:', error)
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
                <h2 className="text-lg font-semibold text-foreground mb-1">AI Pattern Detection</h2>
                <p className="text-sm text-muted-foreground">
                  Analyzed {totalTrades.toLocaleString()} trades to find your most profitable setups. 
                  Add winning patterns to your playbook to track and replicate success.
                </p>
              </div>
            </div>
          </div>

          {detectedPatterns.length === 0 ? (
            <div className="text-center py-16 bg-card/50 rounded-2xl border border-border">
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No patterns detected yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Continue trading and logging your trades. Once you have at least 10 trades, 
                we'll analyze your data to find winning patterns.
              </p>
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
