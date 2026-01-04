"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, Loader2, Sparkles, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

const VerifyEmailScreen = () => {
  const [status, setStatus] = useState<'loading' | 'success'>('loading');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("pendingVerificationEmail");
    if (email) {
      setUserEmail(email);
    }
    
    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleResend = async () => {
    if (!userEmail) return;
    
    setResending(true);
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });
      if (response.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch (error) {
      console.error("Error resending verification:", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Main card */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-800/60 border border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Top gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500" />
          
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-emerald-500/[0.03] pointer-events-none" />
          
          <div className="relative p-8 sm:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">ProJournX</span>
              </div>
            </div>
            
            {/* Icon */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-blue-400" />
                </div>
                {status === 'success' && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Email Verification
            </h1>
            
            {/* Description */}
            <motion.p 
              key={status}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-zinc-400 text-center text-sm mb-8 max-w-[280px] mx-auto"
            >
              {status === 'loading' 
                ? "Sending verification email to your inbox..."
                : "Check your inbox or spam folder for the verification email"
              }
            </motion.p>
            
            {/* Status indicator */}
            <motion.div 
              layout
              className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                status === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-zinc-800/50 border-white/[0.06]'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                status === 'success' 
                  ? 'bg-emerald-500/20' 
                  : 'bg-zinc-700/50'
              }`}>
                {status === 'loading' ? (
                  <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
                ) : (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </motion.div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${
                  status === 'success' ? 'text-emerald-400' : 'text-zinc-300'
                }`}>
                  {status === 'loading' ? 'Sending Verification Email...' : 'Verification Email Sent!'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {status === 'loading' 
                    ? 'Please wait a moment' 
                    : 'Click the link in your email to verify'
                  }
                </p>
              </div>
            </motion.div>
            
            {/* Additional info */}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-white/[0.04]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <span className="text-amber-400 text-sm">!</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Didn't receive the email? Check your spam folder or request a new one.
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  {resent ? (
                    <span className="text-sm text-emerald-400 font-medium">Email sent!</span>
                  ) : (
                    <button 
                      onClick={handleResend}
                      disabled={resending || !userEmail}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      {resending ? 'Sending...' : 'Resend Email'}
                    </button>
                  )}
                  <span className="text-zinc-600">|</span>
                  <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs mt-6">
          Need help? Contact <a href="mailto:support@projournx.com" className="text-blue-400 hover:text-blue-300 transition-colors">support@projournx.com</a>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyEmailScreen;
