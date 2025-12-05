"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface PropFirmSettings {
  startingBalance: number
  profitTargetPercent: number
  maxDrawdownPercent: number
  dailyDrawdownPercent: number | null
  challengeStartDate: string | null
}

export interface PropFirmState {
  isEnabled: boolean
  settings: PropFirmSettings
  peakEquity: number
  challengeStatus: "active" | "at_risk" | "breached" | "completed"
  
  toggleMode: () => void
  setEnabled: (enabled: boolean) => void
  updateSettings: (settings: Partial<PropFirmSettings>) => void
  resetChallenge: () => void
  updatePeakEquity: (equity: number) => void
  setChallengeStatus: (status: "active" | "at_risk" | "breached" | "completed") => void
}

const defaultSettings: PropFirmSettings = {
  startingBalance: 100000,
  profitTargetPercent: 8,
  maxDrawdownPercent: 10,
  dailyDrawdownPercent: 5,
  challengeStartDate: null,
}

const usePropFirmStore = create<PropFirmState>()(
  persist(
    (set, get) => ({
      isEnabled: false,
      settings: defaultSettings,
      peakEquity: defaultSettings.startingBalance,
      challengeStatus: "active",

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
        const { settings } = get()
        set({
          peakEquity: settings.startingBalance,
          challengeStatus: "active",
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
    }),
    {
      name: "prop-firm-storage",
    }
  )
)

export default usePropFirmStore
