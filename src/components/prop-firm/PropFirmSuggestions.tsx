"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Copy, Check, Sparkles, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropFirm {
  name: string
  logoUrl: string
  logoFallback: string
  startingPrice: number
  url: string
  highlight?: string
}

const PROP_FIRMS: PropFirm[] = [
  {
    name: "Funding Pips",
    logoUrl: "https://fundingpips.com/wp-content/uploads/2023/03/cropped-Funding-Pips-Fav-icon-192x192.png",
    logoFallback: "FP",
    startingPrice: 59,
    url: "https://fundingpips.com",
    highlight: "Popular"
  },
  {
    name: "The 5%ers",
    logoUrl: "https://the5ers.com/wp-content/uploads/2021/06/cropped-fav-192x192.png",
    logoFallback: "5%",
    startingPrice: 95,
    url: "https://the5ers.com",
    highlight: "Low Risk"
  },
  {
    name: "Funded Next",
    logoUrl: "https://fundednext.com/wp-content/uploads/2022/06/cropped-FN-Favicon-192x192.png",
    logoFallback: "FN",
    startingPrice: 32,
    url: "https://fundednext.com",
    highlight: "Best Value"
  },
  {
    name: "FTMO",
    logoUrl: "https://ftmo.com/wp-content/uploads/2020/02/cropped-ftmo-fav-192x192.png",
    logoFallback: "FT",
    startingPrice: 155,
    url: "https://ftmo.com",
    highlight: "Top Rated"
  },
  {
    name: "Alpha Capital",
    logoUrl: "https://alphacapitalgroup.uk/wp-content/uploads/2023/05/cropped-LOGO-FAV-ICON-192x192.png",
    logoFallback: "AC",
    startingPrice: 47,
    url: "https://alphacapitalgroup.uk"
  }
]

const COUPON_CODE = "projournx"
const DISCOUNT = 15

function PropFirmCard({ firm }: { firm: PropFirm }) {
  const [imgError, setImgError] = useState(false)
  
  return (
    <div className={cn(
      "relative flex items-center gap-3 p-3 rounded-xl",
      "bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10",
      "hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.08]",
      "transition-all group"
    )}>
      {firm.highlight && (
        <div className="absolute -top-2 right-3 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
          {firm.highlight}
        </div>
      )}
      
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
        {!imgError ? (
          <Image
            src={firm.logoUrl}
            alt={`${firm.name} logo`}
            width={32}
            height={32}
            className="object-contain"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span className="text-xs font-bold text-gray-600 dark:text-white/70">
            {firm.logoFallback}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {firm.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-white/50">
          From <span className="text-emerald-600 dark:text-emerald-400 font-bold">${firm.startingPrice}</span>
        </p>
      </div>
      
      <a
        href={firm.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5",
          "bg-blue-500 hover:bg-blue-600 text-white",
          "rounded-lg text-xs font-semibold",
          "transition-all hover:scale-105 shadow-sm shadow-blue-500/20",
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
      "bg-white dark:bg-[#141414]",
      "border-gray-200 dark:border-white/10",
      "p-4"
    )}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4wMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-gray-600 dark:text-white/70" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Prop Firms We Suggest</h3>
            <p className="text-[10px] text-gray-500 dark:text-white/40">Top rated & trusted</p>
          </div>
        </div>

        <div className={cn(
          "mb-4 p-3 rounded-xl",
          "bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-blue-500/15 dark:to-blue-600/5",
          "border border-blue-500/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {DISCOUNT}% OFF with our code!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wider">
              {COUPON_CODE.toUpperCase()}
            </code>
            <button
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-lg border transition-all",
                copied 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white"
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
