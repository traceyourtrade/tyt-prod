"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Crown, Check, Sparkles, ArrowUp, Loader2, Calendar, CreditCard, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none';
  subscriptionExpiry?: string;
  billingPeriod?: 'monthly' | 'yearly';
}

const Subscription = () => {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const monthlyPrice = 849;
  const yearlyPrice = 8199;
  const yearlyMonthlyPrice = Math.round(yearlyPrice / 12);
  
  const features = [
    "Unlimited trades",
    "Advanced analytics", 
    "AI-powered insights",
    "Playbook builder",
    "Prop firm mode",
    "Priority support"
  ];

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

  const handleSubscribe = () => {
    router.push(`/checkout?plan=${billing}`);
  };

  const handleUpgradeToYearly = () => {
    router.push('/checkout?plan=yearly&upgrade=true');
  };

  const getStatusInfo = () => {
    if (!subscriptionStatus) return { label: 'Free', color: 'gray', bg: 'bg-muted' };
    
    switch (subscriptionStatus.status) {
      case 'subscribed':
        return { label: 'Active', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-500' };
      case 'trial':
        return { label: `${subscriptionStatus.trialDaysLeft} days left`, color: 'blue', bg: 'bg-blue-500/10 text-blue-500' };
      case 'expired':
        return { label: 'Expired', color: 'red', bg: 'bg-red-500/10 text-red-500' };
      default:
        return { label: 'Free', color: 'gray', bg: 'bg-muted text-muted-foreground' };
    }
  };

  const getPlanName = () => {
    if (!subscriptionStatus) return "Free";
    
    switch (subscriptionStatus.status) {
      case 'subscribed':
        return subscriptionStatus.billingPeriod === 'yearly' ? 'Pro Yearly' : 'Pro Monthly';
      case 'trial':
        return 'Pro Trial';
      default:
        return 'Free';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-5 bg-muted rounded animate-pulse" />
            <div className="w-48 h-4 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;
  const isMonthlySubscriber = isSubscribed && subscriptionStatus?.billingPeriod !== 'yearly';
  const statusInfo = getStatusInfo();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-amber-500/20 to-amber-500/5"
        )}>
          <Crown className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Subscription</h2>
          <p className="text-sm text-muted-foreground">Manage your plan and billing</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-card dark:bg-zinc-900/50",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <div className={cn(
          "h-1.5",
          subscriptionStatus?.hasAccess 
            ? "bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500" 
            : "bg-muted"
        )} />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                subscriptionStatus?.hasAccess 
                  ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5" 
                  : "bg-muted"
              )}>
                <Crown className={cn(
                  "w-6 h-6",
                  subscriptionStatus?.hasAccess ? "text-amber-500" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">{getPlanName()}</p>
                <p className="text-sm text-muted-foreground">Current Plan</p>
              </div>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              statusInfo.bg
            )}>
              {statusInfo.label}
            </span>
          </div>

          {subscriptionStatus?.subscriptionExpiry && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {subscriptionStatus.status === 'subscribed' ? 'Renews on' : 'Expires on'}
                </span>
                <span className="font-medium text-foreground">
                  {formatDate(subscriptionStatus.subscriptionExpiry)}
                </span>
              </div>
            </div>
          )}

          {isMonthlySubscriber && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-emerald-500">Save 20% with Yearly</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to yearly billing and pay ₹8,199/year instead of ₹10,188/year
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgradeToYearly}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2",
                  "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                )}
              >
                <ArrowUp className="w-4 h-4" />
                Upgrade to Yearly
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {!isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center p-1 bg-muted rounded-xl">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-6 py-2 text-sm font-medium rounded-lg transition-all",
                  billing === "monthly" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={cn(
                  "px-6 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                  billing === "yearly" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded">
                  -20%
                </span>
              </button>
            </div>
          </div>

          <motion.div 
            className={cn(
              "relative rounded-2xl border overflow-hidden",
              "bg-card dark:bg-zinc-900/50",
              "border-primary/50"
            )}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-emerald-500" />
            
            <div className="absolute -top-px left-6 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-b-lg flex items-center gap-1">
              <Star className="w-3 h-3" /> Most Popular
            </div>

            <div className="p-6 pt-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-primary">Pro Plan</h3>
                  <p className="text-muted-foreground text-sm mt-1">Everything you need to trade better</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      ₹{billing === "monthly" ? monthlyPrice : yearlyMonthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  {billing === "yearly" && (
                    <>
                      <p className="text-sm text-muted-foreground line-through">₹{monthlyPrice}/mo</p>
                      <p className="text-xs text-emerald-500 font-medium">Billed ₹{yearlyPrice}/year</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubscribe}
                className={cn(
                  "w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  "bg-primary text-white hover:bg-primary/90"
                )}
              >
                <CreditCard className="w-4 h-4" />
                {subscriptionStatus?.status === 'trial' ? 'Upgrade Now' : 'Get Started'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Subscription;
