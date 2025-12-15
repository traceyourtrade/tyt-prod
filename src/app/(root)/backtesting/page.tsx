'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BacktestingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/backtesting/dashboard');
  }, [router]);
  
  return null;
}
