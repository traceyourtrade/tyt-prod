"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";

const Verifyemail = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState(1);
  const hasRun = useRef(false);

  const sendVerify = async () => {
    if (!token) {
      setStatus('error');
      setErrorMessage("No verification token provided. Please use the link from your email.");
      return;
    }

    try {
      setStep(1);
      
      const res = await fetch(`/api/verify-mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      setStep(2);

      if (res.status === 200) {
        setStep(3);
        setStatus('success');
        localStorage.removeItem("pendingVerificationEmail");
        setTimeout(() => {
          router.push("/checkout");
        }, 2000);
      } else if (res.status === 401) {
        setStatus('error');
        if (data.error?.includes('expired')) {
          setErrorMessage("Your verification link has expired. Please request a new one.");
        } else {
          setErrorMessage("Invalid verification link. Please request a new one.");
        }
      } else if (res.status === 400 && data.message?.includes('already verified')) {
        setStep(3);
        setStatus('success');
        setTimeout(() => {
          router.push("/checkout");
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || data.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage("Connection error. Please check your internet and try again.");
    }
  };

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      sendVerify();
    }
  }, []);

  const steps = [
    { id: 1, label: "Verification Initiated" },
    { id: 2, label: "Processing" },
    { id: 3, label: "Email Verified" },
  ];

  const getStepState = (stepId: number) => {
    if (status === 'error') {
      if (stepId <= step) return 'error';
      return 'pending';
    }
    if (stepId <= step) return 'complete';
    return 'pending';
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] relative overflow-hidden p-4">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0c1222] to-[#050508]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(56,189,248,0.15),transparent)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(34,211,238,0.12),transparent)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(139,92,246,0.08),transparent)]" />
      </div>

      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-violet-500/15 to-purple-500/10 rounded-full blur-3xl"
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40">
          <div className={`h-1 ${status === 'error' ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500' : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500'}`} />

          <div className="p-8 sm:p-10">
            <div className="flex justify-center mb-8">
              <Image
                src="/images/logo-icon.png"
                alt="ProJournX Logo"
                width={60}
                height={60}
                className="rounded-xl"
              />
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Email Verification
            </h1>
            <p className="text-zinc-400 text-center text-sm mb-8">
              {status === 'loading' && "Verifying your email..."}
              {status === 'success' && "Your email has been verified!"}
              {status === 'error' && errorMessage}
            </p>

            <div className="space-y-0 mb-8">
              {steps.map((s, index) => {
                const state = getStepState(s.id);
                return (
                  <div key={s.id}>
                    <motion.div
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: state !== 'pending' ? 1 : 0.5 }}
                      className="flex items-center gap-4"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          state === 'complete'
                            ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25"
                            : state === 'error'
                            ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/25"
                            : "bg-zinc-800 border border-zinc-700"
                        }`}
                      >
                        {state === 'complete' ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : state === 'error' ? (
                          <XCircle className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-zinc-600" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium transition-colors ${
                          state === 'complete' ? "text-white" 
                          : state === 'error' ? "text-red-400"
                          : "text-zinc-500"
                        }`}
                      >
                        {s.label}
                      </span>
                    </motion.div>

                    {index < steps.length - 1 && (
                      <div className="ml-[15px] h-8 w-0.5 bg-zinc-800 relative overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: step > s.id ? "100%" : 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className={`absolute top-0 left-0 w-full ${
                            status === 'error' 
                              ? "bg-gradient-to-b from-red-500 to-red-600" 
                              : "bg-gradient-to-b from-cyan-500 to-blue-600"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to checkout...
              </motion.div>
            )}

            {status === 'loading' && (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 text-zinc-500 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </button>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Login to Request New Email
                </Link>
                <p className="text-xs text-zinc-500 text-center">
                  Login with your credentials and we'll send you a new verification link
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Need help? Contact{" "}
          <a
            href="mailto:support@projournx.com"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            support@projournx.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Verifyemail;
