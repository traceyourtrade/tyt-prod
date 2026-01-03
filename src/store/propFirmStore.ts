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

export interface PropChallenge {
  id: string
  name: string
  presetId: string
  presetName: string
  accountSize: number
  settings: PropFirmSettings
  peakEquity: number
  status: "active" | "at_risk" | "breached" | "completed"
  currentPhaseIndex: number
  phases: ChallengePhaseRecord[]
  violations: ViolationRecord[]
  linkedAccountIds: string[]
  startDate: string
  endDate: string | null
  resetCount: number
  totalPnL: number
  lastLoggedAlerts: Record<string, boolean>
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

export interface PhaseAdvancementNotification {
  challengeId: string
  challengeName: string
  fromPhase: string
  toPhase: string
  timestamp: string
}

export interface PropFirmState {
  isEnabled: boolean
  challenges: Record<string, PropChallenge>
  activeChallengeIds: string[]
  viewingChallengeId: string | null
  phaseAdvancementNotification: PhaseAdvancementNotification | null
  alertThresholds: {
    warning: number
    critical: number
  }
  
  // Legacy fields for backwards compatibility
  selectedPresetId: string | null
  currentAttemptId: string | null
  settings: PropFirmSettings
  peakEquity: number
  challengeStatus: "active" | "at_risk" | "breached" | "completed"
  currentPhaseIndex: number
  attempts: ChallengeAttempt[]
  violations: ViolationRecord[]
  lastLoggedAlerts: Record<string, boolean>
  
  // Mode actions
  toggleMode: () => void
  setEnabled: (enabled: boolean) => void
  
  // Multi-challenge actions
  createChallenge: (presetId: string, accountSize: number, name?: string) => string
  deleteChallenge: (challengeId: string) => void
  setViewingChallenge: (challengeId: string | null) => void
  linkAccountToChallenge: (challengeId: string, accountId: string) => void
  unlinkAccountFromChallenge: (challengeId: string, accountId: string) => void
  updateChallengeMetrics: (challengeId: string, metrics: { totalPnL: number; currentEquity: number }) => void
  setChallengeStatusById: (challengeId: string, status: PropChallenge["status"]) => void
  
  // Per-challenge actions
  advanceChallengePhase: (challengeId: string) => void
  failChallengeById: (challengeId: string) => void
  resetChallengeById: (challengeId: string) => void
  checkAndLogChallengeViolation: (
    challengeId: string,
    type: ViolationRecord["type"],
    severity: ViolationRecord["severity"],
    message: string,
    valueAtTime: number,
    limitValue: number
  ) => void
  clearPhaseAdvancementNotification: () => void
  
  // Getters
  getActiveChallenge: () => PropChallenge | null
  getAllActiveChallenges: () => PropChallenge[]
  getChallengeById: (challengeId: string) => PropChallenge | null
  getChallengePhaseInfo: (challengeId: string) => { 
    challenge: PropChallenge | null
    preset: PropFirmPreset | null
    phaseConfig: PropFirmPhase | null 
  }
  getAggregateStats: () => {
    totalCapital: number
    totalPnL: number
    activeChallenges: number
    atRiskCount: number
    nearestBreach: { challengeId: string; percent: number } | null
  }
  
  // Legacy compatibility
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
      challenges: {},
      activeChallengeIds: [],
      viewingChallengeId: null,
      phaseAdvancementNotification: null,
      alertThresholds: {
        warning: 70,
        critical: 85,
      },
      
      // Legacy fields
      selectedPresetId: null,
      currentAttemptId: null,
      settings: defaultSettings,
      peakEquity: defaultSettings.startingBalance,
      challengeStatus: "active",
      currentPhaseIndex: 0,
      attempts: [],
      violations: [],
      lastLoggedAlerts: {},

      toggleMode: () => {
        const { isEnabled } = get()
        set({ isEnabled: !isEnabled })
      },

      setEnabled: (enabled: boolean) => {
        set({ isEnabled: enabled })
      },

