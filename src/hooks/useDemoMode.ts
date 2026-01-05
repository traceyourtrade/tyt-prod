"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";

export function useDemoMode() {
    const [isDemoMode, setIsDemoMode] = useState(false);
    
    useEffect(() => {
        const userId = Cookies.get("userId");
        setIsDemoMode(userId === "demo-user");
    }, []);
    
    return isDemoMode;
}

export function getDemoModeFromCookie(): boolean {
    if (typeof window === "undefined") return false;
    const userId = Cookies.get("userId");
    return userId === "demo-user";
}
