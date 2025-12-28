"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Copy, Check, Sparkles, Award, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface PropFirm {
  name: string
  logoUrl: string
  logoFallback: string
  startingPrice: number
  url: string
  highlight?: string
  highlightColor?: string
}

const PROP_FIRMS: PropFirm[] = [
  {
    name: "Funding Pips",
    logoUrl: "https://fundingpips.com/wp-content/uploads/2023/03/cropped-Funding-Pips-Fav-icon-192x192.png",
    logoFallback: "FP",
    startingPrice: 59,
    url: "https://fundingpips.com",
    highlight: "Popular",
    highlightColor: "from-blue-500 to-blue-600"
  },
  {
    name: "The 5%ers",
    logoUrl: "https://the5ers.com/wp-content/uploads/2021/06/cropped-fav-192x192.png",
    logoFallback: "5%",
    startingPrice: 95,
    url: "https://the5ers.com",
    highlight: "Low Risk",
    highlightColor: "from-emerald-500 to-emerald-600"
  },
  {
    name: "Funded Next",
    logoUrl: "https://fundednext.com/wp-content/uploads/2022/06/cropped-FN-Favicon-192x192.png",
    logoFallback: "FN",
    startingPrice: 32,
    url: "https://fundednext.com",
    highlight: "Best Value",
    highlightColor: "from-violet-500 to-violet-600"
  },
  {
    name: "FTMO",
    logoUrl: "https://ftmo.com/wp-content/uploads/2020/02/cropped-ftmo-fav-192x192.png",
    logoFallback: "FT",
    startingPrice: 155,
    url: "https://ftmo.com",
    highlight: "Top Rated",
    highlightColor: "from-amber-500 to-amber-600"
  },
  {
    name: "Alpha Capital",
    logoUrl: "https://alphacapitalgroup.uk/wp-content/uploads/2023/05/cropped-LOGO-FAV-ICON-192x192.png",
    logoFallback: "AC",
    startingPrice: 47,
    url: "https://alphacapitalgroup.uk"
  }
]

const COUPON_CODE = "PROJOURNX"
const DISCOUNT = 15

function PropFirmCard({ firm }: { firm: PropFirm }) {
  const [imgError, setImgError] = useState(false)
  
  return (
    <div className="relative group">
      {firm.highlight && (
        <div className={cn(
          "absolute -top-1.5 right-2 px-2 py-0.5 text-[9px] font-bold text-white rounded-full z-10",
          "bg-gradient-to-r shadow-lg",
          firm.highlightColor || "from-blue-500 to-blue-600"
        )}>
          {firm.highlight}
        </div>
      )}
      
      <div className={cn(
        "flex items-center gap-3 p-2.5 rounded-xl",
        "bg-white/[0.03] border border-white/[0.06]",
        "hover:bg-white/[0.06] hover:border-white/[0.1]",
        "transition-all duration-200"
      )}>
        <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
          {!imgError ? (
            <Image
              src={firm.logoUrl}
              alt={`${firm.name} logo`}
              width={28}
              height={28}
              className="object-contain"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <span className="text-[10px] font-bold text-white/60">
              {firm.logoFallback}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {firm.name}
          </p>
          <p className="text-[10px] text-white/40">
            From <span className="text-emerald-400 font-bold">${firm.startingPrice}</span>
          </p>
        </div>
        
        <a
          href={firm.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5",
            "bg-gradient-to-r from-blue-500 to-blue-600",
            "hover:from-blue-600 hover:to-blue-700",
            "text-white rounded-lg text-[10px] font-semibold",
            "transition-all hover:scale-105 shadow-lg shadow-blue-500/20",
            "flex-shrink-0"
          )}
        >
          Buy
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )
}

interface PropFirmSuggestionsProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function PropFirmSuggestions({ 
  isCollapsed: controlledCollapsed, 
  onToggleCollapse 
}: PropFirmSuggestionsProps = {}) {
  const [copied, setCopied] = useState(false)
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed))

  const handleCopy = async () => {
    await navigator.clipboard.writeText(COUPON_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative flex items-start gap-1">
      <button
        onClick={toggleCollapse}
        className={cn(
          "mt-3 z-10",
          "w-5 h-10 rounded-md",
          "bg-white/[0.05] border border-white/[0.08]",
          "hover:bg-amber-500/20 hover:border-amber-500/30",
          "flex items-center justify-center",
          "transition-all duration-200"
        )}
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-3 h-3 text-white/50" />
        ) : (
          <ChevronRight className="w-3 h-3 text-white/50" />
        )}
      </button>

      <AnimatePresence initial={false} mode="wait">
        {isCollapsed ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "w-10 rounded-xl border backdrop-blur-xl overflow-hidden",
              "bg-white/[0.02]",
              "border-white/[0.06]",
              "flex flex-col items-center justify-center py-4 cursor-pointer",
              "hover:bg-white/[0.04]"
            )}
            onClick={toggleCollapse}
          >
            <Award className="w-4 h-4 text-amber-400 mb-2" />
            <span 
              className="text-[9px] font-bold text-white/60 whitespace-nowrap" 
              style={{ writingMode: 'vertical-lr' }}
            >
              Prop Firms
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={cn(
              "relative rounded-xl border backdrop-blur-xl overflow-hidden",
              "bg-white/[0.02]",
              "border-white/[0.06]",
              "p-4 w-[260px]"
            )}
          >
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Prop Firms We Suggest</h3>
                  <p className="text-[9px] text-white/40">Top rated & trusted</p>
                </div>
              </div>

              {/* Coupon Section */}
              <div className={cn(
                "mb-4 p-3 rounded-xl",
                "bg-gradient-to-r from-amber-500/10 to-amber-600/5",
                "border border-amber-500/20"
              )}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">
                    {DISCOUNT}% OFF with our code!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2.5 py-1.5 bg-black/30 border border-white/[0.08] rounded-lg text-xs font-mono font-bold text-white tracking-wider truncate">
                    {COUPON_CODE}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "p-1.5 rounded-lg border transition-all flex-shrink-0",
                      copied 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-400"
                    )}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Prop Firms List */}
              <div className="space-y-2">
                {PROP_FIRMS.map((firm) => (
                  <PropFirmCard key={firm.name} firm={firm} />
                ))}
              </div>

              {/* Disclaimer */}
              <p className="mt-3 text-[9px] text-center text-white/30">
                We may earn a commission from these links
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
