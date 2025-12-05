"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Mail, Lock, ArrowRight, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

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
      console.log(data);
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
    <div className={`flex min-h-screen w-full bg-background ${inter.className}`}>
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent dark:from-primary/10 dark:via-primary/5 dark:to-transparent" />
        
        {/* Abstract Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-profit/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="mb-12">
            <Image
              width={280}
              height={70}
              src="/images/logo-dark.png"
              alt="ProJournX Logo"
              className="h-12 w-auto dark:block hidden"
            />
            <Image
              width={280}
              height={70}
              src="/images/logo-light.png"
              alt="ProJournX Logo"
              className="h-12 w-auto dark:hidden block"
            />
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6">
            Track. Analyze.
            <br />
            <span className="text-primary">Improve.</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md mb-12">
            Your professional trading journal to track performance, identify patterns, and become a consistently profitable trader.
          </p>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Performance Analytics</h3>
                <p className="text-sm text-muted-foreground">Deep insights into your trading</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-profit/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-profit" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Strategy Tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor what works best</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Visual Reports</h3>
                <p className="text-sm text-muted-foreground">Clear, actionable data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Image
              width={200}
              height={50}
              src="/images/logo-dark.png"
              alt="ProJournX Logo"
              className="h-10 w-auto dark:block hidden"
            />
            <Image
              width={200}
              height={50}
              src="/images/logo-light.png"
              alt="ProJournX Logo"
              className="h-10 w-auto dark:hidden block"
            />
          </div>

          {/* Form Card */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-10 shadow-xl shadow-black/5">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Welcome back
              </h2>
              <p className="text-muted-foreground">
                Sign in to continue to your journal
              </p>
            </div>

            <form onSubmit={postLoginDetails} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgotpassword"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-loss/10 border border-loss/20 text-loss text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={logInWithGoogle}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground hover:bg-muted hover:border-border transition-all"
              >
                <FontAwesomeIcon icon={faGoogle} className="w-5 h-5" />
                <span className="text-sm font-medium">Google</span>
              </button>

              <button
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground hover:bg-muted hover:border-border transition-all"
              >
                <FontAwesomeIcon icon={faApple} className="w-5 h-5" />
                <span className="text-sm font-medium">Apple</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-muted-foreground mt-8">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-muted-foreground transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
