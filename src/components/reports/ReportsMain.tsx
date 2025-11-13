'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import PerformanceMain from './performance/PerformanceMain'
import OverviewMain from './overview/OverviewMain'
import CompareMain from './compare/CompareMain'
import CalendarMain from './calendar/CalendarMain'
import SubReport from './sub-report/SubReport'
import useAccountDetails from '@/store/accountdetails'
import Cookies from 'js-cookie'


type TabType = 'performance' | 'overview' | 'sub-reports' | 'compare' | 'calendar'

// Define tabs outside component or use useMemo to prevent recreation
const tabs: { id: TabType; label: string; path: string }[] = [
  { id: 'performance', label: 'Performance', path: '/reports/performance' },
  { id: 'overview', label: 'Overview', path: '/reports/overview' },
  { id: 'sub-reports', label: 'Reports', path: '/reports/sub-reports' },
  { id: 'compare', label: 'Compare', path: '/reports/compare' },
  { id: 'calendar', label: 'Calendar', path: '/reports/calendar' }
]
export default function ReportsMain() {
    const { setAccounts } = useAccountDetails()

useEffect(() => {
  const tokenn = Cookies.get('Trace Your Trades') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODliMjE3OTFlZjQ5NWQyZGIyZGJjMmEiLCJpYXQiOjE3NjI5NjAwMzQsImV4cCI6MTc2MzM5MjAzNH0.CdTTCmSX6SW39nnnr_Uo0eyfsQnRURn8Wk-vd_YyOyc'
  // For now, we'll use a placeholder userId - in production, this should come from params or session
  const userId = 'SJCx5EJ3Zh2J' // Default/fallback userId
  if (userId && tokenn) {
    console.log('Reports page: Calling setAccounts')
    setAccounts(userId, tokenn)
  } else {
    console.warn('Reports page: Missing userId or tokenn', { userId, tokenn: tokenn ? '***' : 'missing' })
  }
}, [setAccounts])
 const router = useRouter()
const pathname = usePathname()
const [activeTab, setActiveTab] = useState<TabType>(pathname.split('/')[2] as TabType || 'performance')

useEffect(()=>{
  if(pathname.split('/')[2]==undefined){
    
  router.replace('/reports/performance')
  }
},[])


const handleTabChange = (tabIndex: number) => {
  const newTab = tabs[tabIndex]
  setActiveTab(newTab.id)
  router.push(newTab.path)
}

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-[#333] bg-[#0f0f0f]">
        <div className="flex gap-0">
          {tabs.map((tab,index) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(index)}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#59c0a4] text-[#59c0a4]'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#0f0f0f] p-6">
        {activeTab === 'performance' && <PerformanceMain />}
        {activeTab === 'overview' && <OverviewMain />}
        {activeTab === 'sub-reports' && <SubReport />}
        {activeTab === 'compare' && <CompareMain />}
        {activeTab === 'calendar' && <CalendarMain />}
      </div>
    </div>
  )
}
