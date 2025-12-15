'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTestingStore } from '@/store/backtestingStore';
import { Plus, Search, Bell, Flame } from 'lucide-react';
import DashboardMain from './dashboard/DashboardMain';
import SessionsMain from './sessions/SessionsMain';
import JournalMain from './journal/JournalMain';
import AnalyticsMain from './analytics/AnalyticsMain';
import SessionCreationDialog from './SessionCreationDialog';

export default function TestingMain() {
  const pathname = usePathname();
  const { activeTab, setActiveTab, loadUserSessions } = useTestingStore();
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);

  useEffect(() => {
    const path = pathname.split('/').pop();
    if (path === 'dashboard' || path === 'sessions' || path === 'journal' || path === 'analytics') {
      setActiveTab(path.charAt(0).toUpperCase() + path.slice(1));
    } else {
      setActiveTab('Dashboard');
    }
  }, [pathname, setActiveTab]);

  const handleNewSessionClick = () => {
    setIsSessionDialogOpen(true);
  };

  const handleCloseSessionDialog = () => {
    setIsSessionDialogOpen(false);
  };

  useEffect(() => {
    loadUserSessions();
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'Dashboard': return 'Backtesting Dashboard';
      case 'Sessions': return 'Sessions';
      case 'Journal': return 'Journal';
      case 'Analytics': return 'Analytics';
      default: return 'Backtesting Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'Dashboard': return 'Track your backtesting progress and key metrics';
      case 'Sessions': return 'Manage your backtesting sessions';
      case 'Journal': return 'Document your trading insights';
      case 'Analytics': return 'Analyze your performance data';
      default: return 'Track your backtesting progress and key metrics';
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                {getPageSubtitle()}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-40"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground border border-border">
                  ⌘K
                </kbd>
              </div>

              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-foreground">3 day streak</span>
              </div>

              <button className="relative p-2.5 rounded-lg bg-card border border-border hover:bg-accent transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-6 lg:px-8 py-6">
        <div className="animate-in fade-in duration-300">
          {activeTab === 'Dashboard' && <DashboardMain handleNewSessionClick={handleNewSessionClick} />}
          {activeTab === 'Sessions' && <SessionsMain />}
          {activeTab === 'Journal' && <JournalMain />}
          {activeTab === 'Analytics' && <AnalyticsMain />}
        </div>
      </main>
      
      <button 
        onClick={handleNewSessionClick}
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-xl px-5 py-3 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="font-medium">New Session</span>
      </button>
      
      <SessionCreationDialog 
        isOpen={isSessionDialogOpen} 
        onClose={handleCloseSessionDialog} 
      />
    </div>
  );
}
