import { useState, useRef, useEffect } from 'react';

const CurrencyDropdown = () => {
  const [isCurrOpen, setCrr] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('Dollar');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLLIElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setCrr(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currencies = [
    { name: 'Dollar', icon: 'fa-dollar' },
    { name: 'Rupees', icon: 'fa-indian-rupee-sign' },
    { name: 'Percentage', icon: 'fa-percent' },
    { name: 'R factor', icon: 'fa-asterisk' }
  ];

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    setCrr(false);
  };

  return (
    <div className="relative bg-red-500">
      {/* Currency Button */}
      <li
        ref={buttonRef}
        className="w-12 h-auto flex items-center justify-between rounded-lg px-2 py-1 mr-4 text-white cursor-pointer backdrop-blur-xl border border-[rgba(255,255,255,0.347)] border-r-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] transition-colors"
        onClick={() => setCrr(!isCurrOpen)}
      >
        <span className="flex items-center justify-between w-full">
          <i className={`fa-solid ${currencies.find(c => c.name === selectedCurrency)?.icon} text-white text-sm`}></i>
          <i className="fa-solid fa-caret-down text-white text-xs ml-1"></i>
        </span>
      </li>

      {/* Currency Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute top-12 -right-4 w-48 h-auto bg-[rgba(0,0,0,0.8)] backdrop-blur-xl rounded-lg shadow-2xl border border-[rgba(255,255,255,0.2)] transition-all duration-300 ease-in-out z-50 ${
          isCurrOpen 
            ? "visible opacity-100 scale-100 translate-y-0" 
            : "invisible opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="w-full h-auto p-2">
          {currencies.map((currency) => (
            <div 
              key={currency.name}
              className={`w-full flex items-center justify-between py-3 px-4 cursor-pointer text-white font-['Inter'] rounded-md transition-all ${
                selectedCurrency === currency.name 
                  ? 'bg-[rgba(74,144,226,0.3)] border border-[rgba(74,144,226,0.5)]' 
                  : 'hover:bg-[rgba(255,255,255,0.1)]'
              }`}
              onClick={() => handleCurrencySelect(currency.name)}
            >
              <span className="text-sm font-medium">{currency.name}</span>
              <i className={`fa-solid ${currency.icon} text-white text-sm`}></i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyDropdown;