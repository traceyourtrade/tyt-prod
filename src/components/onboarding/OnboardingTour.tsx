'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !steps[currentStep]) return;
    
    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, steps, isOpen]);

  useEffect(() => {
    setCurrentStep(0);
  }, [isOpen]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updateTargetPosition, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep, updateTargetPosition]);

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

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%' };
    
    const step = steps[currentStep];
    const position = step.position || 'right';
    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (position) {
      case 'top':
        return {
          top: `${Math.max(padding, targetRect.top - tooltipHeight - padding)}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'bottom':
        return {
          top: `${Math.min(window.innerHeight - tooltipHeight - padding, targetRect.bottom + padding)}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'left':
        return {
          top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding))}px`,
          left: `${Math.max(padding, targetRect.left - tooltipWidth - padding)}px`,
        };
      case 'right':
      default:
        return {
          top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding))}px`,
          left: `${Math.min(window.innerWidth - tooltipWidth - padding, targetRect.right + padding)}px`,
        };
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        />

        {targetRect && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
              background: 'transparent',
            }}
          />
        )}

        <motion.div
          key={`tooltip-${currentStep}`}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="absolute w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={getTooltipPosition()}
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
