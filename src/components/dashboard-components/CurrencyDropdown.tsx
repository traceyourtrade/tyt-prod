"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Check,
  DollarSign,
  IndianRupee,
  Percent,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import useCurrencyStore, { CurrencyType, currencyLabels } from "@/store/currencyStore";

const currencyOptions: { id: CurrencyType; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "USD", label: "Dollar", description: "US Dollar ($)", icon: <DollarSign className="w-4 h-4" /> },
  { id: "INR", label: "Rupees", description: "Indian Rupee (₹)", icon: <IndianRupee className="w-4 h-4" /> },
  { id: "PERCENT", label: "Percentage", description: "Show as %", icon: <Percent className="w-4 h-4" /> },
  { id: "R", label: "R Factor", description: "Risk multiple", icon: <Target className="w-4 h-4" /> },
];

const CurrencyDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { currency, setCurrency } = useCurrencyStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCurrency = (currencyId: CurrencyType) => {
    setCurrency(currencyId);
    setIsOpen(false);
  };

  const selectedOption = currencyOptions.find(opt => opt.id === currency);
  const getDisplayIcon = () => {
    switch (currency) {
      case "USD": return <DollarSign className="w-4 h-4" />;
      case "INR": return <IndianRupee className="w-4 h-4" />;
      case "PERCENT": return <Percent className="w-4 h-4" />;
      case "R": return <Target className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "border border-border bg-card hover:bg-muted/50",
          isOpen && "border-primary/50 ring-2 ring-primary/20"
        )}
      >
        <span className="text-primary">{getDisplayIcon()}</span>
        <ChevronDown className={cn(
          "w-3 h-3 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <span className="font-semibold text-foreground text-sm">Display Currency</span>
            </div>

            {/* Currency Options */}
            <div className="p-2 space-y-1">
              {currencyOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectCurrency(option.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                    currency === option.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    currency === option.id 
                      ? "bg-primary text-white" 
                      : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                  )}>
                    {option.icon}
                  </div>

                  {/* Label & Description */}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>

                  {/* Checkmark */}
                  {currency === option.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencyDropdown;
