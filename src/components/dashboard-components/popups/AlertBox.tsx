'use client';

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import notifications from "@/store/notifications";
import { cn } from "@/lib/utils";

const AlertBox = () => {
    const { alertType, alertBoxG, setAlertBoxG, polling } = notifications();

    const isVisible = alertType && alertBoxG;

    const getConfig = () => {
        switch (alertType) {
            case "success":
                return {
                    icon: CheckCircle,
                    iconColor: "text-emerald-500",
                    bgColor: "bg-emerald-500/10",
                    borderColor: "border-emerald-500/30",
                    accentColor: "bg-emerald-500",
                    title: "Success"
                };
            case "error":
                return {
                    icon: AlertCircle,
                    iconColor: "text-red-500",
                    bgColor: "bg-red-500/10",
                    borderColor: "border-red-500/30",
                    accentColor: "bg-red-500",
                    title: "Error"
                };
            case "warning":
                return {
                    icon: AlertTriangle,
                    iconColor: "text-amber-500",
                    bgColor: "bg-amber-500/10",
                    borderColor: "border-amber-500/30",
                    accentColor: "bg-amber-500",
                    title: "Warning"
                };
            default:
                return {
                    icon: Info,
                    iconColor: "text-blue-500",
                    bgColor: "bg-blue-500/10",
                    borderColor: "border-blue-500/30",
                    accentColor: "bg-blue-500",
                    title: "Info"
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;
    const duration = alertType === "async-alert" && polling ? 12 : 5;

    useEffect(() => {
        if (isVisible && alertType !== "async-alert") {
            const timer = setTimeout(() => {
                setAlertBoxG(null, null);
            }, duration * 1000 + 500);
            return () => clearTimeout(timer);
        }
    }, [alertType, alertBoxG, isVisible, setAlertBoxG, duration]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                        "fixed z-50 top-20 right-5 w-80",
                        "bg-card/95 backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden",
                        config.borderColor
                    )}
                >
                    <div className={cn("absolute top-0 left-0 right-0 h-1", config.accentColor)} />
                    
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                config.bgColor
                            )}>
                                <Icon className={cn("w-5 h-5", config.iconColor)} />
                            </div>
                            
                            <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-semibold text-foreground mb-0.5">
                                    {config.title}
                                </p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {alertBoxG}
                                </p>
                            </div>
                            
                            <button
                                onClick={() => setAlertBoxG(null, null)}
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative h-1 bg-muted/50">
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: duration, ease: "linear" }}
                            className={cn("absolute inset-y-0 left-0", config.accentColor)}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AlertBox;
