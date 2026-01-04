"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, X } from "lucide-react";
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

  const handleClose = () => {
    router.push('/');
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
            <Link href="/signup" className="py-2 px-6 rounded-full hover:bg-zinc-800/50 transition-colors">
              <span className="text-sm font-medium text-zinc-400">Sign up</span>
            </Link>
            <div className="py-2 px-6 bg-zinc-700 rounded-full">
              <span className="text-sm font-medium text-white">Sign in</span>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white text-center mt-6 mb-6">Welcome back</h2>

        <form onSubmit={postLoginDetails} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginData.email}
              onChange={handleInputChange}
              autoComplete="email"
              className="w-full py-3 pl-11 pr-4 text-sm rounded-lg bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-500 outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <Link href="/forgotpassword" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
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
          </div>

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
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 px-4 rounded-lg bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </motion.button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider">or sign in with</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        <motion.button
          onClick={() => logInWithGoogle()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 flex items-center justify-center gap-3 rounded-lg bg-zinc-800 border border-white/5 hover:bg-zinc-700 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-white">Google</span>
        </motion.button>

        <div className="mt-6 text-center">
          <p className="text-sm text-zinc-400">
            Don't have an account?{" "}
            <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
