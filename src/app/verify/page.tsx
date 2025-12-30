"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Mail,
} from "lucide-react";
import Link from "next/link";

// stores
import { useDataStore as store } from "@/store/store";

const VerifyContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const router = useRouter();

  const [status, setStatus] = useState<
    "initiating" | "progress" | "success" | "error"
  >("initiating");
  const [progress, setProgress] = useState(0);

  const sendVerify = async () => {
    if (!token) {
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(`api/verify-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.status === 200) {
        setStatus("success");
        setProgress(100);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  useEffect(() => {
    // Step-based animation logic
    const sequence = async () => {
      // Initial delay
      await new Promise((r) => setTimeout(r, 800));

      // Step 1: Initiating
      setStatus("initiating");
      setProgress(30);

      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: Progress
      setStatus("progress");
      setProgress(60);

      await new Promise((r) => setTimeout(r, 1500));

      // Step 3: Trigger actual verification
      await sendVerify();
    };

    sequence();
  }, [token]);

  const steps = [
    { key: "initiating", label: "Verification Initiated", icon: Shield },
    { key: "progress", label: "We're in Progress", icon: Loader2 },
    { key: "success", label: "Email Verified", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Main card */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/50">
          {/* Top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 bg-[length:200%_auto] animate-gradient" />

          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link href="/">
                <img
                  src="https://www.projournx.com/images/logo-dark.png"
                  alt="ProJournX"
                  className="h-8 auto"
                />
              </Link>
            </div>

            {/* Status Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <motion.div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-colors duration-500 ${
                    status === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : status === "error"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-blue-500/10 border-blue-500/20"
                  } border`}
                  animate={status === "progress" ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {status === "success" ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  ) : status === "error" ? (
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  ) : (
                    <Shield className="w-12 h-12 text-blue-500" />
                  )}
                </motion.div>

                {status === "success" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-zinc-900"
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-white mb-2">
                {status === "success"
                  ? "Verification Complete!"
                  : status === "error"
                    ? "Verification Failed"
                    : "Email Verification"}
              </h1>
              <p className="text-zinc-400 text-sm">
                {status === "success"
                  ? "Your account is now fully verified and ready to use."
                  : status === "error"
                    ? "Something went wrong. The link might be expired."
                    : "Please wait while we secure your account..."}
              </p>
            </div>

            {/* Progress Checklist */}
            <div className="space-y-0 mb-10">
              {steps.map((step, idx) => {
                const isCompleted =
                  status === "success" ||
                  (status === "progress" && idx < 1) ||
                  (status === "initiating" && idx === 0 && progress > 50);
                const isActive =
                  status === step.key || (status === "progress" && idx === 1);
                const isTubeFilled =
                  (status === "success" && idx < 2) ||
                  (status === "progress" && idx === 0);

                return (
                  <div key={step.key} className="relative">
                    <div className="flex items-center gap-6">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                            : isActive
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                              : "bg-zinc-800/50 border-white/5 text-zinc-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : isActive ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <step.icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-base font-semibold transition-colors duration-300 ${
                            isCompleted
                              ? "text-emerald-400"
                              : isActive
                                ? "text-blue-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>

                    {/* Vertical Progress Tube */}
                    {idx < steps.length - 1 && (
                      <div className="ml-[22px] my-1.5 h-10 w-[3px] bg-zinc-800/50 rounded-full relative overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: isTubeFilled ? "100%" : "0%" }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                          className="absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 to-emerald-500 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Area */}
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
                  >
                    Go to Login
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : (
                status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3.5 rounded-2xl transition-all border border-white/5"
                    >
                      Try Again
                    </button>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Support Link */}
        <p className="text-center text-zinc-600 text-xs mt-8">
          Need help? Contact{" "}
          <a
            href="mailto:support@projournx.com"
            className="hover:text-zinc-400 transition-colors"
          >
            support@projournx.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

const Verifyemail = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
};

export default Verifyemail;
