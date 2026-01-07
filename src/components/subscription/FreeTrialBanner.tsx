"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Clock, ArrowRight } from "lucide-react";

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  canStartTrial: boolean;
  status: string;
}

export function FreeTrialBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/subscription/status", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setActivating(true);
    try {
      const response = await fetch("/api/subscription/start-trial", {
        method: "POST",
        cache: "no-store",
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        // Hide the banner immediately
        setHidden(true);
        // Refresh the router to update other components
        router.refresh();
      } else {
        const error = await response.json();
        console.error("Failed to start trial:", error);
        alert("Failed to start trial. Please try again.");
      }
    } catch (error) {
      console.error("Failed to start trial:", error);
      alert("Failed to start trial. Please try again.");
    } finally {
      setActivating(false);
    }
  };

  if (loading || dismissed || hidden) return null;
  
  if (!status?.canStartTrial) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mb-6 overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="absolute inset-0 border border-emerald-500/30 rounded-2xl" />
        
        <div className="relative px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Start Your Free Trial
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  3 DAYS FREE
                </span>
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Unlock all premium features including AI Analysis, Backtesting, and more
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleStartTrial}
              disabled={activating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {activating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
            
            <button
              onClick={() => setDismissed(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FreeTrialBanner;
