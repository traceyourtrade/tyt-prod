"use client";

import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, ArrowRight, ChevronDown, Search, Eye, EyeOff, Loader2, Check, X, Sparkles, Shield, TrendingUp, Star, Gift } from "lucide-react";

type CountryCode = { country: string; code: string };

type SignUpData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  cpassword: string;
};

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

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        Cookies.set("ProJournX", data.message, {
          expires: 5,
          domain: ".projournx.com",
          path: "/",
        });

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

  return (
    <div className="min-h-screen w-full flex bg-[#050508] relative overflow-hidden">
      {/* Global animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#071018] to-[#050508]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_20%_30%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_50%_at_80%_70%,rgba(139,92,246,0.1),transparent)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(6,182,212,0.08),transparent)]" />
      </div>

      {/* Floating orbs */}
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

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Left Side - Conversion-focused Visual (hidden to center the card) */}
      <div className="hidden relative z-10">
        {/* Floating geometric elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-12 right-12 w-28 h-28 border border-emerald-500/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-40 h-40 border border-violet-500/20 rounded-full"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8 xl:p-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">ProJournX</span>
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Free trial badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 backdrop-blur-sm"
            >
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">5-day free trial - No credit card required</span>
            </motion.div>
            
            <div className="space-y-3">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Transform your
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  trading results
                </span>
              </h1>
            </div>
            
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">
              Join 10,000+ traders who use ProJournX to track, analyze, and improve their performance.
            </p>

            {/* Benefits list */}
            <div className="space-y-3">
              {[
                "Track every trade with precision analytics",
                "AI-powered pattern recognition",
                "Detailed performance insights & reports",
                "Backtesting with TradingView charts",
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

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4 pt-2"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-[#050508] flex items-center justify-center shadow-lg"
                  >
                    <User className="w-3.5 h-3.5 text-white/50" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-white/50">Loved by 10,000+ traders</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center gap-6"
          >
            {[
              { icon: Shield, label: "Bank-level security" },
              { icon: Sparkles, label: "AI-powered insights" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/50">
                <item.icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Center - Glass Card Form */}
      <div className="w-full flex items-center justify-center p-6 sm:p-8 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[380px] py-4"
        >
          {/* Glassmorphic Card */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-violet-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/20">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent rounded-2xl pointer-events-none" />
              
              <div className="relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-semibold text-white">ProJournX</span>
                  </div>
                </div>

                {/* Header */}
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-white mb-1.5">Create your account</h2>
                  <p className="text-sm text-white/50">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>

                {/* Google Button */}
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

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>

                {/* Form */}
                <form onSubmit={postSignUp} className="space-y-3">
                  {/* Full Name */}
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

                  {/* Email */}
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

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70">Phone number</label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsOpen(!isOpen)}
                          className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm hover:bg-white/[0.08] transition-all min-w-[75px] backdrop-blur-sm"
                        >
                          <span className="text-xs">{selectedCode.code}</span>
                          <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 top-full left-0 mt-1 w-64 bg-[#0a0a12]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                            >
                              <div className="p-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 outline-none focus:border-emerald-500/50"
                                  />
                                </div>
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                {filteredOptions.map((country, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(country)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-white/60 hover:bg-white/5 transition-colors"
                                  >
                                    <span className="font-medium text-white">{country.code}</span>
                                    <span>{country.country}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Phone Input */}
                      <div className="relative flex-1 group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone number"
                          value={signUpData.phone}
                          onChange={setLoginVal}
                          required
                          autoComplete="tel"
                          className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/25 outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
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
                    
                    {/* Password Strength */}
                    {signUpData.password && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                i < strength ? strengthColors[strength - 1] : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-white/40">
                          Strength: <span className={strength >= 3 ? "text-emerald-400" : strength >= 2 ? "text-blue-400" : "text-amber-400"}>{strengthLabels[strength - 1] || "Too weak"}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
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
                    
                    {/* Password Match Indicator */}
                    {signUpData.cpassword && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {passwordsMatch ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] text-red-400">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs backdrop-blur-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Start free trial
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>

                  {/* Trust message */}
                  <p className="text-center text-[10px] text-white/40 pt-1">
                    No credit card required. Cancel anytime.
                  </p>
                </form>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <p className="text-center text-xs text-white/30">
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className="text-white/50 hover:text-white/70 transition-colors">
                      Terms
                    </Link>{" "}
                    &{" "}
                    <Link href="/privacy" className="text-white/50 hover:text-white/70 transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
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
