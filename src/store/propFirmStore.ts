"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { PropFirmPreset, PropFirmPhase, getPresetById } from "@/lib/prop-firm-presets"

export interface PropFirmSettings {
  startingBalance: number
  profitTargetPercent: number
  maxDrawdownPercent: number
  dailyDrawdownPercent: number | null
  challengeStartDate: string | null
  minTradingDays: number | null
  maxTradingDays: number | null
  newsTrading: boolean
  weekendHolding: boolean
}

export interface ChallengePhaseRecord {
  phaseIndex: number
  phaseName: string
  startDate: string
  endDate: string | null
  startingBalance: number
  endingBalance: number | null
  status: "active" | "passed" | "failed"
  profitTarget: number
  maxDrawdown: number
  dailyDrawdown: number | null
  peakEquity: number
}

export interface ViolationRecord {
  id: string
  timestamp: string
  type: "daily_drawdown" | "max_drawdown" | "min_trading_days" | "news_trading" | "weekend_holding" | "custom"
  severity: "warning" | "critical" | "breach"
  message: string
  valueAtTime: number
  limitValue: number
  acknowledged: boolean
  journalEntry?: string
}

export interface ChallengeAttempt {
  id: string
  presetId: string
  presetName: string
  accountSize: number
  startDate: string
  endDate: string | null
  status: "active" | "passed" | "failed" | "reset"
  currentPhaseIndex: number
  phases: ChallengePhaseRecord[]
  violations: ViolationRecord[]
  resetCount: number
  totalPnL: number
}

export interface PropFirmState {
  isEnabled: boolean
  selectedPresetId: string | null
  currentAttemptId: string | null
  settings: PropFirmSettings
  peakEquity: number
  challengeStatus: "active" | "at_risk" | "breached" | "completed"
  currentPhaseIndex: number
  attempts: ChallengeAttempt[]
  violations: ViolationRecord[]
  alertThresholds: {
    warning: number
    critical: number
  }
  lastLoggedAlerts: Record<string, boolean>
  
  toggleMode: () => void
  setEnabled: (enabled: boolean) => void
  updateSettings: (settings: Partial<PropFirmSettings>) => void
  resetChallenge: () => void
  updatePeakEquity: (equity: number) => void
  setChallengeStatus: (status: "active" | "at_risk" | "breached" | "completed") => void
  
  selectPreset: (presetId: string, accountSize?: number) => void
  advancePhase: () => void
  failChallenge: () => void
  addViolation: (violation: Omit<ViolationRecord, "id" | "timestamp" | "acknowledged">) => void
  acknowledgeViolation: (violationId: string, journalEntry?: string) => void
  startNewAttempt: (presetId: string, accountSize: number) => void
  getAttemptHistory: () => ChallengeAttempt[]
  getCurrentPhaseInfo: () => { phase: ChallengePhaseRecord | null; preset: PropFirmPreset | null; phaseConfig: PropFirmPhase | null }
  setAlertThresholds: (thresholds: { warning: number; critical: number }) => void
  checkAndLogViolation: (type: ViolationRecord["type"], severity: ViolationRecord["severity"], message: string, valueAtTime: number, limitValue: number) => void
  clearAlertHistory: () => void
}

