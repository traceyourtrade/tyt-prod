'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import axios from "axios";
import { motion } from "framer-motion";
import { Phone, Lock, ChevronDown, Search, Loader2, Shield, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";

interface CountryPhoneCode {
  country: string;
  code: string;
}

interface SignUpData {
  fullName: string;
  phone: string;
  password: string;
  cpassword: string;
}

const countryPhoneCodes: CountryPhoneCode[] = [
  { country: "India", code: "+91" },
  { country: "United States", code: "+1" },
  { country: "United Kingdom", code: "+44" },
  { country: "Canada", code: "+1" },
  { country: "Australia", code: "+61" },
  { country: "Germany", code: "+49" },
  { country: "France", code: "+33" },
  { country: "Japan", code: "+81" },
  { country: "China", code: "+86" },
  { country: "Brazil", code: "+55" },
  { country: "South Africa", code: "+27" },
  { country: "Singapore", code: "+65" },
  { country: "United Arab Emirates", code: "+971" },
  { country: "Saudi Arabia", code: "+966" },
  { country: "Pakistan", code: "+92" },
  { country: "Bangladesh", code: "+880" },
  { country: "Sri Lanka", code: "+94" },
  { country: "Nepal", code: "+977" },
  { country: "Indonesia", code: "+62" },
  { country: "Malaysia", code: "+60" },
  { country: "Philippines", code: "+63" },
  { country: "Thailand", code: "+66" },
  { country: "Vietnam", code: "+84" },
  { country: "South Korea", code: "+82" },
  { country: "Mexico", code: "+52" },
  { country: "Russia", code: "+7" },
  { country: "Italy", code: "+39" },
  { country: "Spain", code: "+34" },
  { country: "Netherlands", code: "+31" },
  { country: "Sweden", code: "+46" },
  { country: "Norway", code: "+47" },
  { country: "Denmark", code: "+45" },
  { country: "Switzerland", code: "+41" },
  { country: "Belgium", code: "+32" },
  { country: "Austria", code: "+43" },
  { country: "Ireland", code: "+353" },
  { country: "New Zealand", code: "+64" },
  { country: "Nigeria", code: "+234" },
  { country: "Kenya", code: "+254" },
  { country: "Egypt", code: "+20" },
  { country: "Turkey", code: "+90" },
  { country: "Israel", code: "+972" },
  { country: "Poland", code: "+48" },
  { country: "Czech Republic", code: "+420" },
  { country: "Greece", code: "+30" },
  { country: "Portugal", code: "+351" },
  { country: "Argentina", code: "+54" },
  { country: "Chile", code: "+56" },
  { country: "Colombia", code: "+57" },
  { country: "Peru", code: "+51" },
];

const GoogleSignUp = () => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CountryPhoneCode>({ code: "+91", country: "India" });
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = countryPhoneCodes.filter(country =>
    country.country.toLowerCase().includes(search.toLowerCase()) || country.code.includes(search)
  ).filter(country => country.code !== selectedCode.code);

  const handleSelect = (country: CountryPhoneCode) => {
    setSelectedCode(country);
    setIsOpen(false);
    setSearch("");
  };

  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    phone: "",
    password: "",
    cpassword: "",
  });

  const [email, setEmail] = useState("Email");
  const [fName, setFname] = useState("");
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRef = localStorage.getItem('affiliate_ref');
      const storedCoupon = localStorage.getItem('affiliate_coupon');
      if (storedRef) setReferralCode(storedRef);
      if (storedCoupon) setCouponCode(storedCoupon);
    }
  }, []);

  const setLoginVal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData({ ...signUpData, [name]: value });
    if (error) setError("");
  };

  const postSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { phone, password, cpassword } = signUpData;

    try {
      const res = await fetch(`/api/registerggl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, fullName: fName, phone, password, cpassword, countryCode: selectedCode.code, country: selectedCode.country,
          referralCode: referralCode || undefined, couponCode: couponCode || undefined
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        router.push(`/welcome/${data.name}`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck");
        } else if (data.error === "Enter all the details") {
          setError("Please fill in all fields");
        } else if (data.error === "email already registered") {
          setError("Email already registered. Please login instead.");
        } else if (data.error === "Passwords doesnt match") {
          setError("Passwords don't match");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) return;

    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    axios.post(`/api/registerggl-getmail`, { code }, { headers: { 'Content-Type': 'application/json' } })
      .then(response => {
        if (response.data.msg === "unregistered user") {
          setEmail(response.data.email);
          setFname(response.data.name);
          setShow(true);
          Cookies.set('google_token', response.data.access_token, { secure: true, sameSite: 'strict' });
        } else if (response.data.msg === "registered user") {
          router.push(`/welcome/${response.data.name}`);
        }
      })
      .catch(err => {
        if (!axios.isCancel(err)) {
          console.error('Authentication failed:', err);
        }
      });
  }, [router]);

  return (
    <>
      {show ? (
        <div className="min-h-screen w-full bg-[#060914] flex items-center justify-center p-4 overflow-hidden relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/25 via-blue-500/15 to-transparent rounded-full blur-[120px]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-[100px]" 
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 0.4 }}
              className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-gradient-to-l from-violet-500/15 to-transparent rounded-full blur-[80px]" 
            />
          </div>

          {/* Noise Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
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

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-transparent to-emerald-500/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative">
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl blur-xl opacity-40" />
                    <Image
                      width={56}
                      height={56}
                      src="/images/logo-dark.png"
                      alt="ProJournX"
                      className="relative w-14 h-14 object-contain"
                      unoptimized
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl font-bold text-white mb-2">Complete Your Account</h1>
                  <p className="text-slate-400 text-sm">Just a few more details to get started</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" />
                  </div>
                </motion.div>

                {/* User Info Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5 mb-6"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                    {fName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{fName}</p>
                    <p className="text-slate-400 text-xs truncate">{email}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                </motion.div>

                {/* Form */}
                <form onSubmit={postSignUp} className="space-y-4">
                  {/* Phone Number */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsOpen(!isOpen)}
                          className={`flex items-center gap-2 px-3 py-3.5 bg-slate-800/60 border rounded-xl text-white text-sm transition-all duration-200 min-w-[100px] ${
                            isOpen ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <span className="font-medium">{selectedCode.code}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="p-2 border-b border-white/5">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-white/5 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredOptions.map((country, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelect(country)}
                                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-700/50 transition-colors text-left"
                                >
                                  <span className="text-sm text-white">{country.country}</span>
                                  <span className="text-sm text-slate-400">{country.code}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Phone Input */}
                      <div className="flex-1 relative">
                        <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "phone" ? "text-blue-400" : "text-slate-500"}`} />
                        <input
                          type="tel"
                          name="phone"
                          required
                          placeholder="Phone number"
                          value={signUpData.phone}
                          onChange={setLoginVal}
                          onFocus={() => setFocusedField("phone")}
                          onBlur={() => setFocusedField(null)}
                          className={`w-full pl-10 pr-4 py-3.5 bg-slate-800/60 border rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none transition-all duration-200 ${
                            focusedField === "phone" ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/10 hover:border-white/20"
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "password" ? "text-blue-400" : "text-slate-500"}`} />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={setLoginVal}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-12 py-3.5 bg-slate-800/60 border rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none transition-all duration-200 ${
                          focusedField === "password" ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/10 hover:border-white/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "cpassword" ? "text-blue-400" : "text-slate-500"}`} />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="cpassword"
                        required
                        placeholder="Confirm your password"
                        value={signUpData.cpassword}
                        onChange={setLoginVal}
                        onFocus={() => setFocusedField("cpassword")}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full pl-10 pr-12 py-3.5 bg-slate-800/60 border rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none transition-all duration-200 ${
                          focusedField === "cpassword" ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-white/10 hover:border-white/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                      <p className="text-red-400 text-sm text-center">{error}</p>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full group mt-6"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl blur opacity-40 group-hover:opacity-60 transition duration-200" />
                    <div className="relative flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl text-white font-semibold transition-all duration-200 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Setup</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </motion.button>
                </form>

                {/* Security Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="flex items-center justify-center gap-2 mt-6 text-slate-500 text-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Your data is protected with bank-grade encryption</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <Authenticating />
      )}
    </>
  );
};

export default GoogleSignUp;

const Authenticating = () => {
  return (
    <div className="min-h-screen w-full bg-[#060914] flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-blue-600/20 to-transparent rounded-full blur-[100px]" 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/15 to-transparent rounded-full blur-[80px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full blur-xl opacity-40" />
          <div className="relative w-16 h-16 mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-full h-full rounded-full border-2 border-transparent border-t-blue-500 border-r-emerald-500"
            />
            <div className="absolute inset-2 rounded-full bg-slate-900/80 flex items-center justify-center">
              <Image
                width={28}
                height={28}
                src="/images/logo-dark.png"
                alt="ProJournX"
                className="w-7 h-7 object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
        <p className="text-slate-300 font-medium">Authenticating...</p>
        <p className="text-slate-500 text-sm mt-1">Please wait while we verify your account</p>
      </motion.div>
    </div>
  );
};