      // Multi-challenge actions
      createChallenge: (presetId: string, accountSize: number, name?: string) => {
        const preset = getPresetById(presetId)
        if (!preset) return ""
        
        const challengeId = generateId()
        const phase = preset.phases[0]
        const challengeName = name || `${preset.name} $${(accountSize / 1000).toFixed(0)}k`
        
        const newChallenge: PropChallenge = {
          id: challengeId,
          name: challengeName,
          presetId: preset.id,
          presetName: preset.name,
          accountSize,
          settings: {
            startingBalance: accountSize,
            profitTargetPercent: phase.profitTarget,
            maxDrawdownPercent: phase.maxDrawdown,
            dailyDrawdownPercent: phase.dailyDrawdown,
            challengeStartDate: new Date().toISOString().split('T')[0],
            minTradingDays: phase.minTradingDays,
            maxTradingDays: phase.maxTradingDays,
            newsTrading: phase.newsTrading ?? true,
            weekendHolding: phase.weekendHolding ?? true,
          },
          peakEquity: accountSize,
          status: "active",
          currentPhaseIndex: 0,
          phases: [{
            phaseIndex: 0,
            phaseName: phase.name,
            startDate: new Date().toISOString(),
            endDate: null,
            startingBalance: accountSize,
            endingBalance: null,
            status: "active",
            profitTarget: phase.profitTarget,
            maxDrawdown: phase.maxDrawdown,
            dailyDrawdown: phase.dailyDrawdown,
            peakEquity: accountSize,
          }],
          violations: [],
          linkedAccountIds: [],
          startDate: new Date().toISOString(),
          endDate: null,
          resetCount: 0,
          totalPnL: 0,
          lastLoggedAlerts: {},
        }
        
        set(state => ({
          challenges: { ...state.challenges, [challengeId]: newChallenge },
          activeChallengeIds: [...state.activeChallengeIds, challengeId],
          viewingChallengeId: state.viewingChallengeId || challengeId,
          isEnabled: true,
          // Also set legacy fields for compatibility
          selectedPresetId: presetId,
          currentAttemptId: challengeId,
          settings: newChallenge.settings,
          peakEquity: accountSize,
          challengeStatus: "active",
          currentPhaseIndex: 0,
        }))
        
        return challengeId
      },

      deleteChallenge: (challengeId: string) => {
        set(state => {
          const { [challengeId]: removed, ...remainingChallenges } = state.challenges
          const newActiveIds = state.activeChallengeIds.filter(id => id !== challengeId)
          const newViewingId = state.viewingChallengeId === challengeId 
            ? (newActiveIds[0] || null) 
            : state.viewingChallengeId
          
          return {
            challenges: remainingChallenges,
            activeChallengeIds: newActiveIds,
            viewingChallengeId: newViewingId,
          }
        })
      },

      setViewingChallenge: (challengeId: string | null) => {
        const challenge = challengeId ? get().challenges[challengeId] : null
        set({ 
          viewingChallengeId: challengeId,
          // Update legacy fields when switching
          ...(challenge ? {
            selectedPresetId: challenge.presetId,
            currentAttemptId: challenge.id,
            settings: challenge.settings,
            peakEquity: challenge.peakEquity,
            challengeStatus: challenge.status,
            currentPhaseIndex: challenge.currentPhaseIndex,
          } : {})
        })
      },

      linkAccountToChallenge: (challengeId: string, accountId: string) => {
        set(state => {
          const challenge = state.challenges[challengeId]
          if (!challenge) return state
          
          // Remove account from other challenges first
          const updatedChallenges = { ...state.challenges }
          Object.keys(updatedChallenges).forEach(id => {
            updatedChallenges[id] = {
              ...updatedChallenges[id],
              linkedAccountIds: updatedChallenges[id].linkedAccountIds.filter(aid => aid !== accountId)
            }
          })
          
          // Add to target challenge
          updatedChallenges[challengeId] = {
            ...updatedChallenges[challengeId],
            linkedAccountIds: [...updatedChallenges[challengeId].linkedAccountIds, accountId]
          }
          
          return { challenges: updatedChallenges }
        })
      },

      unlinkAccountFromChallenge: (challengeId: string, accountId: string) => {
        set(state => {
          const challenge = state.challenges[challengeId]
          if (!challenge) return state
          
          return {
            challenges: {
              ...state.challenges,
              [challengeId]: {
                ...challenge,
                linkedAccountIds: challenge.linkedAccountIds.filter(id => id !== accountId)
              }
            }
          }
        })
      },

