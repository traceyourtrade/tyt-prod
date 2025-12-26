'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SubscriptionGate from "@/components/subscription/SubscriptionGate";
import { Loader2 } from "lucide-react";

export default function BacktestingPage() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess);
          if (data.hasAccess) {
            router.replace('/backtesting/dashboard');
          }
        }
      } catch (err) {
        console.error("Failed to check access:", err);
      }
    };
    checkAccess();
  }, [router]);
  
  if (hasAccess === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (hasAccess) {
    return null;
  }
  
  return (
    <SubscriptionGate 
      featureName="Backtesting" 
      featureDescription="Practice trading on historical data with our full-screen TradingView-powered backtesting module."
    >
      <div />
    </SubscriptionGate>
  );
}
