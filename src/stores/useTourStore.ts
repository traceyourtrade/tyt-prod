'use client';

import { create } from 'zustand';

interface TourStore {
  isOpen: boolean;
  showWelcome: boolean;
  hasCompleted: boolean;
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
  resetTour: () => void;
  dismissWelcome: () => void;
  setShowWelcome: (show: boolean) => void;
  initFromStorage: () => void;
}

const ONBOARDING_KEY = 'projournx_onboarding_completed';

export const useTourStore = create<TourStore>((set) => ({
  isOpen: false,
  showWelcome: false,
  hasCompleted: true,

  startTour: () => set({ showWelcome: false, isOpen: true }),

  completeTour: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    set({ hasCompleted: true, isOpen: false, showWelcome: false });
  },

  skipTour: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    set({ hasCompleted: true, isOpen: false, showWelcome: false });
  },

  resetTour: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ONBOARDING_KEY);
    }
    set({ hasCompleted: false });
  },

  dismissWelcome: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    set({ showWelcome: false, hasCompleted: true });
  },

  setShowWelcome: (show: boolean) => set({ showWelcome: show }),

  initFromStorage: () => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(ONBOARDING_KEY);
      const hasCompleted = completed === 'true';
      set({ hasCompleted });
      if (!hasCompleted) {
        setTimeout(() => {
          set({ showWelcome: true });
        }, 1000);
      }
    }
  },
}));
