"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const Verifyemail = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('t');
  const router = useRouter();

  const [verified, setVerified] = useState(false);
  const [err, setErr] = useState("");
  const [step, setStep] = useState(1);

  const sendVerify = async () => {
    try {
      const res = await fetch(`/api/verify-mail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      });

      const data = await res.json();

      if (res.status === 200) {
        setVerified(true);
      } else {
        if (data.error) {
          setErr("Some problem occurred while verifying your email. Please try again later.");
        }
      }
    } catch (error) {
      setErr("Connection error. Please try again.");
    }
  };

  useEffect(() => {
    sendVerify();

    setTimeout(() => setStep(2), 800);
    setTimeout(() => setStep(3), 1600);
  }, []);

  const navigateToLogin = () => {
    router.push("/login");
  };

  const steps = [
    { id: 1, label: "Verification Initiated" },
    { id: 2, label: "We're in Progress" },
    { id: 3, label: "Email Verified" },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050508] relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0c1222] to-[#050508]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(56,189,248,0.15),transparent)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(34,211,238,0.12),transparent)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(139,92,246,0.08),transparent)]" />
      </div>

      {/* Floating orbs */}
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

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent border border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Top gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
          
          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image 
                src="/images/logo-icon.png"
                alt="ProJournX Logo" 
                width={60} 
                height={60}
                className="rounded-xl"
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Email Verification
            </h1>
            <p className="text-zinc-400 text-center text-sm mb-8">
              {err ? err : "Verifying your email..."}
            </p>

            {/* Progress Steps */}
            <div className="space-y-0 mb-8">
              {steps.map((s, index) => (
                <div key={s.id}>
                  <motion.div 
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: step >= s.id ? 1 : 0.5 }}
                    className="flex items-center gap-4"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step >= s.id 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25' 
                        : 'bg-zinc-800 border border-zinc-700'
                    }`}>
                      {step >= s.id ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                      )}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      step >= s.id ? 'text-white' : 'text-zinc-500'
                    }`}>
                      {s.label}
                    </span>
                  </motion.div>
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="ml-[15px] h-8 w-0.5 bg-zinc-800 relative overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: step > s.id ? '100%' : 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute top-0 left-0 w-full bg-gradient-to-b from-cyan-500 to-blue-600"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Login Button */}
            {verified ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={navigateToLogin}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Continue to Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 text-zinc-500 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </button>
            )}

            {/* Error message */}
            {err && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-red-400 text-sm"
              >
                {err}
              </motion.p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-6">
          Need help? Contact <a href="mailto:support@projournx.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">support@projournx.com</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Verifyemail;