const defaultSettings: PropFirmSettings = {
  startingBalance: 100000,
  profitTargetPercent: 8,
  maxDrawdownPercent: 10,
  dailyDrawdownPercent: 5,
  challengeStartDate: null,
  minTradingDays: null,
  maxTradingDays: null,
  newsTrading: true,
  weekendHolding: true,
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const usePropFirmStore = create<PropFirmState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      selectedPresetId: null,
      currentAttemptId: null,
      settings: defaultSettings,
      peakEquity: defaultSettings.startingBalance,
      challengeStatus: "active",
      currentPhaseIndex: 0,
      attempts: [],
      violations: [],
      alertThresholds: {
        warning: 70,
        critical: 85,
      },
      lastLoggedAlerts: {},

      toggleMode: () => {
        const { isEnabled, settings } = get()
        if (!isEnabled) {
          set({ 
            isEnabled: true,
            peakEquity: settings.startingBalance,
            challengeStatus: "active",
            settings: {
              ...settings,
              challengeStartDate: settings.challengeStartDate || new Date().toISOString().split('T')[0]
            }
          })
        } else {
          set({ isEnabled: false })
        }
      },

      setEnabled: (enabled: boolean) => {
        const { settings } = get()
        if (enabled) {
          set({ 
            isEnabled: true,
            peakEquity: settings.startingBalance,
            challengeStatus: "active",
            settings: {
              ...settings,
              challengeStartDate: settings.challengeStartDate || new Date().toISOString().split('T')[0]
            }
          })
        } else {
          set({ isEnabled: false })
        }
      },

      updateSettings: (newSettings: Partial<PropFirmSettings>) => {
        const { settings, peakEquity } = get()
        const updatedSettings = { ...settings, ...newSettings }
        
        const startingBalanceChanged = newSettings.startingBalance !== undefined && 
                                        newSettings.startingBalance !== settings.startingBalance
        
        set({ 
          settings: updatedSettings,
          peakEquity: startingBalanceChanged ? updatedSettings.startingBalance : peakEquity
        })
      },

      resetChallenge: () => {
        const { settings, selectedPresetId, currentAttemptId, attempts } = get()
        
        const updatedAttempts = attempts.map(a => 
          a.id === currentAttemptId 
            ? { ...a, status: "reset" as const, endDate: new Date().toISOString(), resetCount: a.resetCount + 1 }
            : a
        )
        
        const newAttemptId = generateId()
        const preset = selectedPresetId ? getPresetById(selectedPresetId) : null
        const phaseConfig = preset?.phases[0]
        
        const newAttempt: ChallengeAttempt = {
          id: newAttemptId,
          presetId: selectedPresetId || "custom",
          presetName: preset?.name || "Custom Challenge",
          accountSize: settings.startingBalance,
          startDate: new Date().toISOString(),
          endDate: null,
          status: "active",
          currentPhaseIndex: 0,
          phases: [{
            phaseIndex: 0,
            phaseName: phaseConfig?.name || "Phase 1",
            startDate: new Date().toISOString(),
            endDate: null,
            startingBalance: settings.startingBalance,
            endingBalance: null,
            status: "active",
            profitTarget: phaseConfig?.profitTarget || settings.profitTargetPercent,
            maxDrawdown: phaseConfig?.maxDrawdown || settings.maxDrawdownPercent,
            dailyDrawdown: phaseConfig?.dailyDrawdown || settings.dailyDrawdownPercent,
            peakEquity: settings.startingBalance,
          }],
          violations: [],
          resetCount: 0,
          totalPnL: 0,
        }
        
        set({
          peakEquity: settings.startingBalance,
          challengeStatus: "active",
          currentPhaseIndex: 0,
          currentAttemptId: newAttemptId,
          attempts: [...updatedAttempts, newAttempt],
          violations: [],
          lastLoggedAlerts: {},
          settings: {
            ...settings,
            challengeStartDate: new Date().toISOString().split('T')[0]
          }
        })
      },

      updatePeakEquity: (equity: number) => {
        const { peakEquity } = get()
        if (equity > peakEquity) {
          set({ peakEquity: equity })
        }
      },

      setChallengeStatus: (status) => set({ challengeStatus: status }),

      selectPreset: (presetId: string, accountSize?: number) => {
        const preset = getPresetById(presetId)
        if (!preset) return
        
        const balance = accountSize || preset.defaultAccountSize
        const phase = preset.phases[0]
        
        const newSettings: PropFirmSettings = {
          startingBalance: balance,
          profitTargetPercent: phase.profitTarget,
          maxDrawdownPercent: phase.maxDrawdown,
          dailyDrawdownPercent: phase.dailyDrawdown,
          challengeStartDate: new Date().toISOString().split('T')[0],
          minTradingDays: phase.minTradingDays,
          maxTradingDays: phase.maxTradingDays,
          newsTrading: phase.newsTrading ?? true,
          weekendHolding: phase.weekendHolding ?? true,
        }
        
        const newAttemptId = generateId()
        const newAttempt: ChallengeAttempt = {
          id: newAttemptId,
          presetId: preset.id,
          presetName: preset.name,
          accountSize: balance,
          startDate: new Date().toISOString(),
          endDate: null,
          status: "active",
          currentPhaseIndex: 0,
          phases: [{
            phaseIndex: 0,
            phaseName: phase.name,
            startDate: new Date().toISOString(),
            endDate: null,
            startingBalance: balance,
            endingBalance: null,
            status: "active",
            profitTarget: phase.profitTarget,
            maxDrawdown: phase.maxDrawdown,
            dailyDrawdown: phase.dailyDrawdown,
            peakEquity: balance,
          }],
          violations: [],
          resetCount: 0,
          totalPnL: 0,
        }
        
        set({
          selectedPresetId: presetId,
          currentAttemptId: newAttemptId,
          settings: newSettings,
          peakEquity: balance,
          challengeStatus: "active",
          currentPhaseIndex: 0,
          attempts: [...get().attempts, newAttempt],
          violations: [],
          isEnabled: true,
        })
      },

      advancePhase: () => {
        const { selectedPresetId, currentPhaseIndex, settings, currentAttemptId, attempts } = get()
        const preset = selectedPresetId ? getPresetById(selectedPresetId) : null
        
        if (!preset) return
        
        const nextPhaseIndex = currentPhaseIndex + 1
        const isFunded = nextPhaseIndex >= preset.phases.length
        const nextPhase = isFunded ? preset.fundedPhase : preset.phases[nextPhaseIndex]
        
        const updatedAttempts = attempts.map(a => {
          if (a.id !== currentAttemptId) return a
          
          const updatedPhases = a.phases.map((p, idx) => 
            idx === currentPhaseIndex 
              ? { ...p, status: "passed" as const, endDate: new Date().toISOString() }
              : p
          )
          
          updatedPhases.push({
            phaseIndex: nextPhaseIndex,
            phaseName: nextPhase.name,
            startDate: new Date().toISOString(),
            endDate: null,
            startingBalance: settings.startingBalance,
            endingBalance: null,
            status: "active",
            profitTarget: nextPhase.profitTarget,
            maxDrawdown: nextPhase.maxDrawdown,
            dailyDrawdown: nextPhase.dailyDrawdown,
            peakEquity: settings.startingBalance,
          })
          
          return {
            ...a,
            currentPhaseIndex: nextPhaseIndex,
            phases: updatedPhases,
            status: isFunded ? "passed" as const : "active" as const,
          }
        })
        
        set({
          currentPhaseIndex: nextPhaseIndex,
          challengeStatus: isFunded ? "completed" : "active",
          attempts: updatedAttempts,
          settings: {
            ...settings,
            profitTargetPercent: nextPhase.profitTarget,
            maxDrawdownPercent: nextPhase.maxDrawdown,
            dailyDrawdownPercent: nextPhase.dailyDrawdown,
            minTradingDays: nextPhase.minTradingDays,
            maxTradingDays: nextPhase.maxTradingDays,
          },
          peakEquity: settings.startingBalance,
        })
      },

      failChallenge: () => {
        const { currentAttemptId, attempts, currentPhaseIndex } = get()
        
        const updatedAttempts = attempts.map(a => {
          if (a.id !== currentAttemptId) return a
          
          const updatedPhases = a.phases.map((p, idx) => 
            idx === currentPhaseIndex 
              ? { ...p, status: "failed" as const, endDate: new Date().toISOString() }
              : p
          )
          
          return {
            ...a,
            status: "failed" as const,
            endDate: new Date().toISOString(),
            phases: updatedPhases,
          }
        })
        
        set({
          challengeStatus: "breached",
          attempts: updatedAttempts,
        })
      },

      addViolation: (violation) => {
        const newViolation: ViolationRecord = {
          ...violation,
          id: generateId(),
          timestamp: new Date().toISOString(),
          acknowledged: false,
        }
        
        set(state => ({
          violations: [...state.violations, newViolation],
        }))
        
        if (violation.severity === "breach") {
          get().failChallenge()
        }
      },

      acknowledgeViolation: (violationId: string, journalEntry?: string) => {
        set(state => ({
          violations: state.violations.map(v => 
            v.id === violationId 
              ? { ...v, acknowledged: true, journalEntry }
              : v
          ),
        }))
      },

      startNewAttempt: (presetId: string, accountSize: number) => {
        get().selectPreset(presetId, accountSize)
      },

      getAttemptHistory: () => {
        return get().attempts.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
      },

      getCurrentPhaseInfo: () => {
        const { selectedPresetId, currentPhaseIndex, currentAttemptId, attempts } = get()
        const preset = selectedPresetId ? getPresetById(selectedPresetId) ?? null : null
        const attempt = attempts.find(a => a.id === currentAttemptId)
        const phase = attempt?.phases.find(p => p.phaseIndex === currentPhaseIndex) || null
        
        const isFunded = preset ? currentPhaseIndex >= preset.phases.length : false
        const phaseConfig = preset 
          ? (isFunded ? preset.fundedPhase : preset.phases[currentPhaseIndex])
          : null
        
        return { phase, preset, phaseConfig }
      },

      setAlertThresholds: (thresholds) => {
        set({ alertThresholds: thresholds })
      },

      checkAndLogViolation: (type, severity, message, valueAtTime, limitValue) => {
        const { lastLoggedAlerts, currentAttemptId } = get()
        const alertKey = `${currentAttemptId}-${type}-${severity}`
        
        if (lastLoggedAlerts[alertKey]) {
          return
        }
        
        const newViolation: ViolationRecord = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type,
          severity,
          message,
          valueAtTime,
          limitValue,
          acknowledged: false,
        }
        
        set(state => ({
          violations: [...state.violations, newViolation],
          lastLoggedAlerts: { ...state.lastLoggedAlerts, [alertKey]: true },
        }))
        
        if (severity === "breach") {
          get().failChallenge()
        }
      },

      clearAlertHistory: () => {
        set({ lastLoggedAlerts: {} })
      },
    }),
    {
      name: "prop-firm-storage",
    }
  )
)

export default usePropFirmStore
