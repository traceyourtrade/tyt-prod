"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Lock, ChevronDown, Search, Eye, EyeOff, Loader2, Check, X } from "lucide-react";

type CountryCode = { country: string; code: string };

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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");

  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConPassword, setShowConPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);

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

  const signUpWithGoogle = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: "https://app.projournx.com/auth/google/callback",
  });

  const postSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

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

  const passwordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = passwordStrength(password);
  const passwordsMatch = password && cpassword && password === cpassword;

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  const handleClose = () => {
    router.push('/login');
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: '#101010',
        backgroundImage: `
          radial-gradient(ellipse 80% 80% at 70% 50%, rgba(59, 130, 246, 0.4), transparent),
          radial-gradient(ellipse 60% 60% at 85% 30%, rgba(139, 92, 246, 0.3), transparent),
          radial-gradient(ellipse 50% 80% at 80% 80%, rgba(59, 130, 246, 0.35), transparent)
        `
      }}
    >
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 80% at 70% 50%, rgba(59, 130, 246, 0.3), transparent),
            radial-gradient(ellipse 60% 60% at 85% 30%, rgba(139, 92, 246, 0.2), transparent)
          `,
          backgroundSize: '200% 200%',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-4 bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="flex p-1 bg-zinc-800/50 rounded-full">
            <div className="py-2 px-6 bg-zinc-700 rounded-full">
              <span className="text-sm font-medium text-white">Sign up</span>
            </div>
            <Link href="/login" className="py-2 px-6 rounded-full hover:bg-zinc-800/50 transition-colors">
              <span className="text-sm font-medium text-zinc-400">Sign in</span>
            </Link>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white text-center mt-6 mb-6">Create an account</h2>

        <form onSubmit={postSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); if (error) setError(""); }}
                required
                autoComplete="given-name"
                className="w-full py-3 px-4 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); if (error) setError(""); }}
                required
                autoComplete="family-name"
                className="w-full py-3 px-4 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              required
              autoComplete="email"
              className="w-full py-3 pl-11 pr-4 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 py-3 px-3 rounded-lg bg-zinc-800/50 border border-white/5 text-sm text-white hover:bg-zinc-800 transition-all min-w-[90px]"
              >
                <span>{selectedCode.code}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 left-0 mt-1 w-56 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden"
                  >
                    <div className="p-2 border-b border-white/5">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-zinc-800/50 border border-white/10 text-white placeholder:text-zinc-500 outline-none focus:border-white/20"
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
                          className="w-full flex items-center justify-between px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <span className="truncate">{c.country}</span>
                          <span className="text-zinc-500 ml-2">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative flex-1">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (error) setError(""); }}
                required
                autoComplete="tel"
                className="w-full py-3 pl-11 pr-4 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                required
                autoComplete="new-password"
                className="w-full py-3 pl-11 pr-11 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength ? strengthColors[strength - 1] : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500">
                  {strength > 0 ? strengthLabels[strength - 1] : 'Too weak'} password
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showConPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={cpassword}
                onChange={(e) => { setCpassword(e.target.value); if (error) setError(""); }}
                required
                autoComplete="new-password"
                className="w-full py-3 pl-11 pr-11 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConPassword(!showConPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showConPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {cpassword && (
              <div className="flex items-center gap-1 mt-1.5">
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
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
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
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading || !passwordsMatch}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 px-4 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create an account"
            )}
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">or sign in with</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        <div className="flex justify-center gap-3">
          <motion.button
            onClick={() => signUpWithGoogle()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 flex items-center justify-center rounded-lg bg-zinc-800 border border-white/5 hover:bg-zinc-700 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </motion.button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
            Terms & Service
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
