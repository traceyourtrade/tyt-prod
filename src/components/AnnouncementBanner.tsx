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
