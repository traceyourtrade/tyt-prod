'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  TrendingUp, 
  LayoutGrid, 
  FileBarChart, 
  GitCompare, 
  Calendar,
  ChevronRight
} from 'lucide-react'
import PerformanceMain from './performance/PerformanceMain'
import OverviewMain from './overview/OverviewMain'
import CompareMain from './compare/CompareMain'
import CalendarMain from './calendar/CalendarMain'
import SubReport from './sub-report/SubReport'
import useAccountDetails from '@/store/accountdetails'

type TabType = 'performance' | 'overview' | 'sub-reports' | 'compare' | 'calendar'

const tabs: { id: TabType; label: string; path: string; icon: React.ReactNode }[] = [
  { id: 'performance', label: 'Performance', path: '/reports/performance', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'overview', label: 'Overview', path: '/reports/overview', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'sub-reports', label: 'Reports', path: '/reports/sub-reports', icon: <FileBarChart className="h-4 w-4" /> },
  { id: 'compare', label: 'Compare', path: '/reports/compare', icon: <GitCompare className="h-4 w-4" /> },
  { id: 'calendar', label: 'Calendar', path: '/reports/calendar', icon: <Calendar className="h-4 w-4" /> }
]

export default function ReportsMain() {
  const { setAccounts } = useAccountDetails()

  useEffect(() => {
    setAccounts()
  }, [setAccounts])

  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<TabType>(pathname.split('/')[2] as TabType || 'performance')

  useEffect(() => {
    if (pathname.split('/')[2] === undefined) {
      router.replace('/reports/performance')
    }
  }, [pathname, router])

  const handleTabChange = (tabIndex: number) => {
    const newTab = tabs[tabIndex]
    setActiveTab(newTab.id)
    router.push(newTab.path)
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header with Tab Navigation */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 md:px-6">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-1 py-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(index)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Tabs - Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide py-2">
            <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(index)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        <div className="animate-fade-in">
          {activeTab === 'performance' && <PerformanceMain />}
          {activeTab === 'overview' && <OverviewMain />}
          {activeTab === 'sub-reports' && <SubReport />}
          {activeTab === 'compare' && <CompareMain />}
          {activeTab === 'calendar' && <CalendarMain />}
        </div>
      </div>
    </div>
  )
}
