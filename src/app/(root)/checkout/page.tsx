"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Crown, 
  Check, 
  Loader2, 
  ArrowLeft, 
  Shield, 
  Zap, 
  BarChart3, 
  Brain,
  TrendingUp,
  Lock,
  Sparkles,
  Star,
  Target,
  LineChart
} from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none';
  email?: string;
}

const features = [
  { 
    icon: BarChart3, 
    title: "Advanced Analytics", 
    description: "Deep insights into your trading patterns",
    gradient: "from-blue-500 to-cyan-400"
  },
  { 
    icon: Brain, 
    title: "AI Trade Analysis", 
    description: "Smart pattern recognition & suggestions",
    gradient: "from-purple-500 to-pink-400"
  },
  { 
    icon: Target, 
    title: "Prop Firm Mode", 
    description: "Track challenge progress & drawdown",
    gradient: "from-amber-500 to-orange-400"
  },
  { 
    icon: LineChart, 
    title: "Performance Reports", 
    description: "Detailed metrics & equity curves",
    gradient: "from-emerald-500 to-teal-400"
  },
  { 
    icon: Zap, 
    title: "Unlimited Trades", 
    description: "Log all your trades without limits",
    gradient: "from-yellow-500 to-amber-400"
  },
  { 
    icon: Sparkles, 
    title: "Playbook Builder", 
    description: "Create your winning strategy playbook",
    gradient: "from-rose-500 to-pink-400"
  },
];

const trustBadges = [
  { icon: Shield, text: "Secure Payment" },
  { icon: Lock, text: "256-bit Encryption" },
  { icon: Star, text: "Cancel Anytime" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
          if (data.isSubscribed) {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
        router.push("/login");
      } finally {
        setCheckingStatus(false);
      }
    };
    fetchStatus();
  }, [router]);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    if (!window.Razorpay) {
      setError("Payment system is loading. Please try again in a moment.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "ProJournX",
        description: "Pro Subscription - Monthly",
        handler: function (response: any) {
          router.push("/dashboard?payment=success");
        },
        prefill: {
          email: subscriptionStatus?.email || "",
        },
        theme: {
          color: "#10B981",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed. Please try again.");
        setLoading(false);
      });
      razorpay.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (subscriptionStatus?.isSubscribed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
          </motion.div>

          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25"
            >
              <Crown className="h-10 w-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              Upgrade to <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Pro</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto"
            >
              Join thousands of traders who use ProJournX to improve their trading performance
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="group relative rounded-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm" />
                    <div className="absolute inset-0 border border-border/50 rounded-xl" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.02] to-transparent" />
                    
                    <div className="relative p-5 flex items-start gap-4">
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:sticky lg:top-8"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
                <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-2xl" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />
                
                <div className="relative p-6 md:p-8">
                  {subscriptionStatus?.isOnTrial && (
                    <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-amber-400 text-sm text-center font-medium">
                        Trial ends in {subscriptionStatus.trialDaysLeft} days
                      </p>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <p className="text-sm text-muted-foreground mb-2">Monthly Subscription</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">₹849</span>
                      <span className="text-muted-foreground text-lg">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Billed monthly. Cancel anytime.</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {["Full access to all features", "AI-powered trade insights", "Priority support", "Regular updates"].map(
                      (item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="h-3 w-3 text-emerald-400" />
                          </div>
                          <span className="text-sm text-foreground">{item}</span>
                        </div>
                      )
                    )}
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </div>
                  )}

                  <motion.button
                    onClick={handlePayment}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-5 w-5" />
                        Start Pro Subscription
                      </>
                    )}
                  </motion.button>

                  <div className="mt-6 flex items-center justify-center gap-4">
                    {trustBadges.map((badge, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-muted-foreground">
                        <badge.icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{badge.text}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-center text-muted-foreground mt-6">
                    By subscribing, you agree to our{" "}
                    <Link href="/terms" className="text-emerald-400 hover:underline">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 p-4 rounded-xl bg-card/50 border border-border/50 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  Powered by <span className="font-medium text-foreground">Razorpay</span>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
