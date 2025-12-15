'use client';

import { useState } from 'react';
import { useTestingStore } from '@/store/backtestingStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle, faChevronDown, faChartLine, faCrown } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

interface SessionCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionCreationDialog({ isOpen, onClose }: SessionCreationDialogProps) {
  const [sessionType, setSessionType] = useState<'backtesting' | 'propFirm'>('backtesting');
  const [name, setName] = useState('');
  const [accountBalance, setAccountBalance] = useState('100000');
  const [assets, setAssets] = useState('');
  const [chartLayout, setChartLayout] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const router=useRouter()
  
  const { addSession } = useTestingStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'This field is required.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const newSession = {
      id: Date.now(),
      name: name.trim(),
      symbol: assets || 'OANDA:XAUUSD',
      currentBalance: `$${accountBalance}`,
      startDate: new Date().toLocaleDateString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysRemaining: 365,
      totalPnl: 0,
      winRate: 0,
      riskReward: 0,
      monthGainLoss: 0,
      weekGainLoss: 0,
      dailyGainLoss: 0,
    };
    
    addSession(newSession);
    onClose();
    router.push(`/backtesting/${newSession.id}`)
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[var(--background-secondary)] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border)] shadow-2xl animate-slide-up"
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
              <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Create New Session</h2>
              <p className="text-sm text-[var(--foreground-muted)]">Start your backtesting journey</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--background-hover)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 border-b border-[var(--border-light)]">
          <div className="flex gap-3">
            <button 
              onClick={() => setSessionType('backtesting')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                sessionType === 'backtesting' 
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-lg shadow-[var(--primary)]/25' 
                  : 'bg-[var(--background-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              Backtesting Session
            </button>
            <button 
              onClick={() => setSessionType('propFirm')}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                sessionType === 'propFirm' 
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white shadow-lg shadow-[var(--primary)]/25' 
                  : 'bg-[var(--background-hover)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
              }`}
            >
              Prop Firm Session
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                <FontAwesomeIcon icon={faCrown} className="h-3 w-3" />
                Pro
              </span>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Session Name <span className="text-[var(--loss)]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({});
              }}
              placeholder="e.g., XAUUSD Trend Strategy"
              className={`w-full bg-[var(--background-card)] text-[var(--foreground)] px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all ${
                errors.name ? 'border-[var(--loss)]' : 'border-[var(--border)]'
              }`}
            />
            {errors.name && (
              <p className="text-[var(--loss)] text-sm mt-2 flex items-center gap-1">
                <FontAwesomeIcon icon={faInfoCircle} className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Starting Balance <span className="text-[var(--loss)]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] font-medium">$</span>
              <input
                type="text"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                className="w-full bg-[var(--background-card)] text-[var(--foreground)] pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all tabular-nums"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Trading Pair <span className="text-[var(--loss)]">*</span>
            </label>
            <div className="relative">
              <select
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                className="w-full bg-[var(--background-card)] text-[var(--foreground)] px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none cursor-pointer transition-all"
              >
                <option value="">Select a trading pair</option>
                <optgroup label="Forex Majors">
                  <option value="OANDA:EURUSD">EUR/USD - Euro / US Dollar</option>
                  <option value="OANDA:GBPUSD">GBP/USD - British Pound / US Dollar</option>
                  <option value="OANDA:USDJPY">USD/JPY - US Dollar / Japanese Yen</option>
                  <option value="OANDA:USDCHF">USD/CHF - US Dollar / Swiss Franc</option>
                  <option value="OANDA:AUDUSD">AUD/USD - Australian Dollar / US Dollar</option>
                  <option value="OANDA:USDCAD">USD/CAD - US Dollar / Canadian Dollar</option>
                  <option value="OANDA:NZDUSD">NZD/USD - New Zealand Dollar / US Dollar</option>
                </optgroup>
                <optgroup label="Forex Crosses">
                  <option value="OANDA:EURGBP">EUR/GBP - Euro / British Pound</option>
                  <option value="OANDA:EURJPY">EUR/JPY - Euro / Japanese Yen</option>
                  <option value="OANDA:GBPJPY">GBP/JPY - British Pound / Japanese Yen</option>
                  <option value="OANDA:AUDJPY">AUD/JPY - Australian Dollar / Japanese Yen</option>
                </optgroup>
                <optgroup label="Commodities">
                  <option value="OANDA:XAUUSD">XAU/USD - Gold / US Dollar</option>
                  <option value="OANDA:XAGUSD">XAG/USD - Silver / US Dollar</option>
                </optgroup>
                <optgroup label="Crypto">
                  <option value="COINBASE:BTCUSD">BTC/USD - Bitcoin / US Dollar</option>
                  <option value="COINBASE:ETHUSD">ETH/USD - Ethereum / US Dollar</option>
                </optgroup>
              </select>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Chart Layout
              <span className="text-[var(--foreground-muted)] font-normal ml-1">(Optional)</span>
              <button 
                type="button"
                className="ml-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4" />
              </button>
            </label>
            <div className="relative">
              <select
                value={chartLayout}
                onChange={(e) => setChartLayout(e.target.value)}
                className="w-full bg-[var(--background-card)] text-[var(--foreground)] px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none cursor-pointer transition-all"
              >
                <option value="">Select chart layout</option>
                <option value="default">Default Layout</option>
                <option value="advanced">Advanced Layout</option>
                <option value="minimal">Minimal Layout</option>
              </select>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none" 
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim()}
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
