'use client';

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'projournx_onboarding_completed';

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  isPro?: boolean;
}

export const platformTourSteps: TourStep[] = [
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Dashboard',
    description: 'Your trading command center. View your P&L, win rate, profit factor, and key performance metrics at a glance.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-daily-journal"]',
    title: 'Daily Journal',
    description: 'Log your trades with detailed notes, screenshots, and TradingView charts. Track your emotional state and review each trade.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-notebook"]',
    title: 'Notebook',
    description: 'Your personal trading notebook for market analysis, strategy notes, and pre-market plans using customizable templates.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-reports"]',
    title: 'Reports',
    description: 'Deep dive into your trading performance with detailed analytics, charts, and insights to identify patterns.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-strategies"]',
    title: 'Strategies',
    description: 'Document and track your trading strategies. See which setups are working best for you.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-playbook"]',
    title: 'Playbook',
    description: 'AI-powered pattern detection that builds your personal playbook of winning trade setups.',
    position: 'right',
    isPro: true,
  },
  {
    target: '[data-tour="nav-ai-analysis"]',
    title: 'AI Analysis',
    description: 'Advanced statistical analysis including streak patterns, risk metrics, time analysis, and trade correlations.',
    position: 'right',
    isPro: true,
  },
  {
    target: '[data-tour="nav-backtesting"]',
    title: 'Backtesting',
    description: 'Practice trading on historical data with our TradingView-powered replay simulator. Perfect your strategy risk-free.',
    position: 'right',
    isPro: true,
  },
  {
    target: '[data-tour="nav-resources"]',
    title: 'Resources',
    description: 'Educational hub with trading psychology tips, articles, and customizable trading routines.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-calculator"]',
    title: 'Lot Size Calculator',
    description: 'Calculate proper position sizes based on your risk tolerance and account size.',
    position: 'right',
  },
  {
    target: '[data-tour="add-trade-btn"]',
    title: 'Add Trade',
    description: 'Quickly log new trades from anywhere in the app. Import from your broker or add manually.',
    position: 'right',
  },
];

export const dashboardTourSteps = platformTourSteps;

export function useOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompleted(completed === 'true');
    
    if (!completed) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setIsOpen(true);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
    setIsOpen(false);
    setShowWelcome(false);
  }, []);

  const skipTour = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
    setIsOpen(false);
    setShowWelcome(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompleted(false);
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
  }, []);

  return {
    isOpen,
    showWelcome,
    hasCompleted,
    startTour,
    completeTour,
    skipTour,
    resetTour,
    dismissWelcome,
  };
}
