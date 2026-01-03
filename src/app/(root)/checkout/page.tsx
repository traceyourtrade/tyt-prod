"use client";

import { useState, useEffect } from "react";
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
  Star,
  Target,
  LineChart,
  Clock,
  Users,
  Tag,
  X,
  ArrowRight,
  BadgeCheck,
  ChevronRight
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

const proFeatures = [
  { icon: BarChart3, label: "Advanced Analytics", desc: "Deep performance insights", gradient: "from-blue-500 to-cyan-400" },
  { icon: Brain, label: "AI Trade Analysis", desc: "Smart pattern detection", gradient: "from-purple-500 to-pink-400" },
  { icon: Target, label: "Prop Firm Mode", desc: "Track challenges & phases", gradient: "from-amber-500 to-orange-400" },
  { icon: LineChart, label: "Backtesting Lab", desc: "Practice on history", gradient: "from-emerald-500 to-teal-400" },
  { icon: Zap, label: "Unlimited Trades", desc: "No trade limits", gradient: "from-yellow-500 to-amber-400" },
  { icon: Sparkles, label: "Playbook Builder", desc: "Build winning setups", gradient: "from-rose-500 to-pink-400" },
];

const testimonials = [
  {
    name: "Rajesh M.",
    avatar: "RM",
    role: "Forex Trader",
    rating: 5,
    text: "My win rate jumped from 38% to 62% in just 3 months. The AI insights are game-changing!",
    highlight: "38% → 62% win rate"
  },
  {
    name: "Priya S.",
    avatar: "PS",
    role: "Options Trader", 
    rating: 5,
    text: "Finally a journal that understands prop firm challenges. Passed my FTMO evaluation on first try!",
    highlight: "FTMO passed"
  },
  {
    name: "Amit K.",
    avatar: "AK",
    role: "Day Trader",
    rating: 5,
    text: "The backtesting feature alone is worth 10x the price. I practice strategies risk-free now.",
    highlight: "10x value"
  }
];

const stats = [
  { value: "15,000+", label: "Active Traders" },
  { value: "₹2.4Cr+", label: "Tracked P&L" },
  { value: "4.9/5", label: "User Rating" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [tradersCount, setTradersCount] = useState(2847);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
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
    if (appliedCoupon) {
      return appliedCoupon.finalPrice;
    }
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
            if (upgradeParam === 'true' && data.billingPeriod !== 'yearly') {
              setIsUpgrade(true);
            } else {
              router.push("/dashboard");
            }
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
      setTradersCount(prev => prev + Math.floor(Math.random() * 3));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await fetch("/api/razorpay/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          couponCode: couponCode.trim(), 
          billingPeriod 
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCouponError(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        setCouponError(null);
      }
    } catch (err) {
      setCouponError("Failed to validate coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
  };

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
        body: JSON.stringify({ 
          billingPeriod,
          couponCode: appliedCoupon?.code || null
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }
      const currentPrice = getCurrentPrice();
      const planDescription = billingPeriod === 'yearly' 
        ? `Pro Subscription - Yearly (₹${currentPrice}/year)`
        : `Pro Subscription - Monthly (₹${currentPrice}/month)`;
      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "ProJournX",
        description: planDescription,
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (subscriptionStatus?.isSubscribed && !isUpgrade) {
    return null;
  }

  const currentPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Back Button */}
        {subscriptionStatus?.hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {subscriptionStatus?.status === 'inactive' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-white/10 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-foreground">Welcome to ProJournX!</span>
            </div>
          )}
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            {isUpgrade ? 'Upgrade to' : 'Get'} <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Pro</span> Access
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of traders who've transformed their performance
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-6 sm:gap-10 mb-8"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Social Proof */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="flex -space-x-2">
            {['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500'].map((color, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-background flex items-center justify-center text-xs font-bold text-white`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-foreground">{tradersCount.toLocaleString()}</span>
            <span className="text-muted-foreground">traders upgraded this month</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Features & Testimonials */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {proFeatures.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-emerald-500/30 hover:bg-card/80 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                      <feature.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{feature.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial Carousel */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50"
            >
              <div className="absolute top-4 right-4 flex gap-1">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentTestimonial ? 'bg-emerald-400' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{testimonials[currentTestimonial].name}</span>
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs text-muted-foreground">{testimonials[currentTestimonial].role}</span>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground italic mb-3">"{testimonials[currentTestimonial].text}"</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">{testimonials[currentTestimonial].highlight}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right Column - Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:sticky lg:top-6"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70" />
            
            <div className="relative p-6 sm:p-8 rounded-2xl bg-card/90 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              {/* Trial Warning */}
              {subscriptionStatus?.isOnTrial && (
                <div className="mb-5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                  <p className="text-amber-400 text-sm font-medium">
                    Trial ends in {subscriptionStatus.trialDaysLeft} days
                  </p>
                </div>
              )}

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    billingPeriod === 'monthly' 
                      ? 'bg-muted text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    billingPeriod === 'yearly' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">SAVE 20%</span>
                </button>
              </div>

              {/* Price Display */}
              <div className="text-center mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingPeriod + (appliedCoupon?.code || '')}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-1"
                  >
                    {appliedCoupon ? (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-2xl text-muted-foreground line-through">
                            ₹{Math.round(getOriginalPrice())}
                          </span>
                          <span className="text-5xl font-bold text-emerald-400">
                            ₹{Math.round(getCurrentPrice())}
                          </span>
                        </div>
                        <p className="text-sm text-emerald-400 font-semibold">
                          You save ₹{Math.round(appliedCoupon.discountAmount)}!
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-bold text-foreground">₹{currentPrice}</span>
                          <span className="text-muted-foreground text-lg">/mo</span>
                        </div>
                        {billingPeriod === 'yearly' && (
                          <div className="space-y-0.5">
                            <p className="text-sm text-muted-foreground">
                              ₹{yearlyPrice}/year — <span className="text-emerald-400 font-semibold">Save ₹{yearlySavings}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">That's only ₹{dailyPrice}/day</p>
                          </div>
                        )}
                        {billingPeriod === 'monthly' && (
                          <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">{appliedCoupon.code}</span>
                      <span className="text-xs text-emerald-400/70">({appliedCoupon.description})</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-1.5 rounded-full hover:bg-emerald-500/20 transition-colors"
                    >
                      <X className="h-4 w-4 text-emerald-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Coupon code"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                      </div>
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-400 pl-1">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Features Checklist */}
              <div className="space-y-3 mb-6">
                {[
                  "Full access to all Pro features",
                  "AI-powered trade analysis",
                  "Unlimited backtesting sessions",
                  "Priority support & updates"
                ].map((feature, i) => (
                  <motion.div 
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* CTA Button */}
              <motion.button
                onClick={handlePayment}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Start Pro Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 mt-5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cancel anytime</span>
                </div>
              </div>

              {/* Terms */}
              <p className="text-center text-xs text-muted-foreground mt-4">
                By subscribing, you agree to our{' '}
                <Link href="/terms" className="text-emerald-400 hover:underline">Terms</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
              </p>
            </div>

            {/* Urgency Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm font-medium text-amber-300">
                <span className="font-bold">Limited offer:</span> Lock in this price before it increases
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
