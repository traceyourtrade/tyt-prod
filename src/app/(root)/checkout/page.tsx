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
  Target,
  LineChart,
  Clock,
  Users,
  Tag,
  X,
  ArrowRight,
  Star
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

const features = [
  { icon: BarChart3, title: "Advanced Analytics" },
  { icon: Brain, title: "AI Trade Analysis" },
  { icon: Target, title: "Prop Firm Mode" },
  { icon: LineChart, title: "Backtesting Lab" },
  { icon: Zap, title: "Unlimited Trades" },
  { icon: Sparkles, title: "Playbook Builder" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isUpgrade, setIsUpgrade] = useState(false);
  
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
      setError("Payment system is loading. Please try again.");
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
        ? `Pro Yearly (₹${currentPrice}/year)`
        : `Pro Monthly (₹${currentPrice}/month)`;
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

  const displayPrice = billingPeriod === 'yearly' ? yearlyMonthlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background - Hidden on mobile for performance */}
      <div className="hidden md:block fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 lg:px-8 py-8 lg:py-12">
        
        {/* Back Button */}
        {subscriptionStatus?.hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </motion.div>
        )}

        {/* Welcome Banner for New Users */}
        {subscriptionStatus?.status === 'inactive' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Welcome to ProJournX!</h2>
                <p className="text-sm text-muted-foreground">Choose a plan to start your trading journal journey.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {isUpgrade ? 'Upgrade to ' : 'Get '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="text-muted-foreground">Unlock your full trading potential</p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-12">
          
          {/* Left Column - Features */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-7/12 space-y-6"
          >
            {/* Social Proof */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="flex -space-x-2">
                {['bg-emerald-500', 'bg-blue-500', 'bg-purple-500'].map((color, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-card flex items-center justify-center text-xs font-medium text-white`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,800+</span> traders upgraded this month
                </span>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-emerald-500/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="font-medium text-foreground">{feature.title}</span>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  RM
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">Rajesh M.</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "My win rate improved from 38% to 62% in just 3 months. The AI insights are game-changing!"
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">38% → 62% win rate</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full lg:w-5/12"
          >
            <div className="relative isolate">
              {/* Glow Effect - Hidden on mobile */}
              <div className="hidden md:block absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 rounded-3xl blur-2xl -z-10" />
              
              <div className="p-6 lg:p-8 rounded-2xl bg-card border border-emerald-500/20 shadow-xl">
                {/* Trial Warning */}
                {subscriptionStatus?.isOnTrial && (
                  <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <p className="text-sm font-medium text-amber-400">
                      Trial ends in {subscriptionStatus.trialDaysLeft} days
                    </p>
                  </div>
                )}

                {/* Billing Toggle */}
                <div className="flex justify-center mb-6">
                  <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border">
                    <button
                      onClick={() => setBillingPeriod('monthly')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        billingPeriod === 'monthly' 
                          ? 'bg-card text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod('yearly')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        billingPeriod === 'yearly' 
                          ? 'bg-emerald-500 text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Yearly
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        billingPeriod === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        -20%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-center mb-6">
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
                            <span className="text-xl text-muted-foreground line-through">
                              ₹{Math.round(getOriginalPrice())}
                            </span>
                            <span className="text-4xl font-bold text-emerald-400">
                              ₹{Math.round(getCurrentPrice())}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-emerald-400">
                            You save ₹{Math.round(appliedCoupon.discountAmount)}!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-foreground">₹{displayPrice}</span>
                            <span className="text-muted-foreground">/mo</span>
                          </div>
                          {billingPeriod === 'yearly' ? (
                            <div className="space-y-0.5">
                              <p className="text-sm text-muted-foreground">
                                ₹{yearlyPrice}/year • <span className="text-emerald-400">Save ₹{yearlySavings}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">Only ₹{dailyPrice}/day</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Billed monthly</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Coupon Section */}
                <div className="mb-6">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="p-1 hover:bg-emerald-500/20 rounded transition-colors">
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
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          />
                        </div>
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2.5 rounded-lg bg-muted/50 border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                      {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                    </div>
                  )}
                </div>

                {/* Features Checklist */}
                <div className="space-y-2.5 mb-6">
                  {[
                    "Full access to all Pro features",
                    "AI-powered trade analysis",
                    "Unlimited backtesting",
                    "Priority support"
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  </div>
                )}

                {/* CTA Button */}
                <motion.button
                  onClick={handlePayment}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      Start Pro Now
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
