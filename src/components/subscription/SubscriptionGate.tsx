"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Shield, 
  Zap,
  Check,
  Star,
  Users,
  Lock,
  ArrowRight,
  Clock,
  BadgeCheck
} from "lucide-react";
import Link from "next/link";

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none' | 'inactive';
}

interface SubscriptionGateProps {
  children: ReactNode;
  featureName: string;
  featureDescription?: string;
}

const MONTHLY_PRICE = 849;
const YEARLY_PRICE = 8199;
const YEARLY_MONTHLY_EQUIVALENT = Math.round(YEARLY_PRICE / 12);
const YEARLY_SAVINGS = (MONTHLY_PRICE * 12) - YEARLY_PRICE;

const proFeatures = [
  { icon: BarChart3, label: "Advanced Analytics", desc: "Deep dive into your performance" },
  { icon: Sparkles, label: "AI Trade Analysis", desc: "Smart pattern recognition" },
  { icon: Target, label: "Prop Firm Mode", desc: "Track challenges & phases" },
  { icon: TrendingUp, label: "Backtesting Lab", desc: "Practice on historical data" },
  { icon: Zap, label: "Playbook Builder", desc: "Build winning strategies" },
  { icon: Shield, label: "Priority Support", desc: "Get help when you need it" },
];

const testimonials = [
  {
    name: "Rajesh M.",
    avatar: "RM",
    role: "Forex Trader",
    rating: 5,
    text: "My win rate jumped from 38% to 62% in just 3 months. The AI insights are game-changing!"
  },
  {
    name: "Priya S.",
    avatar: "PS",
    role: "Options Trader", 
    rating: 5,
    text: "Finally a journal that understands prop firm challenges. Passed my FTMO evaluation on first try!"
  },
  {
    name: "Amit K.",
    avatar: "AK",
    role: "Day Trader",
    rating: 5,
    text: "The backtesting feature alone is worth 10x the price. I practice strategies risk-free now."
  }
];

export default function SubscriptionGate({ 
  children, 
  featureName,
  featureDescription = "Unlock powerful trading insights and tools"
}: SubscriptionGateProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [tradersCount, setTradersCount] = useState(2847);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (subscriptionStatus?.hasAccess) {
    return <>{children}</>;
  }

  const currentPrice = billingPeriod === 'yearly' ? YEARLY_MONTHLY_EQUIVALENT : MONTHLY_PRICE;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">{featureName} is a Pro Feature</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Upgrade to <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Pro</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {featureDescription}
          </p>
        </motion.div>

        {/* Social Proof Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
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
          {/* Left Column - Features */}
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
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-colors">
                      <feature.icon className="w-5 h-5 text-emerald-400" />
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
                  <p className="text-muted-foreground italic">"{testimonials[currentTestimonial].text}"</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Right Column - Pricing Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-70" />
            
            <div className="relative p-6 sm:p-8 rounded-2xl bg-card/90 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingPeriod === 'monthly' 
                      ? 'bg-muted text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    billingPeriod === 'yearly' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">-20%</span>
                </button>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingPeriod}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-1"
                  >
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold text-foreground">₹{currentPrice}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          ₹{YEARLY_PRICE}/year — <span className="text-emerald-400 font-semibold">Save ₹{YEARLY_SAVINGS}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">That's only ₹{Math.round(YEARLY_PRICE / 365)}/day</p>
                      </div>
                    )}
                    {billingPeriod === 'monthly' && (
                      <p className="text-sm text-muted-foreground">Billed monthly, cancel anytime</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Features Checklist */}
              <div className="space-y-3 mb-6">
                {[
                  "Full access to all Pro features",
                  "AI-powered trade analysis",
                  "Unlimited backtesting sessions",
                  "Priority support"
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

              {/* CTA Button */}
              <Link href={`/checkout?plan=${billingPeriod}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 group"
                >
                  <Crown className="w-5 h-5" />
                  <span>Start Pro Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>

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

        {/* Back to Dashboard Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
