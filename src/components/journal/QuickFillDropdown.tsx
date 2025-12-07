'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';

interface QuickFillDropdownProps {
  promptId: string;
  currentValue: string;
  onSelect: (value: string) => void;
}

const quickFillOptions: Record<string, string[]> = {
  went_well: [
    "Followed my trading plan exactly as designed",
    "Entered at the perfect support/resistance level",
    "Managed risk properly with correct position size",
    "Took profits at planned target levels",
    "Waited patiently for confirmation before entry",
    "Executed the setup I've been practicing",
    "Kept emotions in check throughout the trade",
    "Identified the trend correctly and traded with it",
    "Used proper stop loss placement",
    "Recognized a high probability setup",
  ],
  improve: [
    "Should have waited for better confirmation",
    "Position size was too large for the setup",
    "Entered too early before signal confirmation",
    "Moved stop loss prematurely",
    "Let a winning trade turn into a loss",
    "Didn't follow my pre-defined exit plan",
    "Traded against the overall market trend",
    "Held too long expecting more profit",
    "Need to work on patience before entries",
    "Should have taken partial profits earlier",
  ],
  lessons: [
    "Trust the process and stick to the plan",
    "Patience is key - wait for the setup",
    "Don't chase trades, let them come to you",
    "Risk management is more important than being right",
    "Cut losses quickly, let winners run",
    "Market structure trumps individual patterns",
    "Emotional trading leads to poor decisions",
    "Quality setups over quantity of trades",
    "Review trades daily for continuous improvement",
    "Accept losses as part of the trading process",
  ],
  follow_plan: [
    "Yes - followed entry, stop, and target exactly",
    "Yes - but adjusted target based on market conditions",
    "Partially - entered correctly but exited early",
    "Partially - good setup but wrong position size",
    "No - entered before my signal triggered",
    "No - moved stop loss when I shouldn't have",
    "No - revenge traded after previous loss",
    "No - FOMO caused me to chase the trade",
  ],
  notes: [
    "Clean setup with good risk/reward",
    "Market conditions were favorable",
    "Executed according to strategy rules",
    "Need to review this trade type more",
    "Good learning experience regardless of outcome",
    "Will add this pattern to my playbook",
  ],
  entry_reason: [
    "Break of key resistance level with volume",
    "Bounce off major support with bullish divergence",
    "Gap fill play with momentum confirmation",
    "Trend continuation after healthy pullback",
    "Reversal pattern at market structure level",
    "News catalyst with technical confirmation",
    "VWAP reclaim with strong buying pressure",
    "Opening range breakout with sector strength",
  ],
  exit_reason: [
    "Hit predetermined profit target",
    "Stop loss triggered as planned",
    "Market structure changed against position",
    "Time-based exit at session end",
    "Trailing stop activated after run",
    "Risk/reward no longer favorable",
    "Took partial profits, stopped out remainder",
    "Recognized failed setup pattern",
  ],
  setup_grade: [
    "10 - Perfect setup, A+ execution",
    "9 - Excellent setup, minor improvements possible",
    "8 - Strong setup, good execution",
    "7 - Solid setup, room for improvement",
    "6 - Average setup, need more criteria",
    "5 - Below average, shouldn't have traded",
    "4 or below - Poor setup, learning experience",
  ],
  would_take_again: [
    "Yes - setup was valid, execution was correct",
    "Yes - would only change position size",
    "Yes - but would wait for stronger confirmation",
    "Yes - the process was right even if outcome wasn't",
    "No - setup didn't meet all criteria",
    "No - market conditions weren't ideal",
    "No - I was trading emotionally",
    "No - risk/reward wasn't favorable",
  ],
  mindset_before: [
    "Calm and focused, ready to execute",
    "Confident after thorough analysis",
    "Neutral, waiting for opportunities",
    "Slightly anxious but controlled",
    "Overconfident after winning streak",
    "Frustrated from previous losses",
    "Distracted by external factors",
    "Impatient and looking to force trades",
  ],
  emotions_during: [
    "Calm and patient throughout",
    "Excited when trade moved in my favor",
    "Nervous but stuck to the plan",
    "Fearful when price approached stop",
    "Greedy - wanted more than target",
    "Anxious about potential loss",
    "Frustrated by choppy price action",
    "Panicked and made impulsive decision",
  ],
  mindset_after: [
    "Satisfied with execution regardless of outcome",
    "Happy with profit, staying humble",
    "Accepting the loss as part of trading",
    "Frustrated but learning from mistakes",
    "Relieved it's over, need a break",
    "Confident, ready for next opportunity",
    "Disappointed but not discouraged",
    "Need to step away and reset mentally",
  ],
  confidence: [
    "10 - Maximum confidence, perfect setup",
    "9 - Very confident, all criteria met",
    "8 - High confidence, strong setup",
    "7 - Good confidence, minor uncertainty",
    "6 - Moderate confidence, some concerns",
    "5 - Uncertain, borderline trade",
    "4 or below - Low confidence, shouldn't have traded",
  ],
};

const QuickFillDropdown: React.FC<QuickFillDropdownProps> = ({ promptId, currentValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = quickFillOptions[promptId] || quickFillOptions.notes || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    if (currentValue) {
      onSelect(currentValue + '\n\n' + option);
    } else {
      onSelect(option);
    }
    setIsOpen(false);
  };

  if (options.length === 0) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-primary bg-muted/50 hover:bg-primary/10 rounded-md transition-all"
      >
        <Sparkles className="w-3 h-3" />
        <span>Quick Fill</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-72 max-h-64 overflow-y-auto bg-card border border-border rounded-lg shadow-xl z-50"
          >
            <div className="p-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickFillDropdown;
