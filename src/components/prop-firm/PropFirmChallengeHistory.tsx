"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  History, Check, X, RotateCcw, ChevronDown, 
  Calendar, DollarSign, Trophy, AlertTriangle,
  Clock, TrendingUp, TrendingDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import usePropFirmStore, { ChallengeAttempt } from "@/store/propFirmStore"

export default function PropFirmChallengeHistory() {
  const { attempts, currentAttemptId } = usePropFirmStore()
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  const sortedAttempts = [...attempts].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )

  const stats = {
    total: attempts.length,
    passed: attempts.filter(a => a.status === "passed").length,
    failed: attempts.filter(a => a.status === "failed").length,
    reset: attempts.filter(a => a.status === "reset").length,
    successRate: attempts.length > 0 
      ? Math.round((attempts.filter(a => a.status === "passed").length / attempts.filter(a => a.status !== "active").length) * 100) || 0
      : 0,
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
          <History className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No Challenge History</h3>
        <p className="text-xs text-muted-foreground">Your challenge attempts will appear here</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <History className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Challenge History</h3>
              <p className="text-xs text-muted-foreground">{stats.total} total attempts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-px bg-border/50">
        <div className="bg-card p-3 text-center">
          <div className="text-lg font-bold text-foreground">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</div>
        </div>
        <div className="bg-card p-3 text-center">
          <div className="text-lg font-bold text-emerald-500">{stats.passed}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Passed</div>
        </div>
        <div className="bg-card p-3 text-center">
          <div className="text-lg font-bold text-red-500">{stats.failed}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Failed</div>
        </div>
        <div className="bg-card p-3 text-center">
          <div className="text-lg font-bold text-blue-500">{stats.successRate}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Success</div>
        </div>
      </div>

      {/* Attempts List */}
      <div className="divide-y divide-border/50">
        {sortedAttempts.map((attempt) => (
          <AttemptCard
            key={attempt.id}
            attempt={attempt}
            isCurrent={attempt.id === currentAttemptId}
            isExpanded={expandedAttempt === attempt.id}
            onToggle={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface AttemptCardProps {
  attempt: ChallengeAttempt
  isCurrent: boolean
  isExpanded: boolean
  onToggle: () => void
}

function AttemptCard({ attempt, isCurrent, isExpanded, onToggle }: AttemptCardProps) {
  const statusConfig = {
    active: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", label: "Active" },
    passed: { icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Funded" },
    failed: { icon: X, color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
    reset: { icon: RotateCcw, color: "text-amber-500", bg: "bg-amber-500/10", label: "Reset" },
  }

  const config = statusConfig[attempt.status]
  const StatusIcon = config.icon

  const duration = attempt.endDate 
    ? Math.ceil((new Date(attempt.endDate).getTime() - new Date(attempt.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : Math.ceil((Date.now() - new Date(attempt.startDate).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className={cn("transition-colors", isCurrent && "bg-blue-500/5")}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", config.bg)}>
            <StatusIcon className={cn("w-4 h-4", config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{attempt.presetName}</span>
              {isCurrent && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500">
                  Current
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${attempt.accountSize.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(attempt.startDate).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {duration} days
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.bg, config.color)}>
            {config.label}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Phase Progress */}
              <div className="rounded-lg bg-muted/30 p-3 mb-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-3">Phase Progress</h4>
                <div className="space-y-2">
                  {attempt.phases.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        phase.status === "passed" && "bg-emerald-500 text-white",
                        phase.status === "failed" && "bg-red-500 text-white",
                        phase.status === "active" && "bg-amber-500 text-white"
                      )}>
                        {phase.status === "passed" ? <Check className="w-3 h-3" /> : 
                         phase.status === "failed" ? <X className="w-3 h-3" /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{phase.phaseName}</span>
                          <span className={cn(
                            "text-[10px] font-medium",
                            phase.status === "passed" && "text-emerald-500",
                            phase.status === "failed" && "text-red-500",
                            phase.status === "active" && "text-amber-500"
                          )}>
                            {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          <span>Target: {phase.profitTarget}%</span>
                          <span>Max DD: {phase.maxDrawdown}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <div className={cn(
                    "text-sm font-bold",
                    attempt.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"
                  )}>
                    {attempt.totalPnL >= 0 ? "+" : ""}${attempt.totalPnL.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Total P&L</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <div className="text-sm font-bold text-foreground">{attempt.resetCount}</div>
                  <div className="text-[10px] text-muted-foreground">Resets</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-2 text-center">
                  <div className="text-sm font-bold text-foreground">{attempt.violations.length}</div>
                  <div className="text-[10px] text-muted-foreground">Violations</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
