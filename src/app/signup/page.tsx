"use client";

import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, Lock, ArrowRight, ChevronDown, Search, Eye, EyeOff, Target, Zap, Shield, Loader2, Check, X } from "lucide-react";

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
    code: "+1",
    country: "United States",
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
        Cookies.set("Trace Your Trades", data.message, {
          expires: 5,
          domain: ".traceyourtrade.com",
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

  const features = [
    { icon: Target, label: "Track Every Trade", color: "text-blue-400" },
    { icon: Zap, label: "AI-Powered Insights", color: "text-amber-400" },
    { icon: Shield, label: "Secure & Private", color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#09090b] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              width={48}
              height={48}
              src="/images/logo-dark.png"
              alt="ProJournX"
              className="w-12 h-12 object-contain mb-12"
              unoptimized
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl xl:text-5xl font-semibold text-white leading-[1.15] tracking-tight mb-4"
          >
            Start Your
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-blue-300 bg-clip-text text-transparent">
              Trading Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-md mb-12 leading-relaxed"
          >
            Join thousands of traders who use ProJournX to track trades, analyze performance, and become consistently profitable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
              >
                <feature.icon className={`w-4 h-4 ${feature.color}`} />
                <span className="text-sm text-zinc-300">{feature.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px] my-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              width={48}
              height={48}
              src="/images/logo-dark.png"
              alt="ProJournX"
              className="w-12 h-12 object-contain"
              unoptimized
            />
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Create your account
            </h2>
            <p className="text-zinc-500">
              Start tracking your trades today
            </p>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={() => signUpWithGoogle()}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={postSignUp} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-600" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={signUpData.fullName}
                  onChange={setLoginVal}
                  required
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-600" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={signUpData.email}
                  onChange={setLoginVal}
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Phone Number</label>
              <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.06] transition-all min-w-[85px]"
                  >
                    <span className="text-sm">{selectedCode.code}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full left-0 mt-2 w-64 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus:border-blue-500/50"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredOptions.map((country, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelect(country)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-white/[0.05] transition-colors"
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
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-600" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={signUpData.phone}
                    onChange={setLoginVal}
                    required
                    autoComplete="tel"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={signUpData.password}
                  onChange={setLoginVal}
                  required
                  autoComplete="new-password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {/* Password Strength */}
              {signUpData.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        strength >= level
                          ? level <= 1
                            ? "bg-red-500"
                            : level <= 2
                            ? "bg-amber-500"
                            : level <= 3
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-600" />
                <input
                  type={showConPassword ? "text" : "password"}
                  name="cpassword"
                  placeholder="Confirm your password"
                  value={signUpData.cpassword}
                  onChange={setLoginVal}
                  required
                  autoComplete="new-password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConPassword(!showConPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showConPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {/* Password Match Indicator */}
              {signUpData.cpassword && (
                <div className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                  {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:text-zinc-300 transition-colors">
              Sign in
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-zinc-700 mt-6">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-zinc-500 transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-zinc-500 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;