      updateChallengeMetrics: (challengeId: string, metrics: { totalPnL: number; currentEquity: number }) => {
        const { challenges, advanceChallengePhase } = get()
        const challenge = challenges[challengeId]
        if (!challenge) return
        
        const newPeakEquity = Math.max(challenge.peakEquity, metrics.currentEquity)
        
        // Get preset to check phase info - use current phase's profit target, not settings
        const preset = getPresetById(challenge.presetId)
        const currentPhase = preset?.phases[challenge.currentPhaseIndex]
        const currentPhaseName = currentPhase?.name || `Phase ${challenge.currentPhaseIndex + 1}`
        
        // Use the CURRENT PHASE's profit target, not the static settings
        const currentProfitTargetPercent = currentPhase?.profitTarget ?? challenge.settings.profitTargetPercent
        const profitTargetAmount = challenge.settings.startingBalance * (currentProfitTargetPercent / 100)
        const hasMetProfitTarget = metrics.totalPnL >= profitTargetAmount
        
        const nextPhaseIndex = challenge.currentPhaseIndex + 1
        const isFunded = preset ? nextPhaseIndex >= preset.phases.length : false
        const nextPhase = preset ? (isFunded ? preset.fundedPhase : preset.phases[nextPhaseIndex]) : null
        const nextPhaseName = nextPhase?.name || (isFunded ? "Funded" : `Phase ${nextPhaseIndex + 1}`)
        
        // Only auto-advance if challenge is active and not already breached/completed
        const shouldAutoAdvance = hasMetProfitTarget && 
          challenge.status === "active" && 
          preset !== null
        
        set(state => ({
          challenges: {
            ...state.challenges,
            [challengeId]: {
              ...challenge,
              totalPnL: metrics.totalPnL,
              peakEquity: newPeakEquity,
            }
          }
        }))
        
        // Auto-advance phase if profit target met
        if (shouldAutoAdvance) {
          advanceChallengePhase(challengeId)
          
          // Set notification for UI
          set({
            phaseAdvancementNotification: {
              challengeId,
              challengeName: challenge.name,
              fromPhase: currentPhaseName,
              toPhase: nextPhaseName,
              timestamp: new Date().toISOString(),
            }
          })
        }
      },
      
      clearPhaseAdvancementNotification: () => {
        set({ phaseAdvancementNotification: null })
      },

      setChallengeStatusById: (challengeId: string, status: PropChallenge["status"]) => {
        set(state => {
          const challenge = state.challenges[challengeId]
          if (!challenge) return state
          
          return {
            challenges: {
              ...state.challenges,
              [challengeId]: { ...challenge, status }
            },
            // Update legacy if viewing this challenge
            ...(state.viewingChallengeId === challengeId ? { challengeStatus: status } : {})
          }
        })
      },

      advanceChallengePhase: (challengeId: string) => {
        const { challenges } = get()
        const challenge = challenges[challengeId]
        if (!challenge) return
        
        const preset = getPresetById(challenge.presetId)
        if (!preset) return
        
        const nextPhaseIndex = challenge.currentPhaseIndex + 1
        const isFunded = nextPhaseIndex >= preset.phases.length
        const nextPhase = isFunded ? preset.fundedPhase : preset.phases[nextPhaseIndex]
        
        const updatedPhases = challenge.phases.map((p, idx) => 
          idx === challenge.currentPhaseIndex 
            ? { ...p, status: "passed" as const, endDate: new Date().toISOString() }
            : p
        )
        
        updatedPhases.push({
          phaseIndex: nextPhaseIndex,
          phaseName: nextPhase.name,
          startDate: new Date().toISOString(),
          endDate: null,
          startingBalance: challenge.settings.startingBalance,
          endingBalance: null,
          status: "active",
          profitTarget: nextPhase.profitTarget,
          maxDrawdown: nextPhase.maxDrawdown,
          dailyDrawdown: nextPhase.dailyDrawdown,
          peakEquity: challenge.settings.startingBalance,
        })
        
        set(state => ({
          challenges: {
            ...state.challenges,
            [challengeId]: {
              ...challenge,
              currentPhaseIndex: nextPhaseIndex,
              status: isFunded ? "completed" : "active",
              phases: updatedPhases,
              settings: {
                ...challenge.settings,
                profitTargetPercent: nextPhase.profitTarget,
                maxDrawdownPercent: nextPhase.maxDrawdown,
                dailyDrawdownPercent: nextPhase.dailyDrawdown,
                minTradingDays: nextPhase.minTradingDays,
                maxTradingDays: nextPhase.maxTradingDays,
              },
              peakEquity: challenge.settings.startingBalance,
            }
          }
        }))
      },

