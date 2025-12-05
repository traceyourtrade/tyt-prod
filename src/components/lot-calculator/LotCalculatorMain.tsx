"use client"

import { useState, useMemo } from "react"
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  TrendingDown, 
  Coins,
  RefreshCw,
  Info,
  Copy,
  Check,
  AlertTriangle
} from "lucide-react"

interface CurrencyPair {
  symbol: string
  type: "USD_QUOTE" | "USD_BASE" | "CROSS" | "GOLD"
  pipSize: number
  contractSize: number
  defaultRate?: number
}

const currencyPairs: CurrencyPair[] = [
  { symbol: "EUR/USD", type: "USD_QUOTE", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "GBP/USD", type: "USD_QUOTE", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "AUD/USD", type: "USD_QUOTE", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "NZD/USD", type: "USD_QUOTE", pipSize: 0.0001, contractSize: 100000 },
  { symbol: "USD/JPY", type: "USD_BASE", pipSize: 0.01, contractSize: 100000, defaultRate: 150 },
  { symbol: "USD/CHF", type: "USD_BASE", pipSize: 0.0001, contractSize: 100000, defaultRate: 0.88 },
  { symbol: "USD/CAD", type: "USD_BASE", pipSize: 0.0001, contractSize: 100000, defaultRate: 1.36 },
  { symbol: "EUR/JPY", type: "CROSS", pipSize: 0.01, contractSize: 100000, defaultRate: 163 },
  { symbol: "GBP/JPY", type: "CROSS", pipSize: 0.01, contractSize: 100000, defaultRate: 190 },
  { symbol: "EUR/GBP", type: "CROSS", pipSize: 0.0001, contractSize: 100000, defaultRate: 0.86 },
  { symbol: "AUD/JPY", type: "CROSS", pipSize: 0.01, contractSize: 100000, defaultRate: 98 },
  { symbol: "EUR/AUD", type: "CROSS", pipSize: 0.0001, contractSize: 100000, defaultRate: 1.66 },
  { symbol: "GBP/AUD", type: "CROSS", pipSize: 0.0001, contractSize: 100000, defaultRate: 1.93 },
  { symbol: "EUR/CAD", type: "CROSS", pipSize: 0.0001, contractSize: 100000, defaultRate: 1.48 },
  { symbol: "GBP/CAD", type: "CROSS", pipSize: 0.0001, contractSize: 100000, defaultRate: 1.73 },
  { symbol: "XAU/USD", type: "GOLD", pipSize: 0.01, contractSize: 100, defaultRate: 2000 },
]

