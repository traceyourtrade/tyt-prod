"use client"

import { useState } from "react"
import { ExternalLink, Copy, Check, Sparkles, Award, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropFirm {
  name: string
  logo: string
  startingPrice: number
  url: string
  highlight?: string
}

const PROP_FIRMS: PropFirm[] = [
  {
    name: "Funding Pips",
    logo: "🎯",
    startingPrice: 59,
    url: "https://fundingpips.com",
    highlight: "Popular"
  },
  {
    name: "The 5%ers",
    logo: "🏆",
    startingPrice: 95,
    url: "https://the5ers.com",
    highlight: "Low Risk"
  },
  {
    name: "Funded Next",
    logo: "⚡",
    startingPrice: 32,
    url: "https://fundednext.com",
    highlight: "Best Value"
  },
  {
    name: "FTMO",
    logo: "💎",
    startingPrice: 155,
    url: "https://ftmo.com",
    highlight: "Top Rated"
  },
  {
    name: "Alpha Capitals",
    logo: "🚀",
    startingPrice: 47,
    url: "https://alphacapitals.com"
  }
]

const COUPON_CODE = "projournx"
const DISCOUNT = 15

function PropFirmCard({ firm }: { firm: PropFirm }) {
  return (
    <div className={cn(
      "relative flex items-center gap-3 p-3 rounded-xl",
      "bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10",
      "hover:border-amber-500/30 hover:bg-amber-500/5 dark:hover:bg-amber-500/10",
      "transition-all group"
    )}>
      {firm.highlight && (
        <div className="absolute -top-2 right-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
          {firm.highlight}
        </div>
      )}
      
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10 border border-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
        {firm.logo}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {firm.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-white/50">
          From <span className="text-amber-600 dark:text-amber-400 font-bold">${firm.startingPrice}</span>
        </p>
      </div>
      
      <a
        href={firm.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5",
          "bg-amber-500 hover:bg-amber-600 text-white",
          "rounded-lg text-xs font-semibold",
          "transition-all hover:scale-105 shadow-sm shadow-amber-500/20",
          "flex-shrink-0"
        )}
      >
        Buy
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

export default function PropFirmSuggestions() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(COUPON_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border backdrop-blur-sm",
      "bg-white dark:bg-transparent",
      "bg-gradient-to-br from-amber-500/5 via-amber-600/[0.02] to-transparent dark:from-amber-500/10 dark:via-amber-600/5",
      "border-amber-500/20",
      "p-4"
    )}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Prop Firms We Suggest</h3>
            <p className="text-[10px] text-gray-500 dark:text-white/40">Top rated & trusted</p>
          </div>
        </div>

        <div className={cn(
          "mb-4 p-3 rounded-xl",
          "bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10",
          "border border-amber-500/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {DISCOUNT}% OFF with our code!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white dark:bg-black/20 border border-amber-500/30 rounded-lg text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wider">
              {COUPON_CODE.toUpperCase()}
            </code>
            <button
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-lg border transition-all",
                copied 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {PROP_FIRMS.map((firm) => (
            <PropFirmCard key={firm.name} firm={firm} />
          ))}
        </div>

        <p className="mt-4 text-[10px] text-center text-gray-400 dark:text-white/30">
          We may earn a commission from these links
        </p>
      </div>
    </div>
  )
}
