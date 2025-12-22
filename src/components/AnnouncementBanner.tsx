"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || "";

export default function AnnouncementBanner() {
    const [banner, setBanner] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        async function fetchBanner() {
            if (!ADMIN_API_URL) return;
            
            try {
                const res = await fetch(`${ADMIN_API_URL}/api/settings/banner`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data.active && data.banner) {
                    setBanner(data.banner);
                }
            } catch (error) {
                console.error("Failed to fetch banner:", error);
            }
        }
        fetchBanner();
    }, []);

    const showBanner = banner && !dismissed;

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    key="announcement-banner"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="relative bg-gradient-to-r from-[#0c1222]/90 via-[#0f1729]/90 to-[#0c1222]/90 backdrop-blur-xl border-b border-[#4EBF94]/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#4EBF94]/5 via-violet-500/5 to-blue-500/5" />
                        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#4EBF94] via-emerald-400 to-[#4EBF94]" />
                        <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-[#4EBF94]/10 to-transparent" />
                        
                        <div className="relative max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 lg:px-6 py-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-[#4EBF94]/20 to-emerald-500/10 flex items-center justify-center ring-1 ring-[#4EBF94]/30">
                                    <Sparkles className="w-3.5 h-3.5 text-[#4EBF94]" />
                                </div>
                                <p className="text-[13px] text-foreground/90 font-medium truncate">
                                    {banner}
                                </p>
                            </div>
                            
                            <motion.button
                                onClick={() => setDismissed(true)}
                                className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
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
