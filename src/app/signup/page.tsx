"use client";

import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import { Inter } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { User, Mail, Phone, Lock, ArrowRight, ChevronDown, Search, Sparkles, Shield, Zap, Target } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const featureCards = [
    {
      icon: Target,
      title: "Track Every Trade",
      description: "Log and analyze all your trades",
      color: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-400",
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Discover winning patterns",
      color: "from-amber-500/20 to-amber-600/10",
      iconColor: "text-amber-400",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is always protected",
      color: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className={`min-h-screen w-full bg-[#0a0a0a] ${inter.className} overflow-hidden`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[50%] right-[40%] w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px]"
        />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Decorative (Desktop Only) */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-12 xl:px-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-10"
          >
            <Image
              width={280}
              height={70}
              src="/images/logo-dark.png?v=2"
              alt="ProJournX Logo"
              className="h-12 w-auto"
              unoptimized
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6"
          >
            Start Your
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Trading Journey
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg text-gray-400 max-w-md mb-12"
          >
            Join thousands of traders who use ProJournX to track their trades, analyze performance, and become consistently profitable.
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {featureCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02, x: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${card.color} backdrop-blur-xl border border-white/10 max-w-sm cursor-pointer group`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{card.title}</h3>
                    <p className="text-sm text-gray-400">{card.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="lg:hidden flex justify-center mb-8"
            >
              <Image
                width={200}
                height={50}
                src="/images/logo-dark.png?v=2"
                alt="ProJournX Logo"
                className="h-10 w-auto"
                unoptimized
              />
            </motion.div>

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-emerald-500/20 rounded-[28px] blur-xl opacity-50" />

              <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400 font-medium">Get Started Free</span>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl sm:text-3xl font-bold text-white mb-2"
                  >
                    Create your account
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-gray-400 text-sm"
                  >
                    Start tracking your trades today
                  </motion.p>
                </div>

                {/* Social Login Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-2 gap-3 mb-6"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => signUpWithGoogle()}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <FontAwesomeIcon icon={faGoogle} className="w-5 h-5" />
                    <span className="text-sm font-medium">Google</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <FontAwesomeIcon icon={faApple} className="w-5 h-5" />
                    <span className="text-sm font-medium">Apple</span>
                  </motion.button>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-sm text-gray-500">or continue with email</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onSubmit={postSignUp}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={signUpData.fullName}
                        onChange={setLoginVal}
                        required
                        autoComplete="name"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={setLoginVal}
                        required
                        autoComplete="email"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsOpen(!isOpen)}
                          className="flex items-center gap-1 px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all min-w-[90px]"
                        >
                          <span className="text-sm font-medium">{selectedCode.code}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 top-full left-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                            >
                              <div className="p-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-500 outline-none focus:border-blue-500/50"
                                  />
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto scrollbar-sleek">
                                {filteredOptions.map((country, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelect(country)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors"
                                  >
                                    <span className="font-medium text-white">{country.code}</span>
                                    <span className="text-gray-400">{country.country}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Phone Input */}
                      <div className="relative group flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone number"
                          value={signUpData.phone}
                          onChange={setLoginVal}
                          required
                          autoComplete="tel"
                          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={setLoginVal}
                        required
                        autoComplete="new-password"
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type={showConPassword ? "text" : "password"}
                        name="cpassword"
                        placeholder="Confirm your password"
                        value={signUpData.cpassword}
                        onChange={setLoginVal}
                        required
                        autoComplete="new-password"
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConPassword(!showConPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <FontAwesomeIcon icon={showConPassword ? faEyeSlash : faEye} className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 mt-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </motion.form>

                {/* Sign In Link */}
                <p className="text-center text-sm text-gray-400 mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-xs text-gray-600 mt-6"
            >
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-400 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-gray-400 transition-colors">
                Privacy Policy
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