export default function LotCalculatorMain() {
  const [accountBalance, setAccountBalance] = useState<string>("10000")
  const [riskPercent, setRiskPercent] = useState<string>("1")
  const [stopLossPips, setStopLossPips] = useState<string>("50")
  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(currencyPairs[0])
  const [exchangeRate, setExchangeRate] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const validationErrors = useMemo(() => {
    const errors: string[] = []
    const balance = parseFloat(accountBalance)
    const risk = parseFloat(riskPercent)
    const pips = parseFloat(stopLossPips)

    if (!accountBalance || isNaN(balance) || balance <= 0) {
      errors.push("Account balance must be greater than 0")
    }
    if (!riskPercent || isNaN(risk) || risk <= 0 || risk > 100) {
      errors.push("Risk must be between 0.1% and 100%")
    }
    if (!stopLossPips || isNaN(pips) || pips <= 0) {
      errors.push("Stop loss must be greater than 0 pips")
    }
    return errors
  }, [accountBalance, riskPercent, stopLossPips])

  const isValid = validationErrors.length === 0

  const calculations = useMemo(() => {
    if (!isValid) {
      return {
        lotSize: 0,
        standardLots: "0.00",
        miniLots: "0.00",
        microLots: "0.00",
        riskAmount: 0,
        pipValue: 0,
        actualRisk: 0
      }
    }

    const balance = parseFloat(accountBalance)
    const risk = parseFloat(riskPercent)
    const pips = parseFloat(stopLossPips)
    const rate = exchangeRate ? parseFloat(exchangeRate) : selectedPair.defaultRate || 1

    const riskAmount = balance * (risk / 100)
    
    let pipValue: number
    
    if (selectedPair.type === "USD_QUOTE") {
      pipValue = selectedPair.pipSize * selectedPair.contractSize
    } else if (selectedPair.type === "USD_BASE") {
      pipValue = (selectedPair.pipSize * selectedPair.contractSize) / rate
    } else if (selectedPair.type === "GOLD") {
      pipValue = selectedPair.pipSize * selectedPair.contractSize
    } else {
      const quoteCurrency = selectedPair.symbol.split("/")[1]
      if (quoteCurrency === "JPY") {
        pipValue = (selectedPair.pipSize * selectedPair.contractSize) / rate
      } else {
        pipValue = (selectedPair.pipSize * selectedPair.contractSize) / rate
      }
    }

    const lotSize = riskAmount / (pips * pipValue)
    const actualRisk = lotSize * pips * pipValue

    return {
      lotSize,
      standardLots: lotSize.toFixed(2),
      miniLots: (lotSize * 10).toFixed(2),
      microLots: (lotSize * 100).toFixed(2),
      riskAmount,
      pipValue,
      actualRisk
    }
  }, [accountBalance, riskPercent, stopLossPips, selectedPair, exchangeRate, isValid])

  const handleReset = () => {
    setAccountBalance("10000")
    setRiskPercent("1")
    setStopLossPips("50")
    setSelectedPair(currencyPairs[0])
    setExchangeRate("")
  }

  const copyLotSize = () => {
    navigator.clipboard.writeText(calculations.standardLots)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const needsExchangeRate = selectedPair.type !== "USD_QUOTE"

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lot Size Calculator</h1>
            <p className="text-sm text-muted-foreground">Calculate your optimal position size for forex trading</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Trade Parameters</h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  Account Balance (USD)
                </label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Percent className="w-4 h-4" />
                  Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  step="0.5"
                  min="0.1"
                  max="100"
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="1"
                />
                <div className="flex gap-2 mt-2">
                  {["0.5", "1", "2", "3"].map((val) => (
                    <button
                      key={val}
                      onClick={() => setRiskPercent(val)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        riskPercent === val
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <TrendingDown className="w-4 h-4" />
                  Stop Loss (Pips)
                </label>
                <input
                  type="number"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Coins className="w-4 h-4" />
                  Currency Pair
                </label>
                <select
                  value={selectedPair.symbol}
                  onChange={(e) => {
                    const pair = currencyPairs.find(p => p.symbol === e.target.value)
                    if (pair) {
                      setSelectedPair(pair)
                      setExchangeRate("")
                    }
                  }}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer"
                >
                  {currencyPairs.map((pair) => (
                    <option key={pair.symbol} value={pair.symbol} className="bg-card">
                      {pair.symbol}
                    </option>
                  ))}
                </select>
              </div>

              {needsExchangeRate && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <DollarSign className="w-4 h-4" />
                    Current Price (Optional)
                    <span className="text-xs text-muted-foreground/60">
                      Default: {selectedPair.defaultRate}
                    </span>
                  </label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    step="0.0001"
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder={`${selectedPair.defaultRate}`}
                  />
                </div>
              )}
            </div>

            {validationErrors.length > 0 && (
              <div className="mt-5 p-4 bg-loss/10 border border-loss/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-loss mt-0.5 flex-shrink-0" />
                  <div>
                    {validationErrors.map((error, i) => (
                      <p key={i} className="text-sm text-loss">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/20 border border-border/30 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Risk Management Tip</p>
              <p>Professional traders typically risk 1-2% per trade. For cross pairs and JPY pairs, enter the current market price for more accurate calculations.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`bg-gradient-to-br from-primary/10 via-card to-card border rounded-2xl p-6 ${isValid ? 'border-primary/20' : 'border-border/50 opacity-60'}`}>
            <h2 className="text-lg font-semibold text-foreground mb-6">Calculation Results</h2>

            <div className="bg-card/80 backdrop-blur rounded-xl p-5 mb-5 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recommended Lot Size</span>
                <button
                  onClick={copyLotSize}
                  disabled={!isValid}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-profit" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">{calculations.standardLots}</span>
                <span className="text-lg text-muted-foreground">lots</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Standard</span>
                <span className="text-lg font-bold text-foreground">{calculations.standardLots}</span>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Mini</span>
                <span className="text-lg font-bold text-foreground">{calculations.miniLots}</span>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <span className="text-xs text-muted-foreground block mb-1">Micro</span>
                <span className="text-lg font-bold text-foreground">{calculations.microLots}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Risk Amount</span>
                <span className="text-lg font-semibold text-loss">${calculations.riskAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Pip Value</span>
                <span className="text-lg font-semibold text-foreground">${calculations.pipValue.toFixed(2)}/lot</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Actual Risk</span>
                <span className="text-lg font-semibold text-foreground">${calculations.actualRisk.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">Account Risk</span>
                <span className="text-lg font-semibold text-primary">{riskPercent}%</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Lot Size Reference</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>1 Standard Lot</span>
                <span className="font-medium text-foreground">100,000 units</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>1 Mini Lot</span>
                <span className="font-medium text-foreground">10,000 units</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>1 Micro Lot</span>
                <span className="font-medium text-foreground">1,000 units</span>
              </div>
            </div>
          </div>

          {needsExchangeRate && (
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Exchange Rate Note</p>
                <p>Using {exchangeRate || selectedPair.defaultRate} as the current price. For precise calculations, enter the live market price.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
