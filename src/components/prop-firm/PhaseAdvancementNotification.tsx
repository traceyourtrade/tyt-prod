"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import usePropFirmStore from "@/store/propFirmStore";

export default function PhaseAdvancementNotification() {
  const { phaseAdvancementNotification, clearPhaseAdvancementNotification, isEnabled } = usePropFirmStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (phaseAdvancementNotification && isEnabled) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(clearPhaseAdvancementNotification, 500);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [phaseAdvancementNotification, isEnabled, clearPhaseAdvancementNotification]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(clearPhaseAdvancementNotification, 500);
  };

  if (!phaseAdvancementNotification || !isEnabled) return null;

  const isFunded = phaseAdvancementNotification.toPhase.toLowerCase().includes("funded");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[90%]"
        >
          <div className={cn(
            "relative overflow-hidden rounded-2xl border shadow-2xl",
            isFunded 
              ? "bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/5 border-amber-500/50"
              : "bg-gradient-to-br from-profit/20 via-emerald-500/10 to-teal-500/5 border-profit/50"
          )}>
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl",
                  isFunded ? "bg-amber-500/30" : "bg-profit/30"
                )}
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className={cn(
                  "absolute -bottom-10 -left-10 w-24 h-24 rounded-full blur-2xl",
                  isFunded ? "bg-yellow-500/30" : "bg-emerald-500/30"
                )}
              />
            </div>

            <div className="relative p-4">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                    isFunded 
                      ? "bg-gradient-to-br from-amber-500 to-yellow-500"
                      : "bg-gradient-to-br from-profit to-emerald-500"
                  )}
                >
                  {isFunded ? (
                    <Trophy className="w-7 h-7 text-white" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-white" />
                  )}
                </motion.div>

                <div className="flex-1 min-w-0 pr-4">
                  <motion.h3
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "text-lg font-bold",
                      isFunded ? "text-amber-500" : "text-profit"
                    )}
                  >
                    {isFunded ? "Congratulations! You're Funded!" : "Phase Passed!"}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-foreground font-medium mt-1"
                  >
                    {phaseAdvancementNotification.challengeName}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2 mt-2"
                  >
                    <span className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground font-medium">
                      {phaseAdvancementNotification.fromPhase}
                    </span>
                    <ArrowRight className={cn(
                      "w-4 h-4",
                      isFunded ? "text-amber-500" : "text-profit"
                    )} />
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-md font-semibold",
                      isFunded 
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-profit/20 text-profit"
                    )}>
                      {phaseAdvancementNotification.toPhase}
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: "linear" }}
              className={cn(
                "h-1 origin-left",
                isFunded 
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                  : "bg-gradient-to-r from-profit to-emerald-500"
              )}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
