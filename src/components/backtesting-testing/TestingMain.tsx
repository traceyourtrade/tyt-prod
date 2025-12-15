'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTestingStore } from '@/lib/store/testingStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faBell,
  faSearch,
  faFire,
} from '@fortawesome/free-solid-svg-icons';
import DashboardMain from './dashboard/DashboardMain';
import SessionsMain from './sessions/SessionsMain';
import JournalMain from './journal/JournalMain';
import AnalyticsMain from './analytics/AnalyticsMain';
import SessionCreationDialog from './SessionCreationDialog';

export default function TestingMain() {
  const pathname = usePathname();
  const { activeTab, setActiveTab,loadUserSessions } = useTestingStore();
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
  useEffect(()=>{
    loadUserSessions()
  },[])

  const getPageTitle = () => {
    switch (activeTab) {
      case 'Dashboard': return 'Dashboard';
      case 'Sessions': return 'Sessions';
      case 'Journal': return 'Journal';
      case 'Analytics': return 'Analytics';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-sm border-b border-[var(--border-light)]">
        <div className="px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-lg font-semibold text-[var(--foreground)]">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[var(--background-card)] border border-[var(--border-light)] rounded-lg">
                <FontAwesomeIcon icon={faSearch} className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none w-40"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--background-hover)] rounded text-[var(--foreground-muted)] border border-[var(--border-light)]">
                  ⌘K
                </kbd>
              </div>

              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-[var(--background-card)] border border-[var(--border-light)] rounded-lg">
                <FontAwesomeIcon icon={faFire} className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
                <span className="text-sm font-medium text-[var(--foreground)]">3 day streak</span>
              </div>

              <button className="relative p-2.5 rounded-lg bg-[var(--background-card)] border border-[var(--border-light)] hover:bg-[var(--background-hover)] transition-colors">
                <FontAwesomeIcon icon={faBell} className="h-4 w-4 text-[var(--foreground-secondary)]" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-8 py-6">
        <div className="animate-fade-in">
          {activeTab === 'Dashboard' && <DashboardMain handleNewSessionClick={handleNewSessionClick} />}
          {activeTab === 'Sessions' && <SessionsMain />}
          {activeTab === 'Journal' && <JournalMain />}
          {activeTab === 'Analytics' && <AnalyticsMain />}
        </div>
      </main>
      
      <button 
        onClick={handleNewSessionClick}
        className="fixed bottom-6 right-6 btn-primary flex items-center gap-2 rounded-xl px-5 py-3 shadow-lg"
      >
        <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
        <span className="font-medium">New Session</span>
      </button>
      
      <SessionCreationDialog 
        isOpen={isSessionDialogOpen} 
        onClose={handleCloseSessionDialog} 
      />
    </div>
  );
}
