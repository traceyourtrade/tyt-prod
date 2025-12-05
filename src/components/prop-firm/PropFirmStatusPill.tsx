"use client"

import { cn } from "@/lib/utils"
import { CheckCircle, AlertTriangle, XCircle, Trophy } from "lucide-react"

interface PropFirmStatusPillProps {
  status: "active" | "at_risk" | "breached" | "completed"
  className?: string
}

export default function PropFirmStatusPill({ status, className }: PropFirmStatusPillProps) {
  const config = {
    active: {
      label: "Challenge Active",
      icon: CheckCircle,
      bg: "bg-profit/10",
      border: "border-profit/20",
      text: "text-profit",
    },
    at_risk: {
      label: "At Risk",
      icon: AlertTriangle,
      bg: "bg-warning/10",
      border: "border-warning/20",
      text: "text-warning",
    },
    breached: {
      label: "Challenge Breached",
      icon: XCircle,
      bg: "bg-loss/10",
      border: "border-loss/20",
      text: "text-loss",
    },
    completed: {
      label: "Challenge Completed",
      icon: Trophy,
      bg: "bg-profit/10",
      border: "border-profit/20",
      text: "text-profit",
    },
  }

  const { label, icon: Icon, bg, border, text } = config[status]

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border",
      bg,
      border,
      className
    )}>
      <Icon className={cn("w-4 h-4", text)} />
      <span className={cn("text-sm font-medium", text)}>{label}</span>
    </div>
  )
}
