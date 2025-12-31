'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Crown, Rocket, BookOpen, BarChart3, Target } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  isPro?: boolean;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onStartTour,
  onSkip,
}) => {
  if (!isOpen) return null;

  const features = [
    { icon: BookOpen, title: 'Trade Journal', desc: 'Log and analyze every trade' },
    { icon: BarChart3, title: 'Performance Analytics', desc: 'Track your progress over time' },
    { icon: Target, title: 'Strategy Tracking', desc: 'Find what works best for you' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onSkip}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent" />
          
          <div className="relative p-6">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 10 }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25"
              >
                <Rocket className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            <h2 className="text-2xl font-bold text-center text-foreground mb-2">
              Welcome to ProJournX!
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              Your professional trading journal. Let us show you around.
            </p>

            <div className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <feature.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onStartTour}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Take a Quick Tour
              </button>
              <button
                onClick={onSkip}
                className="w-full py-2.5 px-4 text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps,
  onComplete,
  onSkip,
  isOpen,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const currentStepData = steps[currentStep];
  const currentSelector = currentStepData?.target;

  const expandBacktestingIfNeeded = useCallback(() => {
    if (!currentSelector?.includes('backtesting')) return;
    
    const accordionTrigger = document.querySelector('[data-tour="nav-backtesting"]');
    if (accordionTrigger) {
      const button = accordionTrigger.querySelector('button');
      if (button) {
        const isExpanded = button.getAttribute('data-state') === 'open';
        if (!isExpanded) {
          button.click();
        }
      }
    }
  }, [currentSelector]);

  const findAndMeasureElement = useCallback(() => {
    if (!currentSelector) return null;

    expandBacktestingIfNeeded();

    const element = document.querySelector(currentSelector);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    // Check if element is reasonably visible (at least partially in viewport)
    const isPartiallyVisible = 
      rect.bottom > 0 && 
      rect.top < window.innerHeight && 
      rect.right > 0 && 
      rect.left < window.innerWidth;
    
    if (!isPartiallyVisible) {
      // Element is completely off-screen, scroll it into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      // Return null to retry after scroll animation
      return null;
    }

    return rect;
  }, [currentSelector, expandBacktestingIfNeeded]);

  const startPolling = useCallback(() => {
    setIsReady(false);
    setTargetRect(null);

    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 50;

    const poll = () => {
      attempts++;
      const rect = findAndMeasureElement();
      
      if (rect) {
        setTargetRect(rect);
        setIsReady(true);
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }
      } else if (attempts >= maxAttempts) {
        setIsReady(true);
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current);
          retryIntervalRef.current = null;
        }
        console.warn(`Tour: Could not find element "${currentSelector}" after ${maxAttempts} attempts`);
      }
    };

    poll();
    retryIntervalRef.current = setInterval(poll, 100);

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
    };
  }, [currentSelector, findAndMeasureElement]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setTargetRect(null);
      setIsReady(false);
      return;
    }

    const cleanup = startPolling();
    return cleanup;
  }, [isOpen, currentStep, startPolling]);

  useEffect(() => {
    if (!isOpen || !isReady || !currentSelector) return;

    const handleUpdate = () => {
      const rect = findAndMeasureElement();
      if (rect) {
        setTargetRect(rect);
      }
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    observerRef.current = new MutationObserver(handleUpdate);
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-state']
    });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      observerRef.current?.disconnect();
    };
  }, [isOpen, isReady, currentSelector, findAndMeasureElement]);

  useEffect(() => {
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
      observerRef.current?.disconnect();
    };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = useCallback(() => {
    if (!targetRect) {
      return { 
        top: '50%', 
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
    
    const position = currentStepData?.position || 'right';
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;

    let top: number;
    let left: number;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
      default:
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
    }

    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform: 'none'
    };
  }, [targetRect, currentStepData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998]">
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="10"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            onClick={onSkip}
            style={{ cursor: 'pointer' }}
          />
        </svg>

        {targetRect && (
          <motion.div
            key={`highlight-${currentStep}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute rounded-xl pointer-events-none"
            style={{
              zIndex: 2,
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              border: '2px solid rgba(59, 130, 246, 0.8)',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.25), 0 0 30px rgba(59, 130, 246, 0.4)',
            }}
          />
        )}

        <motion.div
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: isReady ? 1 : 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="absolute w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{ ...getTooltipPosition(), zIndex: 10 }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={onSkip}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-foreground">
                {currentStepData?.title}
              </h3>
              {currentStepData?.isPro && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400">PRO</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStepData?.description}
            </p>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-500' : index < currentStep ? 'bg-blue-500/50' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
