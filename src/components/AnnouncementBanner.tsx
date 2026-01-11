"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Wrench, Info, AlertTriangle, CheckCircle, AlertOctagon } from "lucide-react";

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "urgent";
    createdAt: string;
}

const typeStyles = {
    success: {
        wrapper: "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/15 dark:to-green-500/10 border-emerald-200 dark:border-emerald-500/30",
        iconWrapper: "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25",
        icon: CheckCircle,
        title: "text-emerald-800 dark:text-emerald-300",
        message: "text-emerald-700 dark:text-emerald-200/80",
        closeBtn: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-white dark:hover:bg-emerald-500/20"
    },
    info: {
        wrapper: "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/15 dark:to-indigo-500/10 border-blue-200 dark:border-blue-500/30",
        iconWrapper: "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25",
        icon: Info,
        title: "text-blue-800 dark:text-blue-300",
        message: "text-blue-700 dark:text-blue-200/80",
        closeBtn: "text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-500/20"
    },
    warning: {
        wrapper: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/15 dark:to-orange-500/10 border-amber-200 dark:border-amber-500/30",
        iconWrapper: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/25",
        icon: AlertTriangle,
        title: "text-amber-800 dark:text-amber-300",
        message: "text-amber-700 dark:text-amber-200/80",
        closeBtn: "text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:text-white dark:hover:bg-amber-500/20"
    },
    urgent: {
        wrapper: "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/15 dark:to-rose-500/10 border-red-200 dark:border-red-500/30",
        iconWrapper: "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25",
        icon: AlertOctagon,
        title: "text-red-800 dark:text-red-300",
        message: "text-red-700 dark:text-red-200/80",
        closeBtn: "text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-500/20"
    }
};

export default function AnnouncementBanner() {
    const [banner, setBanner] = useState<string | null>(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const stored = localStorage.getItem("dismissedAnnouncements");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setDismissedIds(new Set(parsed));
            } catch {
                setDismissedIds(new Set());
            }
        }

        async function fetchBanner() {
            if (!ADMIN_API_URL || ADMIN_API_URL.trim() === '') return;
            
            try {
                const res = await fetch(`${ADMIN_API_URL}/api/settings/banner`);
                if (!res.ok) return;
                const data = await res.json();
                
                if (data.maintenanceMode) {
                    setMaintenanceMode(true);
                } else if (data.active && data.banner) {
                    setBanner(data.banner);
                }
            } catch {
            }
        }

        async function fetchAnnouncements() {
            try {
                const res = await fetch("/api/announcements");
                const data = await res.json();
                setAnnouncements(data.announcements || []);
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            }
        }

        fetchBanner();
        fetchAnnouncements();
    }, []);

    const dismissAnnouncement = (id: string) => {
        const newDismissed = new Set(dismissedIds);
        newDismissed.add(id);
        setDismissedIds(newDismissed);
        localStorage.setItem("dismissedAnnouncements", JSON.stringify([...newDismissed]));
    };

    const visibleAnnouncements = announcements.filter(ann => !dismissedIds.has(ann.id));

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
    const hasContent = showBanner || visibleAnnouncements.length > 0;

    if (!hasContent) return null;

    return (
        <div className="px-4 lg:px-6 pt-4 space-y-3">
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        key="announcement-banner"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#4EBF94]/15 dark:via-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-[#4EBF94]/30">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(78,191,148,0.05)_50%,transparent_100%)]" />
                            
                            <div className="relative flex items-center justify-between gap-4 px-4 py-3.5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#4EBF94] to-emerald-600 flex items-center justify-center shadow-lg shadow-[#4EBF94]/25">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-sm text-emerald-800 dark:text-emerald-100 font-medium leading-relaxed">
                                        {banner}
                                    </p>
                                </div>
                                
                                <motion.button
                                    onClick={() => setDismissed(true)}
                                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:text-white dark:hover:bg-emerald-500/20 transition-all duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {visibleAnnouncements.map((announcement) => {
                    const style = typeStyles[announcement.type] || typeStyles.info;
                    const Icon = style.icon;

                    return (
                        <motion.div
                            key={announcement.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            <div className={`relative overflow-hidden rounded-xl border ${style.wrapper}`}>
                                <div className="relative flex items-start justify-between gap-4 px-4 py-3.5">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${style.iconWrapper} flex items-center justify-center shadow-lg mt-0.5`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="min-w-0 pt-0.5">
                                            <p className={`text-sm font-semibold ${style.title}`}>
                                                {announcement.title}
                                            </p>
                                            <p className={`text-sm mt-1 leading-relaxed ${style.message}`}>
                                                {announcement.message}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <motion.button
                                        onClick={() => dismissAnnouncement(announcement.id)}
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${style.closeBtn}`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <X className="w-4 h-4" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
