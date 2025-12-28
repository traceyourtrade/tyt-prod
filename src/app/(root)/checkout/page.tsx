"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  LineChart,
  Clock,
  Users,
  Tag,
  X
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
  { icon: BarChart3, title: "Advanced Analytics", gradient: "from-blue-500 to-cyan-400" },
  { icon: Brain, title: "AI Trade Analysis", gradient: "from-purple-500 to-pink-400" },
  { icon: Target, title: "Prop Firm Mode", gradient: "from-amber-500 to-orange-400" },
  { icon: LineChart, title: "Performance Reports", gradient: "from-emerald-500 to-teal-400" },
  { icon: Zap, title: "Unlimited Trades", gradient: "from-yellow-500 to-amber-400" },
  { icon: Sparkles, title: "Playbook Builder", gradient: "from-rose-500 to-pink-400" },
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
  const dailyPrice = Math.round(yearlyPrice / 365);
  const currencySymbol = "₹";

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

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-teal-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Upgrade to <span className="text-emerald-400">Pro</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Unlock your full trading potential
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <Users className="h-4 w-4 text-emerald-400" />
                <p className="text-xs text-emerald-400">
                  <span className="font-semibold">2,847 traders</span> upgraded this month
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">{feature.title}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 border border-white/[0.06] backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    HP
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">Himanshu P.</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "ProJournX Pro helped me identify my best setups. My win rate improved from 42% to 67% in just 2 months."
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 lg:sticky lg:top-4"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5" />
                <div className="absolute inset-0 border border-emerald-500/20 rounded-2xl" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />
                
                <div className="relative p-5">
                  {subscriptionStatus?.isOnTrial && (
                    <div className="mb-4 p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-amber-400 text-xs font-medium">
                        Trial ends in {subscriptionStatus.trialDaysLeft} days
                      </p>
                    </div>
                  )}

                  <div className="flex justify-center mb-4">
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/50">
                      <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          billingPeriod === 'monthly'
                            ? 'bg-white/10 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                          billingPeriod === 'yearly'
                            ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Yearly
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[10px] text-white font-bold">
                          -20%
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    {appliedCoupon ? (
                      <>
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-lg text-muted-foreground line-through">
                            ₹{Math.round(getOriginalPrice())}
                          </span>
                          <span className="text-3xl font-bold text-emerald-400">
                            ₹{Math.round(getCurrentPrice())}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium mt-1">
                          You save ₹{Math.round(appliedCoupon.discountAmount)}!
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-foreground">
                            ₹{billingPeriod === 'monthly' ? monthlyPrice : yearlyMonthlyPrice}
                          </span>
                          <span className="text-muted-foreground text-sm">/mo</span>
                        </div>
                        
                        {billingPeriod === 'yearly' ? (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-xs text-emerald-400 font-medium">
                              ₹{yearlyPrice}/year — Save ₹{monthlyPrice * 12 - yearlyPrice}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              That's only ₹{dailyPrice}/day
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">
                            Billed monthly
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-4">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-400">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-[10px] text-emerald-400/70">
                            ({appliedCoupon.description})
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="p-1 rounded-full hover:bg-emerald-500/20 transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-emerald-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Coupon code"
                              className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                          </div>
                          <button
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {couponLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[10px] text-red-400">{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {["Full access to all Pro features", "AI-powered trade analysis", "Priority support", "Regular updates"].map(
                      (item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="h-2.5 w-2.5 text-emerald-400" />
                          </div>
                          <span className="text-xs text-foreground">{item}</span>
                        </div>
                      )
                    )}
                  </div>

                  {error && (
                    <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-xs text-center">{error}</p>
                    </div>
                  )}

                  <motion.button
                    onClick={handlePayment}
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        Start Pro Now
                      </>
                    )}
                  </motion.button>

                  <div className="mt-4 pt-3 border-t border-border/30">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span className="text-[10px]">Secure</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        <span className="text-[10px]">Encrypted</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3 w-3" />
                        <span className="text-[10px]">Cancel anytime</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-muted-foreground mt-3">
                    By subscribing, you agree to our{" "}
                    <Link href="/terms" className="text-emerald-400 hover:underline">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">
                    <span className="font-semibold">Limited offer:</span> Lock in this price before it increases
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
