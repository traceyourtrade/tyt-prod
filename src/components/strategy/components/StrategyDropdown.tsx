"use client"
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface StrategyDropdownProps {
  allStrategies: string[];
  selected: string[];
  setSelected: (strategies: string[]) => void;
}

const StrategyDropdown: React.FC<StrategyDropdownProps> = ({ 
  allStrategies, 
  selected, 
  setSelected 
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelect = (strategy: string) => {
    const newSelection = selected.includes(strategy)
      ? selected.filter((s) => s !== strategy)
      : [...selected, strategy];
    setSelected(newSelection);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={ref}>
      <button 
        className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto bg-card text-foreground border border-border px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted text-sm font-medium touch-manipulation"
        onClick={() => setOpen(!open)}
      >
        Strategies
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 bg-card border border-border rounded-xl p-2 shadow-lg z-30 w-full sm:min-w-[200px] max-h-[60vh] overflow-y-auto">
          {allStrategies.length === 0 ? (
            <p className="text-muted-foreground text-sm px-3 py-2">No strategies available</p>
          ) : (
            allStrategies.map((strategy) => (
              <label 
                key={strategy} 
                className="flex items-center gap-3 text-foreground cursor-pointer py-2.5 px-3 hover:bg-muted rounded-lg transition-colors text-sm touch-manipulation"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                  selected.includes(strategy) 
                    ? 'bg-primary border-primary' 
                    : 'border-border'
                }`}>
                  {selected.includes(strategy) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <input
                  type="checkbox"
                  checked={selected.includes(strategy)}
                  onChange={() => toggleSelect(strategy)}
                  className="sr-only"
                />
                <span className="truncate">{strategy}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StrategyDropdown;