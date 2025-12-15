'use client';

import { useTestingStore } from '@/store/backtestingStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faEllipsisV,
  faCalendarAlt,
  faClock,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { ChartCard } from '@/components/backtesting';
import { useRouter } from 'next/navigation';

interface SessionsListProps {
  handleNewSessionClick: () => void;
}

export default function SessionsList({ handleNewSessionClick }: SessionsListProps) {
  const { sessions } = useTestingStore();
  const router = useRouter();
  const handleResume = (sessionId: number) => {
    router.push(`/backtesting/${sessionId}`)
  }
  return (
    <ChartCard title="Recent Sessions" tooltip="Your most recent backtesting sessions">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="group relative bg-[var(--background-card)] border border-[var(--border-light)] rounded-2xl p-5 hover:border-[var(--border)] hover:shadow-xl transition-all duration-200"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 rounded-lg hover:bg-[var(--background-hover)] text-[var(--foreground-muted)]">
                <FontAwesomeIcon icon={faEllipsisV} className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--primary)] flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">{session.name}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{session.symbol}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm text-[var(--foreground-secondary)]">
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarAlt} className="h-3.5 w-3.5" />
                <span>{session.startDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                <span>{session.daysRemaining}d left</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-[var(--background-hover)]">
                <p className={`text-lg font-bold ${session.totalPnl >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
                  {session.totalPnl >= 0 ? '+' : ''}{session.totalPnl.toFixed(2)}%
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">P&L</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--background-hover)]">
                <p className="text-lg font-bold text-[var(--foreground)]">{session.winRate}%</p>
                <p className="text-xs text-[var(--foreground-muted)]">Win Rate</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--background-hover)]">
                <p className="text-lg font-bold text-[var(--foreground)]">{session.riskReward.toFixed(2)}</p>
                <p className="text-xs text-[var(--foreground-muted)]">R:R</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-light)]">
              <span className="text-sm font-medium text-[var(--foreground)]">{session.currentBalance}</span>
              <button onClick={()=>handleResume(session.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary-glow)] text-primary font-medium text-sm hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faPlay} className="h-3 w-3" />
                Resume
              </button>
            </div>
          </div>
        ))}

        <div 
        onClick={handleNewSessionClick}
          className="border-2 border-dashed border-[var(--border)] rounded-2xl p-5 flex flex-col items-center justify-center min-h-[240px] hover:border-[var(--primary)] hover:bg-[var(--primary-glow)] transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--background-hover)] group-hover:bg-[var(--primary)] flex items-center justify-center mb-3 transition-colors">
            <span className="text-2xl text-[var(--foreground-muted)] group-hover:text-white transition-colors">+</span>
          </div>
          <p className="font-medium text-[var(--foreground-secondary)] group-hover:text-primary transition-colors">Create New Session</p>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">Start backtesting now</p>
        </div>
      </div>
    </ChartCard>
  );
}
