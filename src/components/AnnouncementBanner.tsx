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
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        icon: CheckCircle,
        iconColor: "text-emerald-400",
        iconBg: "from-emerald-500 to-emerald-600",
        titleColor: "text-emerald-300",
        textColor: "text-emerald-200/80"
    },
    info: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        icon: Info,
        iconColor: "text-blue-400",
        iconBg: "from-blue-500 to-blue-600",
        titleColor: "text-blue-300",
        textColor: "text-blue-200/80"
    },
    warning: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        icon: AlertTriangle,
        iconColor: "text-amber-400",
        iconBg: "from-amber-500 to-amber-600",
        titleColor: "text-amber-300",
        textColor: "text-amber-200/80"
    },
    urgent: {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: AlertOctagon,
        iconColor: "text-red-400",
        iconBg: "from-red-500 to-red-600",
        titleColor: "text-red-300",
        textColor: "text-red-200/80"
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
                            <div className={`relative overflow-hidden rounded-xl ${style.bg} border ${style.border} backdrop-blur-sm`}>
                                <div className="relative flex items-start justify-between gap-3 px-4 py-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${style.iconBg} flex items-center justify-center shadow-lg mt-0.5`}>
                                            <Icon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-semibold ${style.titleColor}`}>
                                                {announcement.title}
                                            </p>
                                            <p className={`text-sm mt-1 ${style.textColor}`}>
                                                {announcement.message}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <motion.button
                                        onClick={() => dismissAnnouncement(announcement.id)}
                                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-200"
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
