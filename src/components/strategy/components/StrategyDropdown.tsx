"use client"
import React, { useState } from "react";

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

  const toggleSelect = (strategy: string) => {
    const newSelection = selected.includes(strategy)
      ? selected.filter((s) => s !== strategy)
      : [...selected, strategy];
    setSelected(newSelection);
    console.log(newSelection);
  };

  return (
    <div className="relative">
      <button 
        className="bg-[#1f1f1f] text-white border border-[#2a2a2a] px-3.5 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#232323] active:scale-98"
        onClick={() => setOpen(!open)}
      >
        Strategies ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#121212] border border-[#2b2b2b] rounded-xl p-3.5 shadow-2xl z-30 animate-fadeIn min-w-[200px]">
          {allStrategies.map((strategy) => (
            <label key={strategy} className="flex items-center gap-2 text-white cursor-pointer py-1 hover:bg-white/5 px-2 rounded">
              <input
                type="checkbox"
                checked={selected.includes(strategy)}
                onChange={() => toggleSelect(strategy)}
                className="accent-[#b281ff]"
              />
              {strategy}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategyDropdown;