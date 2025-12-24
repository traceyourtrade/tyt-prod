"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Wrench } from "lucide-react";

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

export default function AnnouncementBanner() {
    const [banner, setBanner] = useState<string | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        async function fetchBanner() {
            // Skip if no admin API URL configured
            if (!ADMIN_API_URL || ADMIN_API_URL.trim() === '') return;
            
            try {
                const res = await fetch(`${ADMIN_API_URL}/api/settings/banner`);
                if (!res.ok) return; // Silently fail if endpoint not available
                const data = await res.json();
                
                if (data.maintenanceMode) {
                    setMaintenanceMode(true);
                } else if (data.active && data.banner) {
                    setBanner(data.banner);
                }
            } catch {
                // Silently fail - banner is optional
            }
        }
        fetchBanner();
    }, []);

    if (maintenanceMode) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#060914] flex items-center justify-center">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px]" />
                </div>
                
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative text-center px-6"
                >
                    <motion.div 
                        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center border border-amber-500/30 shadow-2xl shadow-amber-500/10"
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Wrench className="w-12 h-12 text-amber-400" />
                    </motion.div>
                    
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                        Under Maintenance
                    </h1>
                    <p className="text-gray-400 max-w-md text-lg leading-relaxed">
                        We're performing scheduled maintenance to improve your experience. 
                        Please check back shortly.
                    </p>
                    
                    <motion.div 
                        className="mt-8 flex items-center justify-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-sm text-amber-400/80 font-medium">Working on it...</span>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    const showBanner = banner && !dismissed;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    key="announcement-banner"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="px-4 lg:px-6 pt-4"
                >
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#4EBF94]/10 via-emerald-500/5 to-violet-500/10 border border-[#4EBF94]/20 backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4EBF94]/5 to-transparent opacity-50" />
                        
                        <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#4EBF94] to-emerald-600 flex items-center justify-center shadow-lg shadow-[#4EBF94]/20">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                                <p className="text-sm text-foreground font-medium">
                                    {banner}
                                </p>
                            </div>
                            
                            <motion.button
                                onClick={() => setDismissed(true)}
                                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
