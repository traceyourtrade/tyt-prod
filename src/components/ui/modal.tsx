"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div 
        className={cn(
          "fixed left-[50%] top-[50%] z-[60] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-card border border-border rounded-xl shadow-lg animate-slide-in-up",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

export function ModalHeader({ children, className, onClose }: ModalHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between p-6 pb-0", className)}>
      <div className="flex flex-col space-y-1.5">
        {children}
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -mt-1 -mr-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export function ModalTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  )
}

export function ModalDescription({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1.5", className)}>
      {children}
    </p>
  )
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  )
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0", className)}>
      {children}
    </div>
  )
}
