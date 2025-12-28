"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Check, ChevronDown, ExternalLink, 
  Target, TrendingDown, Clock, AlertTriangle,
  Percent, Calendar, DollarSign, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { propFirmPresets, PropFirmPreset } from "@/lib/prop-firm-presets"
import usePropFirmStore from "@/store/propFirmStore"

interface PropFirmPresetSelectorProps {
  onSelect?: () => void
}

export default function PropFirmPresetSelector({ onSelect }: PropFirmPresetSelectorProps) {
  const { selectedPresetId, selectPreset } = usePropFirmStore()
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<Record<string, number>>({})

  const handleSelect = (preset: PropFirmPreset) => {
    const size = selectedSize[preset.id] || preset.defaultAccountSize
    selectPreset(preset.id, size)
    onSelect?.()
  }

  const popularPresets = propFirmPresets.filter(p => ["ftmo", "the-funded-trader", "the5ers", "funded-next"].includes(p.id))
  const otherPresets = propFirmPresets.filter(p => !["ftmo", "the-funded-trader", "the5ers", "funded-next"].includes(p.id))

  return (
    <div className="space-y-6">
      {/* Popular Prop Firms */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Popular Prop Firms</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetId === preset.id}
              isExpanded={expandedPreset === preset.id}
              selectedSize={selectedSize[preset.id] || preset.defaultAccountSize}
              onExpand={() => setExpandedPreset(expandedPreset === preset.id ? null : preset.id)}
              onSizeChange={(size) => setSelectedSize({ ...selectedSize, [preset.id]: size })}
              onSelect={() => handleSelect(preset)}
            />
          ))}
        </div>
      </div>

      {/* Other Prop Firms */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">More Options</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {otherPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetId === preset.id}
              isExpanded={expandedPreset === preset.id}
              selectedSize={selectedSize[preset.id] || preset.defaultAccountSize}
              onExpand={() => setExpandedPreset(expandedPreset === preset.id ? null : preset.id)}
              onSizeChange={(size) => setSelectedSize({ ...selectedSize, [preset.id]: size })}
              onSelect={() => handleSelect(preset)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface PresetCardProps {
  preset: PropFirmPreset
  isSelected: boolean
  isExpanded: boolean
  selectedSize: number
  onExpand: () => void
  onSizeChange: (size: number) => void
  onSelect: () => void
}

function PresetCard({ 
  preset, 
  isSelected, 
  isExpanded, 
  selectedSize,
  onExpand, 
  onSizeChange,
  onSelect 
}: PresetCardProps) {
  const phase1 = preset.phases[0]
  
  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-xl border transition-all overflow-hidden",
        isSelected 
          ? "border-amber-500/50 bg-amber-500/5" 
          : "border-border/50 bg-card hover:border-border"
      )}
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{preset.name}</h4>
              {isSelected && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{preset.description}</p>
          </div>
          
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )} />
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium text-foreground">{phase1.profitTarget}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <span className="text-muted-foreground">Max DD:</span>
            <span className="font-medium text-foreground">{phase1.maxDrawdown}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Percent className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">Split:</span>
            <span className="font-medium text-foreground">{preset.profitSplit.initial}%</span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50"
          >
            <div className="p-4 space-y-4">
              {/* Account Size Selection */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Account Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {preset.accountSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => onSizeChange(size)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        selectedSize === size
                          ? "bg-amber-500 text-white"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      ${size.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Details */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Challenge Phases
                </label>
                <div className="space-y-2">
                  {preset.phases.map((phase, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">{phase.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-500" />
                          {phase.profitTarget}%
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-red-500" />
                          {phase.maxDrawdown}%
                        </span>
                        {phase.dailyDrawdown && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            {phase.dailyDrawdown}%/day
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Funded Phase */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Funded</span>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {preset.profitSplit.initial}% profit split
                    </span>
                  </div>
                </div>
              </div>

              {/* Features & Restrictions */}
              {(preset.features.length > 0 || preset.restrictions.length > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {preset.features.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Features</label>
                      <ul className="space-y-1">
                        {preset.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {preset.restrictions.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">Restrictions</label>
                      <ul className="space-y-1">
                        {preset.restrictions.slice(0, 3).map((restriction, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{restriction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={onSelect}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                    isSelected
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  )}
                >
                  {isSelected ? "Selected" : "Start Challenge"}
                </button>
                
                {preset.website && (
                  <a
                    href={preset.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
