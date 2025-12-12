"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WelcomePage() {
    const router = useRouter();
    const params = useParams();
    const [mounted, setMounted] = useState(false);

    const name = decodeURIComponent(params.fullName as string);
    const firstName = name.split(' ')[0];

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const getFormattedDate = () => {
        return new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => {
            router.push("/");
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    if (!mounted) return null;

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#0a0a0a] overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                
                <motion.div 
                    className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"
                    animate={{ 
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{ 
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div 
                    className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]"
                    animate={{ 
                        x: [0, -30, 0],
                        y: [0, 20, 0],
                    }}
                    transition={{ 
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]"
                    animate={{ 
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo - Always show dark version (white text) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Image
                        src="/images/logo-dark.png"
                        width={180}
                        height={50}
                        alt="ProJournX"
                        loading="eager"
                        priority
                        className="h-12 w-auto object-contain mb-12"
                    />
                </motion.div>

                {/* Glassmorphic Card - Dark themed */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={cn(
                        "relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center",
                        "bg-white/5 backdrop-blur-xl border border-white/10",
                        "shadow-2xl shadow-black/30"
                    )}
                >
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                        {/* Date */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center justify-center gap-2 text-gray-400 text-sm"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{getFormattedDate()}</span>
                        </motion.div>

                        {/* Greeting */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white"
                        >
                            {getTimeBasedGreeting()},{" "}
                            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                                {firstName}
                            </span>
                        </motion.h1>

                        {/* Subtext */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="text-lg sm:text-xl text-gray-400 flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            How are you doing today?
                        </motion.p>
                    </div>
                </motion.div>

                {/* Loading indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-8 flex flex-col items-center gap-3"
                >
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary/60"
                                animate={{ 
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-400">
                        Taking you to your dashboard...
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
