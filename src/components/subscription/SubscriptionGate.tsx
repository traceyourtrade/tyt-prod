"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion } from "framer-motion";
import { Crown, Lock, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none';
}

interface SubscriptionGateProps {
  children: ReactNode;
  featureName: string;
  featureDescription?: string;
}

export default function SubscriptionGate({ 
  children, 
  featureName,
  featureDescription = "Upgrade to Pro to unlock this premium feature"
}: SubscriptionGateProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscriptionStatus?.hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-center">
            <Lock className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          {featureName} is a Pro Feature
        </h2>
        
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          {featureDescription}
        </p>

        <div className="space-y-4">
          <Link href="/checkout">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Crown className="h-5 w-5" />
              Upgrade to Pro
            </motion.button>
          </Link>

          <Link 
            href="/dashboard"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-10 p-4 rounded-xl bg-card/50 border border-border/50">
          <p className="text-sm text-muted-foreground mb-3">Pro includes:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-left">
            {[
              "AI Trade Analysis",
              "Backtesting Module",
              "Strategy Reports",
              "Playbook Builder",
              "Prop Firm Mode",
              "Priority Support"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
