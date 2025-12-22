"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";

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
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-gradient-to-r from-[#1FA4A5] to-[#50D1B2] text-white px-4 py-3"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Megaphone size={18} />
                            <p className="text-sm font-medium">{banner}</p>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
