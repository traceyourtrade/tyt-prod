"use client";

import { motion } from "framer-motion";
import { Eye, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DemoModeBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 lg:px-6 pt-4"
        >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 border border-violet-500/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-50" />
                
                <div className="relative flex items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Eye className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-violet-200">
                                Demo Mode
                            </p>
                            <p className="text-xs text-violet-300/70 hidden sm:block">
                                Explore the platform with sample data. Features are view-only.
                            </p>
                        </div>
                    </div>
                    
                    <Link 
                        href="/signup"
                        className="flex-shrink-0 group"
                    >
                        <motion.div
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Sign Up Free</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </motion.div>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
