'use client';

import { useTestingStore } from '@/store/backtestingStore';
import { Play, MoreVertical, Calendar, Clock, TrendingUp, Plus } from 'lucide-react';
import { ChartCard } from '@/components/backtesting';
import { useRouter } from 'next/navigation';

interface SessionsListProps {
  handleNewSessionClick: () => void;
}

export default function SessionsList({ handleNewSessionClick }: SessionsListProps) {
  const { sessions } = useTestingStore();
  const router = useRouter();
  
  const handleResume = (sessionId: number) => {
    router.push(`/backtesting/${sessionId}`);
  };

  return (
    <ChartCard title="Recent Sessions" subtitle="Your most recent backtesting sessions">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="group relative rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{session.name}</h3>
                <p className="text-sm text-muted-foreground">{session.symbol}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{session.startDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{session.daysRemaining}d left</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className={`text-lg font-bold ${session.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {session.totalPnl >= 0 ? '+' : ''}{session.totalPnl.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">P&L</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{session.winRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold text-foreground">{session.riskReward.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">R:R</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm font-medium text-foreground">{session.currentBalance}</span>
              <button 
                onClick={() => handleResume(session.id)} 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              >
                <Play className="h-3 w-3" />
                Resume
              </button>
            </div>
          </div>
        ))}

        <div 
          onClick={handleNewSessionClick}
          className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center min-h-[240px] hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary flex items-center justify-center mb-3 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
          </div>
          <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors">Create New Session</p>
          <p className="text-sm text-muted-foreground mt-1">Start backtesting now</p>
        </div>
      </div>
    </ChartCard>
  );
}
