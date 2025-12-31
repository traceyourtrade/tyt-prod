'use client';

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'projournx_onboarding_completed';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="net-pnl"]',
    title: 'Net Profit & Loss',
    description: 'Track your total profit or loss across all selected accounts. The mini chart shows your cumulative performance over time.',
    position: 'bottom',
  },
  {
    target: '[data-tour="win-rate"]',
    title: 'Win Rate',
    description: 'See your success rate at a glance. The gauge shows wins (green) vs losses (red), with your total trade count below.',
    position: 'bottom',
  },
  {
    target: '[data-tour="profit-factor"]',
    title: 'Profit Factor',
    description: 'Measures your trading edge. Above 1.5 is good, above 2.0 is excellent. It\'s calculated as total wins divided by total losses.',
    position: 'bottom',
  },
  {
    target: '[data-tour="account-balance"]',
    title: 'Account Balance',
    description: 'Your current account value including all profits and losses from your trades. This updates automatically as you add trades.',
    position: 'bottom',
  },
  {
    target: '[data-tour="risk-reward"]',
    title: 'Risk : Reward Ratio',
    description: 'Compares your average win size to average loss size. A ratio of 1:2 means your average win is twice your average loss.',
    position: 'bottom',
  },
];

export function useOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompleted(completed === 'true');
    
    if (!completed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setIsOpen(true);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
    setIsOpen(false);
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
    setIsOpen(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompleted(false);
  }, []);

  return {
    isOpen,
    hasCompleted,
    startTour,
    completeTour,
    skipTour,
    resetTour,
  };
}
