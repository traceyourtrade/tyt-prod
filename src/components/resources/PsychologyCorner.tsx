"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Lightbulb,
  Heart,
  AlertTriangle,
  RefreshCw,
  Quote,
  ChevronRight,
  Sparkles,
  Shield,
  Target,
  Zap,
} from "lucide-react";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: "discipline" | "mindset" | "emotions" | "pitfalls";
  icon: React.ElementType;
}

interface Affirmation {
  text: string;
  author?: string;
}

const dailyTips: Tip[] = [
  {
    id: "1",
    title: "Stick to Your Plan",
    content: "Your trading plan was made with a clear head. Trust it. Deviating during market hours often leads to impulsive decisions.",
    category: "discipline",
    icon: Shield,
  },
  {
    id: "2",
    title: "Accept Losses Gracefully",
    content: "Losses are tuition fees in the market. Learn from them, but don't let them affect your next trade emotionally.",
    category: "emotions",
    icon: Heart,
  },
  {
    id: "3",
    title: "Quality Over Quantity",
    content: "One well-planned trade is worth more than ten impulsive ones. Wait for your setup.",
    category: "discipline",
    icon: Target,
  },
  {
    id: "4",
    title: "Avoid Revenge Trading",
    content: "After a loss, take a break. The urge to 'win it back' leads to poor decisions and larger losses.",
    category: "pitfalls",
    icon: AlertTriangle,
  },
  {
    id: "5",
    title: "Stay Present",
    content: "Focus on executing the current trade well. Don't think about past losses or potential future gains.",
    category: "mindset",
    icon: Brain,
  },
  {
    id: "6",
    title: "Manage Expectations",
    content: "Consistent small wins compound over time. Don't chase home runs - they often lead to strikeouts.",
    category: "mindset",
    icon: Lightbulb,
  },
  {
    id: "7",
    title: "Know When to Stop",
    content: "Set daily loss limits and profit targets. When you hit either, walk away and live to trade another day.",
    category: "discipline",
    icon: Shield,
  },
  {
    id: "8",
    title: "Beware of FOMO",
    content: "Fear of missing out causes rushed entries. There will always be another opportunity. Let trades come to you.",
    category: "pitfalls",
    icon: AlertTriangle,
  },
];

const affirmations: Affirmation[] = [
  { text: "I am disciplined and patient. I wait for my setups.", author: "Trading Mantra" },
  { text: "I accept that losses are part of the game. I learn and move forward." },
  { text: "I trade my plan, not my emotions." },
  { text: "Every trade is an opportunity to improve, regardless of outcome." },
  { text: "I am not my last trade. Each new trade is a fresh start." },
  { text: "The market doesn't owe me anything. I earn my profits through discipline." },
  { text: "I focus on the process, not the profits. Profits follow good process." },
  { text: "I cut losses quickly and let winners run." },
  { text: "I am grateful for every lesson the market teaches me." },
  { text: "Patience and discipline are my competitive advantages." },
];

const commonPitfalls = [
  {
    title: "Overtrading",
    description: "Taking too many trades, often from boredom or the desire for action. Solution: Set a maximum number of trades per day.",
    icon: Zap,
  },
  {
    title: "Revenge Trading",
    description: "Trying to quickly recover losses with larger positions or impulsive trades. Solution: Take a break after losses.",
    icon: AlertTriangle,
  },
  {
    title: "Moving Stop Losses",
    description: "Moving your stop loss further away to avoid being stopped out. Solution: Accept the loss as planned.",
    icon: Shield,
  },
  {
    title: "FOMO (Fear of Missing Out)",
    description: "Entering trades late or without proper analysis because of fear. Solution: Trust that better setups will come.",
    icon: Target,
  },
  {
    title: "Overconfidence After Wins",
    description: "Taking larger positions or ignoring rules after a winning streak. Solution: Stick to your position sizing rules.",
    icon: Sparkles,
  },
];

const PsychologyCorner = () => {
  const [currentAffirmation, setCurrentAffirmation] = useState(0);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const rotateAffirmation = () => {
    setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAffirmation((prev) => (prev + 1) % affirmations.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { id: "discipline", label: "Discipline", icon: Shield, color: "text-blue-500" },
    { id: "mindset", label: "Mindset", icon: Brain, color: "text-purple-500" },
    { id: "emotions", label: "Emotions", icon: Heart, color: "text-rose-500" },
    { id: "pitfalls", label: "Pitfalls", icon: AlertTriangle, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Daily Affirmation Card */}
      <motion.div
        className="relative bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-6 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Daily Affirmation</span>
            </div>
            <button
              onClick={rotateAffirmation}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <motion.div
            key={currentAffirmation}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
              "{affirmations[currentAffirmation].text}"
            </p>
            {affirmations[currentAffirmation].author && (
              <p className="text-sm text-muted-foreground mt-2">
                — {affirmations[currentAffirmation].author}
              </p>
            )}
          </motion.div>

          <div className="flex gap-1 mt-4">
            {affirmations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentAffirmation(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentAffirmation ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Psychology Tips Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Psychology Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dailyTips.map((tip) => {
            const Icon = tip.icon;
            const category = categories.find((c) => c.id === tip.category);
            const isExpanded = expandedTip === tip.id;

            return (
              <motion.div
                key={tip.id}
                layout
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <button
                  onClick={() => setExpandedTip(isExpanded ? null : tip.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${category?.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">{tip.title}</h3>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{tip.category}</span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-border"
                  >
                    <p className="p-4 text-sm text-muted-foreground leading-relaxed">
                      {tip.content}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Common Pitfalls */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Common Trading Pitfalls</h2>
        <div className="space-y-3">
          {commonPitfalls.map((pitfall, idx) => {
            const Icon = pitfall.icon;
            return (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{pitfall.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{pitfall.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PsychologyCorner;
