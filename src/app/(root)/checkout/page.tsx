"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  ArrowLeft, 
  Shield, 
  Zap, 
  Brain,
  Lock,
  Sparkles,
  LineChart,
  Clock,
  Tag,
  X,
  ArrowRight,
  ChevronDown,
  Infinity,
  Rocket,
  Check,
  Target
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
  status: 'subscribed' | 'trial' | 'expired' | 'none' | 'inactive';
  email?: string;
  billingPeriod?: 'monthly' | 'yearly';
}

interface CouponData {
  valid: boolean;
  code: string;
  offerId: string | null;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  description: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  
  const planParam = searchParams.get('plan');
  const upgradeParam = searchParams.get('upgrade');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    planParam === 'monthly' ? 'monthly' : 'yearly'
  );
  
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  
  const monthlyPrice = 849;
  const yearlyPrice = 8199;
  const yearlyMonthlyPrice = Math.round(yearlyPrice / 12);
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice;

  const getCurrentPrice = () => {
    if (appliedCoupon) return appliedCoupon.finalPrice;
    return billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  };

  const getOriginalPrice = () => {
    return billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.status === 401) { router.push("/login"); return; }
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
          if (data.isSubscribed) {
            if (upgradeParam === 'true' && data.billingPeriod !== 'yearly') {
              setIsUpgrade(true);
            } else {
              router.push("/dashboard");
            }
          }
        }
      } catch (err) {
        router.push("/login");
      } finally {
        setCheckingStatus(false);
      }
    };
    fetchStatus();
  }, [router, upgradeParam]);

  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);
    }
  }, [billingPeriod]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError("Enter a coupon code"); return; }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await fetch("/api/razorpay/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: couponCode.trim(), billingPeriod }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCouponError(data.error || "Invalid coupon");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError(null);
      }
    } catch (err) {
      setCouponError("Failed to validate");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    if (!window.Razorpay) {
      setError("Payment loading. Try again.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingPeriod, couponCode: appliedCoupon?.code || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create subscription");
      
      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "ProJournX",
        description: billingPeriod === 'yearly' ? "Pro Yearly" : "Pro Monthly",
        handler: () => router.push("/dashboard?payment=success"),
        prefill: { email: subscriptionStatus?.email || "" },
        theme: { color: "#10B981" },
        modal: { ondismiss: () => setLoading(false) },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (res: any) => {
        setError(res.error.description || "Payment failed");
        setLoading(false);
      });
      razorpay.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (subscriptionStatus?.isSubscribed && !isUpgrade) return null;

  const displayPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-teal-500/8 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-tl from-blue-500/10 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {subscriptionStatus?.hasAccess ? (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">ProJournX</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Lock className="w-3 h-3" />
            <span>Secure</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">15,000+ traders trust us</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Unlock <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Pro</span> Trading Tools
            </h1>
            <p className="text-sm text-slate-400">AI insights, prop firm tracking & advanced analytics</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-lg opacity-60" />
            
            <div className="relative p-5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10">
              {/* Trial Warning */}
              {subscriptionStatus?.isOnTrial && (
                <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <p className="text-xs font-medium text-amber-400">Trial ends in {subscriptionStatus.trialDaysLeft} days</p>
                </div>
              )}

              {/* Plan Toggle */}
              <div className="p-1 rounded-xl bg-slate-800/60 border border-white/5 mb-4">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      billingPeriod === 'yearly'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Yearly
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      billingPeriod === 'yearly' ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>-20%</span>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingPeriod + (appliedCoupon?.code || '')}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {appliedCoupon ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-lg text-slate-500 line-through">₹{Math.round(getOriginalPrice())}</span>
                          <span className="text-3xl font-bold text-emerald-400">₹{Math.round(getCurrentPrice())}</span>
                        </div>
                        <p className="text-xs font-medium text-emerald-400">You save ₹{Math.round(appliedCoupon.discountAmount)}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-0.5">
                          <span className="text-3xl font-bold text-white">₹{displayPrice}</span>
                          <span className="text-slate-500">/mo</span>
                        </div>
                        {billingPeriod === 'yearly' && (
                          <p className="text-xs text-slate-400 mt-1">
                            ₹{yearlyPrice}/yr <span className="text-emerald-400">• Save ₹{yearlySavings}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: Infinity, text: "Unlimited trades" },
                  { icon: Brain, text: "AI insights" },
                  { icon: Target, text: "Prop firm tracking" },
                  { icon: LineChart, text: "Advanced analytics" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-xs text-slate-300">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">{appliedCoupon.code}</span>
                    </div>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="p-1 hover:bg-emerald-500/20 rounded transition-colors">
                      <X className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => setShowCoupon(!showCoupon)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Have a coupon?</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showCoupon && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Enter code"
                              className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/5 text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                            <button
                              onClick={handleApplyCoupon}
                              disabled={couponLoading}
                              className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                              {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                            </button>
                          </div>
                          {couponError && <p className="text-xs text-red-400 mt-1.5">{couponError}</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 text-center">{error}</p>
                </div>
              )}

              {/* CTA */}
              <motion.button
                onClick={handlePayment}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Start Pro — ₹{displayPrice}/mo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Trust */}
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>30-day money back</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
