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
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  Flame,
  Gift,
  Star,
  Timer
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
  const [liveViewers, setLiveViewers] = useState(23);
  const [joinedToday] = useState(15);
  
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
  const monthlyOriginal = 1299;

  const getCurrentPrice = () => {
    if (appliedCoupon) return appliedCoupon.finalPrice;
    return billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  };

  const getOriginalPrice = () => {
    return billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(18, Math.min(35, prev + change));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
          <p className="text-zinc-400 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (subscriptionStatus?.isSubscribed && !isUpgrade) return null;

  const displayPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col overflow-x-hidden">
      {/* Animated Background with warm urgency colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-orange-600/20 via-red-500/10 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-tl from-amber-500/15 via-orange-500/10 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-gradient-to-r from-emerald-500/10 to-transparent blur-3xl" />
      </div>

      {/* Urgency Banner */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-20 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 py-2 px-4"
      >
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3 text-sm font-medium">
          <Flame className="w-4 h-4 animate-pulse" />
          <span>Limited Time: Save ₹{yearlySavings} on yearly plan</span>
          <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold">ENDS SOON</span>
        </div>
      </motion.div>

      {/* Header */}
      <header className="relative z-10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {subscriptionStatus?.hasAccess ? (
            <Link href="/dashboard" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm">
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
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
            <Lock className="w-3 h-3" />
            <span>Secure</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-lg">
          {/* Live Activity Indicators - FOMO */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">{liveViewers} viewing now</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">{joinedToday} joined today</span>
            </div>
          </motion.div>

          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-3">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-amber-400">500+ traders already winning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Stop Losing Money.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Start Winning.</span>
            </h1>
            <p className="text-sm text-zinc-400">Join traders who increased their win rate by 24% on average</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-red-500/20 to-amber-500/30 rounded-2xl blur-xl opacity-60" />
            
            <div className="relative p-5 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800">
              {/* Popular Badge */}
              {billingPeriod === 'yearly' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-bold text-black shadow-lg shadow-orange-500/30">
                    MOST POPULAR - BEST VALUE
                  </div>
                </div>
              )}

              {/* Trial Warning */}
              {subscriptionStatus?.isOnTrial && (
                <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-xs font-medium text-red-400">Trial ends in {subscriptionStatus.trialDaysLeft} days - Don't lose access!</p>
                </div>
              )}

              {/* Plan Toggle */}
              <div className="p-1 rounded-xl bg-zinc-800/80 border border-zinc-700/50 mb-4 mt-2">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-zinc-700 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      billingPeriod === 'yearly'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-orange-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Yearly
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      billingPeriod === 'yearly' ? 'bg-black/20 text-black' : 'bg-red-500/20 text-red-400'
                    }`}>SAVE 35%</span>
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
                          <span className="text-lg text-zinc-500 line-through">₹{Math.round(getOriginalPrice())}</span>
                          <span className="text-4xl font-bold text-emerald-400">₹{Math.round(getCurrentPrice())}</span>
                        </div>
                        <p className="text-xs font-medium text-emerald-400">You save ₹{Math.round(appliedCoupon.discountAmount)}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-lg text-zinc-500 line-through">₹{billingPeriod === 'yearly' ? monthlyOriginal : monthlyOriginal}</span>
                          <span className="text-4xl font-bold text-white">₹{displayPrice}</span>
                          <span className="text-zinc-500">/mo</span>
                        </div>
                        {billingPeriod === 'yearly' ? (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs text-zinc-400">
                              ₹{yearlyPrice}/yr billed annually
                            </p>
                            <p className="text-xs font-semibold text-amber-400">
                              You save ₹{yearlySavings} per year!
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 mt-1">Switch to yearly & save ₹{yearlySavings}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* What You Get - with value emphasis */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Everything you need to profit:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Rocket, text: "Bar replay backtesting", value: "₹600/mo value" },
                    { icon: Brain, text: "AI win patterns", value: "₹300/mo value" },
                    { icon: Target, text: "Prop firm tracking", value: "₹400/mo value" },
                    { icon: Infinity, text: "Unlimited trades", value: "₹200/mo value" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-white font-medium block truncate">{item.text}</span>
                        <span className="text-[10px] text-emerald-400/70">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Reversal */}
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">30-Day Money-Back Guarantee</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Not seeing results? Full refund, no questions asked.</p>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <Gift className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">{appliedCoupon.code} applied!</span>
                    </div>
                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="p-1 hover:bg-emerald-500/20 rounded transition-colors">
                      <X className="h-3.5 w-3.5 text-emerald-400" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => setShowCoupon(!showCoupon)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition-colors"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Have a coupon code?</span>
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
                              className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                            <button
                              onClick={handleApplyCoupon}
                              disabled={couponLoading}
                              className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
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
                <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-400 text-center">{error}</p>
                </div>
              )}

              {/* CTA - High contrast, urgency */}
              <motion.button
                onClick={handlePayment}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Unlock Pro Now — ₹{displayPrice}/mo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              {/* Scarcity + Social Proof */}
              <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-zinc-500">
                <Users className="w-3 h-3" />
                <span>{3 + Math.floor(Math.random() * 3)} people purchased in the last hour</span>
              </div>

              {/* Trust Badges */}
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Razorpay Protected</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                RK
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">Rahul K.</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 italic">"Passed my FTMO challenge on the first try. The AI patterns showed me exactly when I was overtrading. Best investment I made."</p>
                <p className="text-[10px] text-emerald-400 font-medium mt-1">+₹4.2L profit in 3 months</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
