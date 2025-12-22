"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        router.push(`/welcome/${data.name}`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck your Email & Password");
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries");
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

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Immersive Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#1e3a5f_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#0d4f4f_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a2e_0%,_transparent_70%)]" />
        </div>
        
        {/* Floating orbs */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 40, 0],
            x: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-600/15 blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10 blur-3xl"
        />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              width={48}
              height={48}
              src="/images/logo-dark.png"
              alt="ProJournX"
              className="w-12 h-12 object-contain"
              unoptimized
            />
          </motion.div>

          {/* Center content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-5xl xl:text-6xl font-light text-white leading-tight">
              Welcome
              <br />
              <span className="font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                back
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-sm leading-relaxed">
              Continue your trading journey and unlock insights that drive consistent profits.
            </p>
          </motion.div>

          {/* Bottom stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-8"
          >
            {[
              { value: "10K+", label: "Traders" },
              { value: "2M+", label: "Trades" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0a0a0f] p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
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
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-white mb-2">Sign in</h2>
            <p className="text-white/40">
              New to ProJournX?{" "}
              <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Google Button */}
          <motion.button
            onClick={logInWithGoogle}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors mb-8"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={postLoginDetails} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-white/60">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-white/60">Password</label>
                <Link href="/forgotpassword" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-white/30 mt-10">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-white/50 hover:text-white/70 transition-colors">
              Terms
            </Link>{" "}
            &{" "}
            <Link href="/privacy" className="text-white/50 hover:text-white/70 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
