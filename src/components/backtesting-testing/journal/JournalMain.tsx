'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash,
  faChevronLeft,
  faChevronRight,
  faTimes,
  faSearch,
  faArrowUp,
  faArrowDown,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { ChartCard, FilterButton, Skeleton } from '@/components/ui';

interface Trade {
  id: number;
  sessionId?: number;
  name?: string;
  date?: string;
  symbol?: string;
  position?: string;
  type?: string;
  entry?: number;
  exit?: number;
  entryPrice?: number;
  stopPrice?: number;
  lotSize?: number;
  pnl?: number;
  roi?: number;
  reason?: string;
  status?: string;
  timestamp?: string;
}

interface MongoSession {
  _id: string;
  uniqueId: string;
  sessionId: number;
  sessionInfo: {
    name: string;
    symbol: string;
    currentBalance: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    totalPnl: number;
    winRate: number;
    riskReward: number;
  };
  trades: Trade[];
}

export default function JournalMain() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [sessions, setSessions] = useState<MongoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/backtest-sessions');
        
        if (!res.ok) throw new Error('Failed to fetch sessions');
        
        const data = await res.json();
        
        if (data.success && data.data) {
          setSessions(data.data);
          
          const allTrades: Trade[] = [];
          data.data.forEach((session: MongoSession) => {
            if (session.trades && Array.isArray(session.trades)) {
              session.trades.forEach((trade: Trade) => {
                allTrades.push({
                  ...trade,
                  sessionId: session.sessionId,
                  symbol: trade.symbol || session.sessionInfo.symbol
                });
              });
            }
          });
          setTrades(allTrades);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getSessionName = (sessionId: number | undefined) => {
    if (!sessionId) return 'Unknown Session';
    const session = sessions.find(s => s.sessionId === sessionId);
    return session?.sessionInfo.name || `Session #${sessionId}`;
  };

  const getSessionSymbol = (sessionId: number | undefined) => {
    if (!sessionId) return 'EUR/USD';
    const session = sessions.find(s => s.sessionId === sessionId);
    return session?.sessionInfo.symbol || 'EUR/USD';
  };

  const filteredTrades = trades.filter(trade => {
    const tradeType = trade.type || trade.position || 'long';
    const matchesSearch = searchTerm === '' || 
      getSessionName(trade.sessionId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSessionSymbol(trade.sessionId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      tradeType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === null || tradeType === selectedType;
    
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredTrades.length / rowsPerPage);
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const clearFilters = () => {
    setSelectedType(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Trade Journal</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">Loading your trade history...</p>
          </div>
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-5">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">Error loading trades: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Trade Journal</h2>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            {trades.length} total trades recorded
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 h-3.5 w-3.5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 pr-4 py-2 text-sm w-56"
            />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <FilterButton 
            active={selectedType === null}
            onClick={() => setSelectedType(null)}
          >
            All ({trades.length})
          </FilterButton>
          <FilterButton 
            active={selectedType === 'long'}
            onClick={() => setSelectedType('long')}
          >
            Long ({trades.filter(t => (t.type || t.position || 'long') === 'long').length})
          </FilterButton>
          <FilterButton 
            active={selectedType === 'short'}
            onClick={() => setSelectedType('short')}
          >
            Short ({trades.filter(t => (t.type || t.position || '') === 'short').length})
          </FilterButton>
          <FilterButton 
            active={false}
            onClick={() => {}}
          >
            Winners ({trades.filter(t => (t.pnl || t.roi || 0) > 0).length})
          </FilterButton>
          <FilterButton 
            active={false}
            onClick={() => {}}
          >
            Losers ({trades.filter(t => (t.pnl || t.roi || 0) < 0).length})
          </FilterButton>
        </div>
        
        {(selectedType !== null || searchTerm !== '') && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-light)]">
            {selectedType && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--background-elevated)] text-xs">
                <span className="text-[var(--foreground-secondary)]">{selectedType.toUpperCase()}</span>
                <button 
                  onClick={() => setSelectedType(null)}
                  className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            {searchTerm && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--background-elevated)] text-xs">
                <span className="text-[var(--foreground-secondary)]">Search: {searchTerm}</span>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
            
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-[var(--foreground-muted)] hover:text-[var(--loss)] text-xs ml-auto transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
              Clear all
            </button>
          </div>
        )}
      </div>
      
      <ChartCard title="Trade Entries">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--border-light)]">
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Trade</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Date</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Session</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Symbol</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Side</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Entry</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Exit</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Lot Size</th>
                <th className="text-right py-3 px-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">P&L</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="text-[var(--foreground-muted)]">
                      {trades.length === 0 
                        ? 'No trades recorded yet. Start a backtesting session to add trades.'
                        : 'No trades match your filters.'
                      }
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade) => {
                  const tradeType = trade.type || trade.position || 'long';
                  const isLong = tradeType.toLowerCase() === 'long' || tradeType.toLowerCase() === 'buy';
                  const tradePnl = trade.pnl || trade.roi || 0;
                  const tradeDate = trade.timestamp || trade.date || new Date().toISOString();
                  const entryPrice = trade.entry || trade.entryPrice || 0;
                  const exitPrice = trade.exit || trade.stopPrice || 0;
                  
                  return (
                    <tr 
                      key={trade.id} 
                      className="border-b border-[var(--border-light)] hover:bg-[var(--background-hover)] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isLong ? 'bg-[var(--profit-bg)]' : 'bg-[var(--loss-bg)]'
                          }`}>
                            <FontAwesomeIcon 
                              icon={isLong ? faArrowUp : faArrowDown} 
                              className={`h-3 w-3 ${isLong ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}
                            />
                          </div>
                          <span className="text-sm font-medium text-[var(--foreground)]">#{trade.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-[var(--foreground-muted)]">
                        {new Date(tradeDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-sm text-[var(--foreground)]">
                        {getSessionName(trade.sessionId)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {trade.symbol || getSessionSymbol(trade.sessionId)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isLong 
                            ? 'bg-[var(--profit-bg)] text-[var(--profit)]' 
                            : 'bg-[var(--loss-bg)] text-[var(--loss)]'
                        }`}>
                          {tradeType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm tabular-nums text-[var(--foreground)]">
                        {entryPrice.toFixed(5)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm tabular-nums text-[var(--foreground-muted)]">
                        {exitPrice.toFixed(5)}
                      </td>
                      <td className="py-3 px-3 text-right text-sm tabular-nums text-[var(--foreground)]">
                        {trade.lotSize || '-'}
                      </td>
                      <td className={`py-3 px-3 text-right text-sm font-medium tabular-nums ${
                        tradePnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                      }`}>
                        {tradePnl >= 0 ? '+' : ''}${tradePnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTrades.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-[var(--border-light)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--foreground-muted)]">Rows per page</span>
              <select 
                className="bg-[var(--background-hover)] text-[var(--foreground)] px-2 py-1 rounded text-xs border border-[var(--border-light)] focus:outline-none"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button 
                className="p-1.5 rounded bg-[var(--background-hover)] hover:bg-[var(--background-elevated)] disabled:opacity-50 transition-colors"
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3 text-[var(--foreground-muted)]" />
              </button>
              <span className="px-3 py-1 rounded bg-[var(--primary-muted)] text-xs font-medium text-[var(--primary)]">
                {currentPage}
              </span>
              <button 
                className="p-1.5 rounded bg-[var(--background-hover)] hover:bg-[var(--background-elevated)] disabled:opacity-50 transition-colors"
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 text-[var(--foreground-muted)]" />
              </button>
              <span className="text-xs text-[var(--foreground-muted)] ml-1">of {totalPages || 1}</span>
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
