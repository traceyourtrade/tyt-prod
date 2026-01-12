"use client";

import { useState, useEffect, Suspense } from "react";
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
  Tag,
  X,
  ArrowRight,
  ChevronDown,
  Infinity,
  Check,
  Target,
  TrendingUp,
  Gift,
  Star,
  LogOut,
  RefreshCw,
  BarChart3,
  Clock,
  Layers,
  CheckCircle2
} from "lucide-react";
import Cookies from "js-cookie";
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

function CheckoutPageContent() {
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
  
  const monthlyOriginalPrice = 1799;
  const monthlyPrice = 849;
  const yearlyPrice = 8199;
  const yearlyMonthlyPrice = Math.round(yearlyPrice / 12);
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice;
  const monthlyDiscount = monthlyOriginalPrice - monthlyPrice;

  const getCurrentPrice = () => {
    if (appliedCoupon) return appliedCoupon.finalPrice;
    return billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  };

  const getOriginalPrice = () => {
    return billingPeriod === 'yearly' ? yearlyPrice : monthlyPrice;
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      Cookies.remove("ProJournX", { domain: ".projournx.com", path: "/" });
      Cookies.remove("ProJournX", { path: "/" });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-zinc-500 text-sm font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (subscriptionStatus?.isSubscribed && !isUpgrade) return null;

  const displayPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  const coreFeatures = [
    {
      icon: RefreshCw,
      title: "Auto Sync",
      description: "Connect your broker and sync trades automatically",
      highlight: true
    },
    {
      icon: Brain,
      title: "AI Pattern Detection",
      description: "Discover winning patterns in your trading"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into your performance metrics"
    },
    {
      icon: Target,
      title: "Prop Firm Tracker",
      description: "Track challenges and funded accounts"
    },
    {
      icon: Clock,
      title: "Bar Replay",
      description: "Backtest strategies with historical data"
    },
    {
      icon: Layers,
      title: "Unlimited Journals",
      description: "Log every trade with detailed notes"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/3 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {subscriptionStatus?.hasAccess ? (
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg">ProJournX</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
              <Shield className="w-4 h-4" />
              <span>Secure Checkout</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-6 lg:py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">Upgrade to Pro</span>
              </motion.div>
              
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight">
                Trade Smarter with{' '}
                <span className="text-emerald-400">Auto Sync</span>
              </h1>
              
              <p className="text-sm text-zinc-400 max-w-sm">
                Connect your broker once, and let ProJournX automatically track and analyze every trade you make.
              </p>
            </div>

            <div className="grid gap-2">
              {coreFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    feature.highlight 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    feature.highlight 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/5 text-zinc-400'
                  }`}>
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-sm font-medium ${feature.highlight ? 'text-emerald-400' : 'text-white'}`}>
                      {feature.title}
                    </h3>
                    <p className="text-xs text-zinc-500 truncate">{feature.description}</p>
                  </div>
                  {feature.highlight && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase flex-shrink-0">
                      Popular
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-8"
          >
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">ProJournX Pro</h2>
                    <p className="text-xs text-zinc-500">Everything you need to level up</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBillingPeriod('yearly')}
                    className={`relative p-3 rounded-xl text-left transition-all ${
                      billingPeriod === 'yearly'
                        ? 'bg-emerald-500/10 border-2 border-emerald-500'
                        : 'bg-white/5 border-2 border-transparent hover:border-white/10'
                    }`}
                  >
                    {billingPeriod === 'yearly' && (
                      <div className="absolute -top-2 left-3 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                        SAVE ₹{yearlySavings}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-500 mb-0.5">Yearly</div>
                    <div className="text-xl font-bold">₹{yearlyMonthlyPrice}<span className="text-xs font-normal text-zinc-500">/mo</span></div>
                    <div className="text-[10px] text-zinc-500">Billed annually</div>
                  </button>
                  
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`relative p-3 rounded-xl text-left transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-emerald-500/10 border-2 border-emerald-500'
                        : 'bg-white/5 border-2 border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="absolute -top-2 left-3 px-1.5 py-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-black">
                      MOST POPULAR
                    </div>
                    <div className="text-[10px] text-zinc-500 mb-0.5">Monthly</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-zinc-500 line-through">₹{monthlyOriginalPrice}</span>
                      <span className="text-xl font-bold">₹{monthlyPrice}</span>
                      <span className="text-xs font-normal text-zinc-500">/mo</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">Billed monthly</div>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  {[
                    "Automatic broker sync",
                    "AI-powered trade analysis",
                    "Unlimited trade entries",
                    "Bar replay backtesting",
                    "Prop firm challenge tracker",
                    "Advanced performance reports"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-400">Total</span>
                    <div className="text-right">
                      {appliedCoupon ? (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 line-through text-sm">₹{getOriginalPrice()}</span>
                          <span className="text-xl font-bold">₹{getCurrentPrice()}</span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold">₹{getCurrentPrice()}</span>
                      )}
                      <p className="text-[10px] text-zinc-500">
                        {billingPeriod === 'yearly' ? 'billed annually' : 'billed monthly'}
                      </p>
                    </div>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">{appliedCoupon.code}</span>
                        <span className="text-xs text-emerald-300">-₹{appliedCoupon.discountAmount}</span>
                      </div>
                      <button 
                        onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <button 
                        onClick={() => setShowCoupon(!showCoupon)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
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
                                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                              />
                              <button
                                onClick={handleApplyCoupon}
                                disabled={couponLoading}
                                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                              >
                                {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                              </button>
                            </div>
                            {couponError && <p className="text-[10px] text-red-400 mt-1.5">{couponError}</p>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {error && (
                    <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 text-center">{error}</p>
                    </div>
                  )}

                  <motion.button
                    onClick={handlePayment}
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Pro — ₹{displayPrice}/mo</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>SSL Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Razorpay Protected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Cancel Anytime</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  RK
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">Rahul K.</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    "The auto sync feature is a game changer. Helped me pass my FTMO challenge."
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium mt-1">+₹4.2L profit in 3 months</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="text-zinc-500 text-sm font-medium">Loading...</p>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
