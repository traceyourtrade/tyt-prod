"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, TrendingUp, Check } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

const recentSignups = [
  { name: "Rahul", city: "Mumbai" },
  { name: "Priya", city: "Bangalore" },
  { name: "Amit", city: "Delhi" },
  { name: "Sneha", city: "Hyderabad" },
  { name: "Vikram", city: "Chennai" },
  { name: "Neha", city: "Pune" },
  { name: "Arjun", city: "Kolkata" },
  { name: "Kavya", city: "Ahmedabad" },
];

export default function LoginPage() {
  const router = useRouter();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSignup, setCurrentSignup] = useState(0);
  const [showSignupNotification, setShowSignupNotification] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSignupNotification(false);
      setTimeout(() => {
        setCurrentSignup((prev) => (prev + 1) % recentSignups.length);
        setShowSignupNotification(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    if (error) setError("");
  };

  const postLoginDetails = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { email, password } = loginData;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.status === 200) {
        router.push(`/dashboard`);
      } else if (res.status === 403 && data.emailNotVerified) {
        localStorage.setItem("pendingVerificationEmail", email);
        router.push(`/verificationmail`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck your Email & Password");
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries");
        } else if (data.error === "User is not registered") {
          setError("User is not registered. Please sign up first.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const logInWithGoogle = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: "https://app.projournx.com/auth/google/callback",
  });

  const getTimeAgo = () => {
    const times = ["2 min ago", "3 min ago", "5 min ago", "8 min ago", "12 min ago"];
    return times[currentSignup % times.length];
  };

  return (
    <div className="min-h-screen w-full flex bg-[#050508] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0c1222] to-[#050508]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(56,189,248,0.15),transparent)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(34,211,238,0.12),transparent)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(139,92,246,0.08),transparent)]" />
      </div>

      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-500/15 to-purple-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full blur-3xl"
      />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-8 xl:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0c1830] to-[#050510]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <motion.div
          animate={{ 
            background: [
              "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(56,189,248,0.15), transparent)",
              "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(34,211,238,0.15), transparent)",
              "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(56,189,248,0.15), transparent)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />

        <svg className="absolute right-8 top-1/4 w-64 h-64 opacity-10" viewBox="0 0 200 200">
          <motion.g
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect x="20" y="80" width="8" height="60" fill="#10b981" rx="1" />
            <line x1="24" y1="70" x2="24" y2="80" stroke="#10b981" strokeWidth="2" />
            <line x1="24" y1="140" x2="24" y2="155" stroke="#10b981" strokeWidth="2" />
            
            <rect x="40" y="60" width="8" height="50" fill="#10b981" rx="1" />
            <line x1="44" y1="50" x2="44" y2="60" stroke="#10b981" strokeWidth="2" />
            <line x1="44" y1="110" x2="44" y2="125" stroke="#10b981" strokeWidth="2" />
            
            <rect x="60" y="70" width="8" height="55" fill="#ef4444" rx="1" />
            <line x1="64" y1="55" x2="64" y2="70" stroke="#ef4444" strokeWidth="2" />
            <line x1="64" y1="125" x2="64" y2="140" stroke="#ef4444" strokeWidth="2" />
            
            <rect x="80" y="90" width="8" height="40" fill="#ef4444" rx="1" />
            <line x1="84" y1="75" x2="84" y2="90" stroke="#ef4444" strokeWidth="2" />
            <line x1="84" y1="130" x2="84" y2="145" stroke="#ef4444" strokeWidth="2" />
            
            <rect x="100" y="50" width="8" height="70" fill="#10b981" rx="1" />
            <line x1="104" y1="35" x2="104" y2="50" stroke="#10b981" strokeWidth="2" />
            <line x1="104" y1="120" x2="104" y2="135" stroke="#10b981" strokeWidth="2" />
            
            <rect x="120" y="40" width="8" height="55" fill="#10b981" rx="1" />
            <line x1="124" y1="25" x2="124" y2="40" stroke="#10b981" strokeWidth="2" />
            <line x1="124" y1="95" x2="124" y2="110" stroke="#10b981" strokeWidth="2" />
          </motion.g>
        </svg>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute top-16 right-16 w-24 h-24 border border-cyan-500/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-24 right-24 w-36 h-36 border border-blue-500/15 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-32 left-16 w-20 h-20 border border-violet-500/20 rounded-full"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ProJournX</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 space-y-6"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 backdrop-blur-sm"
            >
              <span className="text-sm">🔥</span>
              <span className="text-xs text-amber-400 font-semibold">Join 500+ winning traders</span>
            </motion.div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Your Trading
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Performance OS
              </span>
            </h1>
            
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Analyze. Improve. Scale with discipline.
            </p>

            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-sm text-amber-400/80 font-medium"
            >
              Don't miss out on proven strategies
            </motion.p>
          </div>

          <div className="space-y-3">
            {[
              "Track every trade with precision analytics",
              "AI-powered pattern recognition",
              "Detailed performance insights & reports",
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-white/70">{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-orange-400 font-medium">Limited spots at current pricing</span>
          </motion.div>

          <AnimatePresence mode="wait">
            {showSignupNotification && (
              <motion.div
                key={currentSignup}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 max-w-fit"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">
                  {recentSignups[currentSignup].name} from {recentSignups[currentSignup].city} joined {getTimeAgo()}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-8 xl:gap-12">
            {[
              { value: "500+", label: "Traders" },
              { value: "50K+", label: "Trades" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[380px]"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-7 shadow-2xl shadow-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent rounded-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-center mb-6 lg:hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-white">ProJournX</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Sign in</h2>
                  <p className="text-sm text-white/50">
                    New to ProJournX?{" "}
                    <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Create a free account
                    </Link>
                  </p>
                </div>

                <motion.button
                  onClick={logInWithGoogle}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-all shadow-lg shadow-white/10 mb-5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </motion.button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                <form onSubmit={postLoginDetails} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/70">Email address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={handleInputChange}
                        autoComplete="email"
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-white/70">Password</label>
                      <Link href="/forgotpassword" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={handleInputChange}
                        autoComplete="current-password"
                        className="w-full pl-11 pr-11 py-3 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs backdrop-blur-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 pt-5 border-t border-white/[0.06]">
                  <p className="text-center text-xs text-white/30">
                    By continuing, you agree to our{" "}
                    <Link href="/terms" className="text-white/50 hover:text-white/70 transition-colors">
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link href="/privacy" className="text-white/50 hover:text-white/70 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <a 
                    href="https://www.tradingview.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
                  >
                    Charts by TradingView
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
