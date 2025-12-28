export interface PropFirmPhase {
  name: string
  profitTarget: number
  maxDrawdown: number
  dailyDrawdown: number | null
  minTradingDays: number | null
  maxTradingDays: number | null
  lotSizeRule?: string
  newsTrading?: boolean
  weekendHolding?: boolean
}

export interface PropFirmPreset {
  id: string
  name: string
  shortName: string
  logo?: string
  website: string
  description: string
  phases: PropFirmPhase[]
  fundedPhase: PropFirmPhase
  accountSizes: number[]
  defaultAccountSize: number
  scalingPlan?: {
    requirement: string
    increasePercent: number
  }
  profitSplit: {
    initial: number
    scaled?: number
  }
  resetFee?: {
    percent: number
    minDays?: number
  }
  features: string[]
  restrictions: string[]
}

export const propFirmPresets: PropFirmPreset[] = [
  {
    id: "ftmo",
    name: "FTMO",
    shortName: "FTMO",
    website: "https://ftmo.com",
    description: "One of the most popular prop firms with a 2-step evaluation process",
    phases: [
      {
        name: "Challenge",
        profitTarget: 10,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 4,
        maxTradingDays: 30,
        newsTrading: true,
        weekendHolding: true,
      },
      {
        name: "Verification",
        profitTarget: 5,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 4,
        maxTradingDays: 60,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [10000, 25000, 50000, 100000, 200000],
    defaultAccountSize: 100000,
    scalingPlan: {
      requirement: "4 months profitable with 10%+ total profit",
      increasePercent: 25,
    },
    profitSplit: {
      initial: 80,
      scaled: 90,
    },
    resetFee: {
      percent: 89,
      minDays: 14,
    },
    features: [
      "Free retry on phase 2 if phase 1 passed",
      "Bi-weekly payouts",
      "Scaling plan available",
      "Free educational resources",
    ],
    restrictions: [
      "No martingale or grid strategies",
      "No copy trading from other prop accounts",
    ],
  },
  {
    id: "the-funded-trader",
    name: "The Funded Trader",
    shortName: "TFT",
    website: "https://thefundedtrader.com",
    description: "Popular prop firm with multiple challenge types",
    phases: [
      {
        name: "Challenge",
        profitTarget: 10,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 3,
        maxTradingDays: 35,
        newsTrading: true,
        weekendHolding: true,
      },
      {
        name: "Verification",
        profitTarget: 5,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 3,
        maxTradingDays: 60,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [5000, 10000, 25000, 50000, 100000, 200000, 400000],
    defaultAccountSize: 100000,
    scalingPlan: {
      requirement: "3 months profitable",
      increasePercent: 25,
    },
    profitSplit: {
      initial: 80,
      scaled: 90,
    },
    features: [
      "Multiple challenge types (Standard, Rapid, Royal)",
      "Scaling up to $1.5M",
      "Bi-weekly payouts",
    ],
    restrictions: [
      "No hedging between accounts",
      "No high-frequency trading",
    ],
  },
  {
    id: "the5ers",
    name: "The5ers",
    shortName: "The5ers",
    website: "https://the5ers.com",
    description: "Instant funding option with growth-focused programs",
    phases: [
      {
        name: "Evaluation",
        profitTarget: 8,
        maxDrawdown: 6,
        dailyDrawdown: 4,
        minTradingDays: 3,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: false,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 10,
      maxDrawdown: 6,
      dailyDrawdown: 4,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: false,
    },
    accountSizes: [6000, 20000, 60000, 100000],
    defaultAccountSize: 100000,
    scalingPlan: {
      requirement: "10% profit target",
      increasePercent: 100,
    },
    profitSplit: {
      initial: 50,
      scaled: 100,
    },
    features: [
      "Instant funding option",
      "Triple capital when reaching milestones",
      "No time limit on evaluation",
    ],
    restrictions: [
      "No weekend holding",
      "Position must be closed before 4pm Friday",
    ],
  },
  {
    id: "my-forex-funds",
    name: "MyForexFunds",
    shortName: "MFF",
    website: "https://myforexfunds.com",
    description: "Affordable challenges with flexible rules",
    phases: [
      {
        name: "Evaluation",
        profitTarget: 8,
        maxDrawdown: 12,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: 30,
        newsTrading: true,
        weekendHolding: true,
      },
      {
        name: "Verification",
        profitTarget: 5,
        maxDrawdown: 12,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: 60,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 12,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [5000, 10000, 25000, 50000, 100000, 200000, 300000],
    defaultAccountSize: 100000,
    profitSplit: {
      initial: 75,
      scaled: 85,
    },
    features: [
      "Affordable pricing",
      "12% max drawdown (higher than competitors)",
      "Scaling available",
    ],
    restrictions: [
      "No martingale strategies",
    ],
  },
  {
    id: "true-forex-funds",
    name: "True Forex Funds",
    shortName: "TFF",
    website: "https://trueforexfunds.com",
    description: "Simple evaluation with competitive profit splits",
    phases: [
      {
        name: "Phase 1",
        profitTarget: 8,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: 30,
        newsTrading: true,
        weekendHolding: true,
      },
      {
        name: "Phase 2",
        profitTarget: 5,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: 60,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [10000, 25000, 50000, 100000, 200000],
    defaultAccountSize: 100000,
    profitSplit: {
      initial: 80,
      scaled: 90,
    },
    features: [
      "Simple 2-phase evaluation",
      "Up to 90% profit split",
      "Weekly payouts after first month",
    ],
    restrictions: [
      "No copy trading",
    ],
  },
  {
    id: "e8-funding",
    name: "E8 Funding",
    shortName: "E8",
    website: "https://e8funding.com",
    description: "Single-phase evaluation with scaling opportunities",
    phases: [
      {
        name: "Evaluation",
        profitTarget: 8,
        maxDrawdown: 8,
        dailyDrawdown: 4,
        minTradingDays: 5,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 8,
      dailyDrawdown: 4,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [25000, 50000, 100000, 250000],
    defaultAccountSize: 100000,
    scalingPlan: {
      requirement: "8% profit with consistency",
      increasePercent: 25,
    },
    profitSplit: {
      initial: 80,
    },
    features: [
      "Single-phase evaluation",
      "No time limit",
      "Scaling up to $1M",
    ],
    restrictions: [
      "8% max drawdown (trailing)",
    ],
  },
  {
    id: "funded-next",
    name: "Funded Next",
    shortName: "FNext",
    website: "https://fundednext.com",
    description: "Multiple program types with profit sharing from day 1",
    phases: [
      {
        name: "Evaluation",
        profitTarget: 10,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: true,
      },
      {
        name: "Verification",
        profitTarget: 5,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [6000, 15000, 25000, 50000, 100000, 200000],
    defaultAccountSize: 100000,
    scalingPlan: {
      requirement: "10% profit every 4 months",
      increasePercent: 40,
    },
    profitSplit: {
      initial: 80,
      scaled: 95,
    },
    features: [
      "15% profit share during evaluation",
      "Up to 95% profit split when scaled",
      "No time limit on phases",
      "Scaling up to $4M",
    ],
    restrictions: [
      "Consistency rule applies",
    ],
  },
  {
    id: "alpha-capital",
    name: "Alpha Capital Group",
    shortName: "ACG",
    website: "https://alphacapitalgroup.uk",
    description: "UK-based prop firm with straightforward evaluation",
    phases: [
      {
        name: "Phase 1",
        profitTarget: 8,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: true,
      },
      {
        name: "Phase 2",
        profitTarget: 5,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: 5,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [10000, 25000, 50000, 100000, 200000],
    defaultAccountSize: 100000,
    profitSplit: {
      initial: 80,
    },
    features: [
      "No time limit",
      "Straightforward rules",
      "Quick verification",
    ],
    restrictions: [],
  },
  {
    id: "custom",
    name: "Custom Challenge",
    shortName: "Custom",
    website: "",
    description: "Create your own custom prop firm challenge settings",
    phases: [
      {
        name: "Phase 1",
        profitTarget: 10,
        maxDrawdown: 10,
        dailyDrawdown: 5,
        minTradingDays: null,
        maxTradingDays: null,
        newsTrading: true,
        weekendHolding: true,
      },
    ],
    fundedPhase: {
      name: "Funded",
      profitTarget: 0,
      maxDrawdown: 10,
      dailyDrawdown: 5,
      minTradingDays: null,
      maxTradingDays: null,
      newsTrading: true,
      weekendHolding: true,
    },
    accountSizes: [10000, 25000, 50000, 100000, 200000],
    defaultAccountSize: 100000,
    profitSplit: {
      initial: 80,
    },
    features: [
      "Fully customizable settings",
    ],
    restrictions: [],
  },
]

export function getPresetById(id: string): PropFirmPreset | undefined {
  return propFirmPresets.find(preset => preset.id === id)
}

export function getPresetPhaseSettings(presetId: string, phaseIndex: number) {
  const preset = getPresetById(presetId)
  if (!preset) return null
  
  if (phaseIndex >= preset.phases.length) {
    return preset.fundedPhase
  }
  
  return preset.phases[phaseIndex]
}
