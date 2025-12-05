"use client"

import React from 'react'
import { ChevronDown } from 'lucide-react'

interface FormValues {
  symbol: string
  startDate: string
  endDate: string
  tradeType: string
  tradePL: string
}

interface EnteredValues {
  group1: FormValues
  group2: FormValues
}

interface TradeGroupFormProps {
  title: string
  values: EnteredValues
  updateValues: (group: keyof EnteredValues, field: keyof FormValues, value: string) => void
  group: keyof EnteredValues
}

const TradeGroupForm: React.FC<TradeGroupFormProps> = ({ title, values, updateValues, group }) => {
  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
  const selectClass = "w-full px-3 py-2.5 pr-10 border border-border rounded-lg text-sm bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
  const labelClass = "text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block"

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      {/* Form Fields */}
      <div className="p-4 space-y-4">
        {/* Symbol */}
        <div>
          <label className={labelClass}>Symbol</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Enter Symbol (e.g., EURUSD)"
            value={values[group].symbol}
            onChange={e => updateValues(group, "symbol", e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className={labelClass}>Tags</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Enter tags..."
          />
        </div>

        {/* Side */}
        <div>
          <label className={labelClass}>Side</label>
          <div className="relative">
            <select
              className={selectClass}
              value={values[group].tradeType}
              onChange={e => updateValues(group, "tradeType", e.target.value)}
            >
              <option value="buy">Long</option>
              <option value="sell">Short</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="text"
              className={inputClass}
              placeholder="DD-MM-YYYY"
              value={values[group].startDate}
              onChange={e => updateValues(group, "startDate", e.target.value)}
            />
          </div>

          {/* End Date */}
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="text"
              className={inputClass}
              placeholder="DD-MM-YYYY"
              value={values[group].endDate}
              onChange={e => updateValues(group, "endDate", e.target.value)}
            />
          </div>
        </div>

        {/* Trade P&L */}
        <div>
          <label className={labelClass}>Trade P&L</label>
          <div className="relative">
            <select
              className={selectClass}
              value={values[group].tradePL}
              onChange={e => updateValues(group, "tradePL", e.target.value)}
            >
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradeGroupForm
