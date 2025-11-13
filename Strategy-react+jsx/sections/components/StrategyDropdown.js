import React, { useState } from "react";
import "../style/dropdown.css";

const StrategyDropdown = ({allStrategies, selected, setSelected}) => {

  const [open, setOpen] = useState(false);

  const toggleSelect = (strategy) => {
    const newSelection = selected.includes(strategy)
      ? selected.filter((s) => s !== strategy)
      : [...selected, strategy];
    setSelected(newSelection);
    console.log(newSelection);
  };

  return (
    <div className="dropdown-container">
      <button className="dropdown-toggle" onClick={() => setOpen(!open)}>
        Strategies ▾
      </button>
      {open && (
        <div className="dropdown-menu">
          {allStrategies.map((strategy) => (
            <label key={strategy} className="dropdown-item">
              <input
                type="checkbox"
                checked={selected.includes(strategy)}
                onChange={() => toggleSelect(strategy)}
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