      failChallengeById: (challengeId: string) => {
        set(state => {
          const challenge = state.challenges[challengeId]
          if (!challenge) return state
          
          const updatedPhases = challenge.phases.map((p, idx) => 
            idx === challenge.currentPhaseIndex 
              ? { ...p, status: "failed" as const, endDate: new Date().toISOString() }
              : p
          )
          
          return {
            challenges: {
              ...state.challenges,
              [challengeId]: {
                ...challenge,
                status: "breached",
                endDate: new Date().toISOString(),
                phases: updatedPhases,
              }
            },
            activeChallengeIds: state.activeChallengeIds.filter(id => id !== challengeId),
          }
        })
      },

      resetChallengeById: (challengeId: string) => {
        const { challenges } = get()
        const challenge = challenges[challengeId]
        if (!challenge) return
        
        const preset = getPresetById(challenge.presetId)
        const phaseConfig = preset?.phases[0]
        
        set(state => ({
          challenges: {
            ...state.challenges,
            [challengeId]: {
              ...challenge,
              status: "active",
              currentPhaseIndex: 0,
              peakEquity: challenge.accountSize,
              phases: [{
                phaseIndex: 0,
                phaseName: phaseConfig?.name || "Phase 1",
                startDate: new Date().toISOString(),
                endDate: null,
                startingBalance: challenge.accountSize,
                endingBalance: null,
                status: "active",
                profitTarget: phaseConfig?.profitTarget || challenge.settings.profitTargetPercent,
                maxDrawdown: phaseConfig?.maxDrawdown || challenge.settings.maxDrawdownPercent,
                dailyDrawdown: phaseConfig?.dailyDrawdown || challenge.settings.dailyDrawdownPercent,
                peakEquity: challenge.accountSize,
              }],
              violations: [],
              resetCount: challenge.resetCount + 1,
              totalPnL: 0,
              startDate: new Date().toISOString(),
              endDate: null,
              lastLoggedAlerts: {},
              settings: {
                ...challenge.settings,
                challengeStartDate: new Date().toISOString().split('T')[0],
              }
            }
          },
          activeChallengeIds: state.activeChallengeIds.includes(challengeId) 
            ? state.activeChallengeIds 
            : [...state.activeChallengeIds, challengeId],
        }))
      },

