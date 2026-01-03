"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Target,
  LineChart,
  Clock,
  Users,
  Tag,
  X,
  ArrowRight,
  Star,
  ChevronDown,
  Play,
  Infinity,
  Award,
  Rocket,
  BadgeCheck
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

const outcomes = [
  { icon: TrendingUp, title: "Boost Win Rate", desc: "AI identifies your profitable patterns", stat: "+24%" },
  { icon: Brain, title: "Smarter Decisions", desc: "Data-driven trade analysis", stat: "10x" },
  { icon: Target, title: "Prop Firm Ready", desc: "Track challenges & phases", stat: "100%" },
  { icon: BarChart3, title: "Deep Insights", desc: "Advanced performance metrics", stat: "50+" },
];

const testimonials = [
  {
    name: "Rajesh M.",
    role: "Forex Trader",
    avatar: "RM",
    rating: 5,
    text: "Win rate went from 38% to 62% in 3 months. The AI insights are incredible.",
    result: "+24% win rate",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    name: "Priya S.",
    role: "Options Trader",
    avatar: "PS",
    rating: 5,
    text: "Passed FTMO on my first try thanks to the prop firm tracking.",
    result: "FTMO Funded",
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    name: "Amit K.",
    role: "Day Trader",
    avatar: "AK",
    rating: 5,
    text: "Backtesting alone saved me months of losses. Worth every rupee.",
    result: "₹2.4L saved",
    gradient: "from-purple-500 to-pink-500"
  }
];

const stats = [
  { value: "15,000+", label: "Active Traders", icon: Users },
  { value: "₹2.4Cr+", label: "P&L Tracked", icon: TrendingUp },
  { value: "4.9★", label: "User Rating", icon: Star },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
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
  const dailyPrice = Math.round(yearlyPrice / 365);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (subscriptionStatus?.isSubscribed && !isUpgrade) return null;

  const displayPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-l from-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI1MzAiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTJoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {subscriptionStatus?.hasAccess ? (
              <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">ProJournX</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </header>

        {/* Two Column Layout */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-32 lg:pb-16">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-16 items-start">
            
            {/* Left Column - Narrative */}
            <div className="space-y-10 lg:space-y-12">
              
              {/* Hero */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {subscriptionStatus?.status === 'inactive' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-emerald-400">Welcome! Choose your plan</span>
                  </div>
                )}
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  Trade smarter with{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Pro
                  </span>
                </h1>
                
                <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                  Join thousands of traders who've transformed their performance with AI-powered insights and professional tools.
                </p>
              </motion.div>

              {/* Stats Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-6 lg:gap-10"
              >
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Outcomes Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">What you'll achieve</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {outcomes.map((outcome, i) => (
                    <motion.div
                      key={outcome.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      className="group p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <outcome.icon className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm">{outcome.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{outcome.desc}</p>
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                          {outcome.stat}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Testimonials */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Trader Success Stories</h2>
                
                {/* Desktop: Grid */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                  {testimonials.map((t, i) => (
                    <motion.div
                      key={t.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.1 }}
                      className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                          {t.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white text-sm">{t.name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span className="text-xs text-slate-500">{t.role}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-3">"{t.text}"</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">{t.result}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile: Carousel */}
                <div className="lg:hidden overflow-x-auto -mx-4 px-4 scrollbar-hide">
                  <div className="flex gap-4" style={{ width: 'max-content' }}>
                    {testimonials.map((t, i) => (
                      <div
                        key={t.name}
                        className="w-72 flex-shrink-0 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                            {t.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white text-sm">{t.name}</span>
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xs text-slate-500">{t.role}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">"{t.text}"</p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">{t.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Trust Section */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/[0.06]"
              >
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Cancel Anytime</span>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Payment Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-8"
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-70 hidden lg:block" />
                
                {/* Card */}
                <div className="relative p-6 lg:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
                  {/* Trial Warning */}
                  {subscriptionStatus?.isOnTrial && (
                    <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4 text-amber-400" />
                      <p className="text-sm font-medium text-amber-400">
                        Trial ends in {subscriptionStatus.trialDaysLeft} days
                      </p>
                    </div>
                  )}

                  {/* Plan Toggle */}
                  <div className="mb-6">
                    <div className="p-1 rounded-2xl bg-slate-800/50 border border-white/[0.06]">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => setBillingPeriod('monthly')}
                          className={`relative py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                            billingPeriod === 'monthly'
                              ? 'bg-white text-slate-900 shadow-lg'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingPeriod('yearly')}
                          className={`relative py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                            billingPeriod === 'yearly'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Yearly
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            billingPeriod === 'yearly' ? 'bg-white/20' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            SAVE 20%
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="text-center mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={billingPeriod + (appliedCoupon?.code || '')}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                      >
                        {appliedCoupon ? (
                          <>
                            <div className="flex items-baseline justify-center gap-2">
                              <span className="text-2xl text-slate-500 line-through">₹{Math.round(getOriginalPrice())}</span>
                              <span className="text-5xl font-bold text-emerald-400">₹{Math.round(getCurrentPrice())}</span>
                            </div>
                            <p className="text-sm font-medium text-emerald-400">You save ₹{Math.round(appliedCoupon.discountAmount)}!</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-5xl font-bold text-white">₹{displayPrice}</span>
                              <span className="text-slate-500 text-lg">/mo</span>
                            </div>
                            {billingPeriod === 'yearly' ? (
                              <div className="space-y-1">
                                <p className="text-sm text-slate-400">
                                  ₹{yearlyPrice} billed yearly • <span className="text-emerald-400">Save ₹{yearlySavings}</span>
                                </p>
                                <p className="text-xs text-slate-500">That's only ₹{dailyPrice}/day</p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">Billed monthly</p>
                            )}
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* What's Included */}
                  <div className="space-y-3 mb-6">
                    {[
                      { icon: Infinity, text: "Unlimited trade logging" },
                      { icon: Brain, text: "AI-powered insights" },
                      { icon: LineChart, text: "Advanced analytics & reports" },
                      { icon: Target, text: "Prop firm challenge tracking" },
                      { icon: Play, text: "Backtesting lab access" },
                      { icon: Zap, text: "Priority support" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-sm text-slate-300">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Section */}
                  <div className="mb-6">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">{appliedCoupon.code}</span>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="p-1 hover:bg-emerald-500/20 rounded transition-colors">
                          <X className="h-4 w-4 text-emerald-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button 
                          onClick={() => setShowCoupon(!showCoupon)}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          <Tag className="w-4 h-4" />
                          <span>Have a coupon?</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
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
                                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/[0.06] text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                />
                                <button
                                  onClick={handleApplyCoupon}
                                  disabled={couponLoading}
                                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.06] text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                </button>
                              </div>
                              {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                  )}

                  {/* CTA */}
                  <motion.button
                    onClick={handlePayment}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        <span>Start Trading Smarter</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>

                  {/* Trust */}
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure checkout powered by Razorpay</span>
                  </div>

                  {/* Money Back */}
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <p className="text-xs text-slate-400">
                      <span className="text-emerald-400 font-medium">30-day money-back guarantee</span> — No questions asked
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile Sticky CTA */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <motion.button
            onClick={handlePayment}
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Get Pro — ₹{displayPrice}/mo</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
