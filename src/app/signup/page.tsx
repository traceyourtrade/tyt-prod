"use client";

import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, ArrowRight, ChevronDown, Search, Eye, EyeOff, Loader2, Check, X, TrendingUp, BarChart3 } from "lucide-react";

type CountryCode = { country: string; code: string };

type SignUpData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  cpassword: string;
};

const recentSignups = [
  { name: "Raj", city: "Mumbai" },
  { name: "Priya", city: "Bangalore" },
  { name: "Amit", city: "Delhi" },
  { name: "Sneha", city: "Hyderabad" },
  { name: "Vikram", city: "Chennai" },
  { name: "Neha", city: "Pune" },
  { name: "Arjun", city: "Kolkata" },
  { name: "Kavya", city: "Ahmedabad" },
  { name: "Rohit", city: "Jaipur" },
  { name: "Anjali", city: "Lucknow" },
];

const SignUp: React.FC = () => {
  const countryPhoneCodes: CountryCode[] = [
    { country: "United States", code: "+1" },
    { country: "United Kingdom", code: "+44" },
    { country: "India", code: "+91" },
    { country: "Canada", code: "+1" },
    { country: "Australia", code: "+61" },
    { country: "Germany", code: "+49" },
    { country: "France", code: "+33" },
    { country: "Japan", code: "+81" },
    { country: "China", code: "+86" },
    { country: "Brazil", code: "+55" },
    { country: "Mexico", code: "+52" },
    { country: "Spain", code: "+34" },
    { country: "Italy", code: "+39" },
    { country: "Netherlands", code: "+31" },
    { country: "Singapore", code: "+65" },
    { country: "United Arab Emirates", code: "+971" },
    { country: "South Africa", code: "+27" },
    { country: "Russia", code: "+7" },
    { country: "South Korea", code: "+82" },
    { country: "Indonesia", code: "+62" },
    { country: "Thailand", code: "+66" },
    { country: "Malaysia", code: "+60" },
    { country: "Philippines", code: "+63" },
    { country: "Vietnam", code: "+84" },
    { country: "Pakistan", code: "+92" },
    { country: "Bangladesh", code: "+880" },
    { country: "Nigeria", code: "+234" },
    { country: "Egypt", code: "+20" },
    { country: "Turkey", code: "+90" },
    { country: "Poland", code: "+48" },
    { country: "Sweden", code: "+46" },
    { country: "Norway", code: "+47" },
    { country: "Denmark", code: "+45" },
    { country: "Switzerland", code: "+41" },
    { country: "Austria", code: "+43" },
    { country: "Belgium", code: "+32" },
    { country: "Portugal", code: "+351" },
    { country: "Greece", code: "+30" },
    { country: "Czech Republic", code: "+420" },
    { country: "Romania", code: "+40" },
    { country: "Hungary", code: "+36" },
    { country: "Ireland", code: "+353" },
    { country: "New Zealand", code: "+64" },
    { country: "Israel", code: "+972" },
    { country: "Saudi Arabia", code: "+966" },
    { country: "Argentina", code: "+54" },
    { country: "Chile", code: "+56" },
    { country: "Colombia", code: "+57" },
    { country: "Peru", code: "+51" },
    { country: "Kenya", code: "+254" },
  ];

  const [selectedCode, setSelectedCode] = useState<CountryCode>({
    code: "+91",
    country: "India",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentSignup, setCurrentSignup] = useState(0);
  const [showSignupNotification, setShowSignupNotification] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSignupNotification(false);
      setTimeout(() => {
        setCurrentSignup((prev) => (prev + 1) % recentSignups.length);
        setShowSignupNotification(true);
      }, 500);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const filteredOptions = countryPhoneCodes
    .filter(
      (c) =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    )
    .filter((c) => c.code !== selectedCode.code);

  const handleSelect = (country: CountryCode) => {
    setSelectedCode(country);
    setIsOpen(false);
    setSearch("");
  };

  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    cpassword: "",
  });

  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConPassword, setShowConPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [showTradingFields, setShowTradingFields] = useState(false);
  const [tradingExperience, setTradingExperience] = useState("");
  const [preferredMarket, setPreferredMarket] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      const coupon = urlParams.get('coupon');
      
      if (ref) {
        setReferralCode(ref);
        localStorage.setItem('affiliate_ref', ref);
      } else {
        const storedRef = localStorage.getItem('affiliate_ref');
        if (storedRef) setReferralCode(storedRef);
      }
      
      if (coupon) {
        setCouponCode(coupon);
        localStorage.setItem('affiliate_coupon', coupon);
      } else {
        const storedCoupon = localStorage.getItem('affiliate_coupon');
        if (storedCoupon) setCouponCode(storedCoupon);
      }
    }
  }, []);

  const setLoginVal = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const signUpWithGoogle = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: "https://app.projournx.com/auth/google/callback",
  });

  const postSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { email, fullName, phone, password, cpassword } = signUpData;

    try {
      const res = await fetch(`/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          password,
          cpassword,
          countryCode: selectedCode.code,
          country: selectedCode.country,
          referralCode: referralCode || undefined,
          couponCode: couponCode || undefined,
          tradingExperience: tradingExperience || undefined,
          preferredMarket: preferredMarket || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        Cookies.set("ProJournX", data.message, {
          expires: 5,
          domain: ".projournx.com",
          path: "/",
        });

        localStorage.setItem("pendingVerificationEmail", email);
        router.push(`/verificationmail`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password");
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries");
        } else {
          setError(data.error || "Signup failed");
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength(signUpData.password);
  const passwordsMatch = signUpData.password && signUpData.cpassword && signUpData.password === signUpData.cpassword;

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  const getTimeAgo = () => {
    const times = ["1 min ago", "2 min ago", "3 min ago", "5 min ago", "8 min ago"];
    return times[currentSignup % times.length];
  };

  return (
    <div className="min-h-screen w-full flex bg-[#050508] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#071018] to-[#050508]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_20%_30%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_50%_at_80%_70%,rgba(139,92,246,0.1),transparent)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(6,182,212,0.08),transparent)]" />
      </div>

      <motion.div
        animate={{ y: [0, -25, 0], x: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 18, 0], x: [0, -15, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-500/12 to-purple-500/8 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 right-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/8 to-blue-500/5 rounded-full blur-3xl"
      />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-8 xl:p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#071420] via-[#0a1830] to-[#050510]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        <motion.div
          animate={{ 
            background: [
              "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(16,185,129,0.12), transparent)",
              "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(6,182,212,0.12), transparent)",
              "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(16,185,129,0.12), transparent)"
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
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-12 right-12 w-28 h-28 border border-emerald-500/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-40 h-40 border border-teal-500/15 rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-32 left-16 w-24 h-24 border border-cyan-500/20 rounded-full"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
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
              <span className="text-xs text-amber-400 font-semibold">47 traders signed up today</span>
            </motion.div>
            
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Your Trading
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Performance OS
              </span>
            </h1>
            
            <p className="text-lg text-white/60 max-w-md leading-relaxed">
              Analyze. Improve. Scale with discipline.
            </p>

            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 max-w-fit"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-orange-400 font-medium">Lock in current pricing before it increases</span>
            </motion.div>
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
            <span className="text-xs text-orange-400 font-medium">Limited spots for beta pricing</span>
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[400px] py-4"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-violet-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent rounded-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-center mb-5 lg:hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-white">ProJournX</span>
                  </div>
                </div>

                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-white mb-1.5">Create your account</h2>
                  <p className="text-sm text-white/50">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>

                <motion.button
                  onClick={() => signUpWithGoogle()}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-all shadow-lg shadow-white/10 mb-5"
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

                <form onSubmit={postSignUp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70">Full name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="John Doe"
                        value={signUpData.fullName}
                        onChange={setLoginVal}
                        required
                        autoComplete="name"
                        className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70">Email address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={signUpData.email}
                        onChange={setLoginVal}
                        required
                        autoComplete="email"
                        className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70">Phone number</label>
                    <div className="flex gap-2">
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsOpen(!isOpen)}
                          className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white hover:bg-white/[0.08] transition-all min-w-[85px]"
                        >
                          <span>{selectedCode.code}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 left-0 mt-1 w-56 bg-[#1a1a24] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
                            >
                              <div className="p-2 border-b border-white/[0.05]">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                  <input
                                    type="text"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/30 outline-none focus:border-emerald-500/50"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredOptions.map((c) => (
                                  <button
                                    key={c.country}
                                    type="button"
                                    onClick={() => handleSelect(c)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-white/80 hover:bg-white/[0.05] transition-colors"
                                  >
                                    <span className="truncate">{c.country}</span>
                                    <span className="text-white/50 ml-2">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="relative group flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="1234567890"
                          value={signUpData.phone}
                          onChange={setLoginVal}
                          required
                          autoComplete="tel"
                          className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a strong password"
                        value={signUpData.password}
                        onChange={setLoginVal}
                        required
                        autoComplete="new-password"
                        className="w-full pl-11 pr-11 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {signUpData.password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < strength ? strengthColors[strength - 1] : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-white/40">
                          {strength > 0 ? strengthLabels[strength - 1] : 'Too weak'} password
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70">Confirm password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type={showConPassword ? "text" : "password"}
                        name="cpassword"
                        placeholder="Confirm your password"
                        value={signUpData.cpassword}
                        onChange={setLoginVal}
                        required
                        autoComplete="new-password"
                        className="w-full pl-11 pr-11 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConPassword(!showConPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showConPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {signUpData.cpassword && (
                      <div className="flex items-center gap-1 mt-1">
                        {passwordsMatch ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] text-red-400">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {(referralCode || couponCode) && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-amber-400" />
                      </div>
                      <span className="text-xs text-amber-400">
                        {referralCode && `Referral: ${referralCode}`}
                        {referralCode && couponCode && ' | '}
                        {couponCode && `Coupon: ${couponCode}`}
                      </span>
                    </div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs backdrop-blur-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading || !passwordsMatch}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-center text-[10px] text-white/30">
                    By signing up, you agree to our{" "}
                    <Link href="/terms" className="text-white/50 hover:text-white/70 transition-colors">
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link href="/privacy" className="text-white/50 hover:text-white/70 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                <div className="mt-3 text-center">
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
};

export default SignUp;