      checkAndLogChallengeViolation: (challengeId, type, severity, message, valueAtTime, limitValue) => {
        const { challenges } = get()
        const challenge = challenges[challengeId]
        if (!challenge) return
        
        const alertKey = `${challengeId}-${type}-${severity}`
        if (challenge.lastLoggedAlerts[alertKey]) return
        
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
          challenges: {
            ...state.challenges,
            [challengeId]: {
              ...challenge,
              violations: [...challenge.violations, newViolation],
              lastLoggedAlerts: { ...challenge.lastLoggedAlerts, [alertKey]: true },
            }
          }
        }))
        
        if (severity === "breach") {
          get().failChallengeById(challengeId)
        }
      },

      // Getters
      getActiveChallenge: () => {
        const { viewingChallengeId, challenges } = get()
        return viewingChallengeId ? challenges[viewingChallengeId] || null : null
      },

      getAllActiveChallenges: () => {
        const { activeChallengeIds, challenges } = get()
        return activeChallengeIds.map(id => challenges[id]).filter(Boolean)
      },

      getChallengeById: (challengeId: string) => {
        return get().challenges[challengeId] || null
      },

      getChallengePhaseInfo: (challengeId: string) => {
        const { challenges } = get()
        const challenge = challenges[challengeId]
        if (!challenge) return { challenge: null, preset: null, phaseConfig: null }
        
        const preset = getPresetById(challenge.presetId) ?? null
        const isFunded = preset ? challenge.currentPhaseIndex >= preset.phases.length : false
        const phaseConfig = preset 
          ? (isFunded ? preset.fundedPhase : preset.phases[challenge.currentPhaseIndex])
          : null
        
        return { challenge, preset, phaseConfig }
      },

      getAggregateStats: () => {
        const { activeChallengeIds, challenges } = get()
        const activeChallenges = activeChallengeIds.map(id => challenges[id]).filter(Boolean)
        
        let totalCapital = 0
        let totalPnL = 0
        let atRiskCount = 0
        let nearestBreach: { challengeId: string; percent: number } | null = null
        
        activeChallenges.forEach(challenge => {
          totalCapital += challenge.accountSize
          totalPnL += challenge.totalPnL
          
          if (challenge.status === "at_risk") atRiskCount++
          
          const drawdownPercent = ((challenge.peakEquity - (challenge.accountSize + challenge.totalPnL)) / 
            (challenge.accountSize * (challenge.settings.maxDrawdownPercent / 100))) * 100
          
          if (!nearestBreach || drawdownPercent > nearestBreach.percent) {
            nearestBreach = { challengeId: challenge.id, percent: Math.max(0, drawdownPercent) }
          }
        })
        
        return {
          totalCapital,
          totalPnL,
          activeChallenges: activeChallenges.length,
          atRiskCount,
          nearestBreach,
        }
      },

      // Legacy compatibility methods
      updateSettings: (newSettings: Partial<PropFirmSettings>) => {
        const { settings, peakEquity, viewingChallengeId, challenges } = get()
        const updatedSettings = { ...settings, ...newSettings }
        
        const startingBalanceChanged = newSettings.startingBalance !== undefined && 
                                        newSettings.startingBalance !== settings.startingBalance
        
        const updates: Partial<PropFirmState> = { 
          settings: updatedSettings,
          peakEquity: startingBalanceChanged ? updatedSettings.startingBalance : peakEquity
        }
        
        // Also update the viewing challenge
        if (viewingChallengeId && challenges[viewingChallengeId]) {
          updates.challenges = {
            ...challenges,
            [viewingChallengeId]: {
              ...challenges[viewingChallengeId],
              settings: updatedSettings,
              peakEquity: startingBalanceChanged ? updatedSettings.startingBalance : challenges[viewingChallengeId].peakEquity,
            }
          }
        }
        
        set(updates)
      },

      resetChallenge: () => {
        const { viewingChallengeId } = get()
        if (viewingChallengeId) {
          get().resetChallengeById(viewingChallengeId)
        }
      },

      updatePeakEquity: (equity: number) => {
        const { peakEquity, viewingChallengeId, challenges } = get()
        if (equity > peakEquity) {
          const updates: Partial<PropFirmState> = { peakEquity: equity }
          
          if (viewingChallengeId && challenges[viewingChallengeId]) {
            updates.challenges = {
              ...challenges,
              [viewingChallengeId]: {
                ...challenges[viewingChallengeId],
                peakEquity: equity,
              }
            }
          }
          
          set(updates)
        }
      },

      setChallengeStatus: (status) => {
        const { viewingChallengeId } = get()
        set({ challengeStatus: status })
        if (viewingChallengeId) {
          get().setChallengeStatusById(viewingChallengeId, status)
        }
      },

      selectPreset: (presetId: string, accountSize?: number) => {
        const preset = getPresetById(presetId)
        if (!preset) return
        
        const balance = accountSize || preset.defaultAccountSize
        get().createChallenge(presetId, balance)
      },

      advancePhase: () => {
        const { viewingChallengeId } = get()
        if (viewingChallengeId) {
          get().advanceChallengePhase(viewingChallengeId)
        }
      },

      failChallenge: () => {
        const { viewingChallengeId } = get()
        if (viewingChallengeId) {
          get().failChallengeById(viewingChallengeId)
        }
      },

      addViolation: (violation) => {
        const { viewingChallengeId } = get()
        if (viewingChallengeId) {
          get().checkAndLogChallengeViolation(
            viewingChallengeId,
            violation.type,
            violation.severity,
            violation.message,
            violation.valueAtTime,
            violation.limitValue
          )
        }
      },

      acknowledgeViolation: (violationId: string, journalEntry?: string) => {
        const { viewingChallengeId, challenges } = get()
        if (!viewingChallengeId) return
        
        const challenge = challenges[viewingChallengeId]
        if (!challenge) return
        
        set({
          challenges: {
            ...challenges,
            [viewingChallengeId]: {
              ...challenge,
              violations: challenge.violations.map(v => 
                v.id === violationId 
                  ? { ...v, acknowledged: true, journalEntry }
                  : v
              ),
            }
          }
        })
      },

      startNewAttempt: (presetId: string, accountSize: number) => {
        get().createChallenge(presetId, accountSize)
      },

      getAttemptHistory: () => {
        const { challenges } = get()
        return Object.values(challenges)
          .map(c => ({
            id: c.id,
            presetId: c.presetId,
            presetName: c.presetName,
            accountSize: c.accountSize,
            startDate: c.startDate,
            endDate: c.endDate,
            status: c.status === "breached" ? "failed" as const : c.status === "completed" ? "passed" as const : "active" as const,
            currentPhaseIndex: c.currentPhaseIndex,
            phases: c.phases,
            violations: c.violations,
            resetCount: c.resetCount,
            totalPnL: c.totalPnL,
          }))
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      },

      getCurrentPhaseInfo: () => {
        const { viewingChallengeId, challenges, selectedPresetId, currentPhaseIndex } = get()
        
        if (viewingChallengeId && challenges[viewingChallengeId]) {
          const result = get().getChallengePhaseInfo(viewingChallengeId)
          const phase = result.challenge?.phases.find(p => p.phaseIndex === result.challenge?.currentPhaseIndex) || null
          return { phase, preset: result.preset, phaseConfig: result.phaseConfig }
        }
        
        // Fallback to legacy
        const preset = selectedPresetId ? getPresetById(selectedPresetId) ?? null : null
        const isFunded = preset ? currentPhaseIndex >= preset.phases.length : false
        const phaseConfig = preset 
          ? (isFunded ? preset.fundedPhase : preset.phases[currentPhaseIndex])
          : null
        
        return { phase: null, preset, phaseConfig }
      },

      setAlertThresholds: (thresholds) => {
        set({ alertThresholds: thresholds })
      },

      checkAndLogViolation: (type, severity, message, valueAtTime, limitValue) => {
        const { viewingChallengeId } = get()
        if (viewingChallengeId) {
          get().checkAndLogChallengeViolation(viewingChallengeId, type, severity, message, valueAtTime, limitValue)
        }
      },

      clearAlertHistory: () => {
        const { viewingChallengeId, challenges } = get()
        if (viewingChallengeId && challenges[viewingChallengeId]) {
          set({
            challenges: {
              ...challenges,
              [viewingChallengeId]: {
                ...challenges[viewingChallengeId],
                lastLoggedAlerts: {},
              }
            },
            lastLoggedAlerts: {},
          })
        } else {
          set({ lastLoggedAlerts: {} })
        }
      },
    }),
    {
      name: "prop-firm-storage",
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        // Handle undefined or null persisted state (fresh profile)
        if (!persistedState || typeof persistedState !== 'object') {
          return {
            challenges: {},
            activeChallengeIds: [],
            viewingChallengeId: null,
          }
        }
        
        const state = persistedState as Record<string, unknown>
        
        if (version < 2) {
          const legacySettings = state.settings as PropFirmSettings | undefined
          const legacyPresetId = state.selectedPresetId as string | undefined
          const legacyAttemptId = state.currentAttemptId as string | undefined
          
          if (legacySettings && legacyPresetId && legacyAttemptId && state.isEnabled) {
            const challengeId = legacyAttemptId
            const challenge: PropChallenge = {
              id: challengeId,
              name: `${legacyPresetId} $${((legacySettings.startingBalance || 100000) / 1000).toFixed(0)}k`,
              presetId: legacyPresetId,
              presetName: legacyPresetId,
              accountSize: legacySettings.startingBalance || 100000,
              settings: legacySettings,
              peakEquity: (state.peakEquity as number) || legacySettings.startingBalance || 100000,
              status: (state.challengeStatus as PropChallenge["status"]) || "active",
              currentPhaseIndex: (state.currentPhaseIndex as number) || 0,
              phases: [],
              violations: (state.violations as ViolationRecord[]) || [],
              linkedAccountIds: [],
              startDate: legacySettings.challengeStartDate || new Date().toISOString(),
              endDate: null,
              resetCount: 0,
              totalPnL: 0,
              lastLoggedAlerts: (state.lastLoggedAlerts as Record<string, boolean>) || {},
            }
            
            return {
              ...state,
              challenges: { [challengeId]: challenge },
              activeChallengeIds: [challengeId],
              viewingChallengeId: challengeId,
            }
          }
          
          return {
            ...state,
            challenges: (state.challenges as Record<string, PropChallenge>) || {},
            activeChallengeIds: (state.activeChallengeIds as string[]) || [],
            viewingChallengeId: (state.viewingChallengeId as string | null) || null,
          }
        }
        
        return state as unknown as PropFirmState
      },
    }
  )
)

export default usePropFirmStore
