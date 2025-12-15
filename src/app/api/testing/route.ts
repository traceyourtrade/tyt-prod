import {connectAccountsDB} from '@/lib/db/connect';
import { NextResponse } from 'next/server';

// Models will be defined here
const FilterStateSchema = {
  type: [String],
  assets: [String],
  side: [String],
  tags: [String],
  session: [String],
  strategy: [String],
  day: [String],
  time: String,
  timezone: String,
  backtestingDate: [String],
};

const AppliedFilterSchema = {
  type: String,
  value: String,
};

const SessionSchema = {
  id: Number,
  name: String,
  symbol: String,
  currentBalance: String,
  startDate: String,
  endDate: String,
  daysRemaining: Number,
  totalPnl: Number,
  winRate: Number,
  riskReward: Number,
  monthGainLoss: Number,
  weekGainLoss: Number,
  dailyGainLoss: Number,
};

const TradeSchema = {
  id: Number,
  name: String,
  date: String,
  symbol: String,
  position: String,
  roi: Number,
  entryPrice: Number,
  stopPrice: Number,
  maxRR: Number,
  status: String,
};

// In-memory data store (replace with actual database models)
let filtersData = {
  type: [],
  assets: [],
  side: [],
  tags: [],
  session: [],
  strategy: [],
  day: [],
  time: '00:00 - 23:59',
  timezone: 'Etc/UTC',
  backtestingDate: []
};

let appliedFiltersData = [
  { type: 'side', value: 'long, short' },
  { type: 'session', value: 'check tyt - 6d0f' },
  { type: 'timezone', value: 'Etc/UTC' },
  { type: 'time', value: '00:00 - 23:59' },
  { type: 'tags', value: 'Backtesting, Battles, & Prop Firm' }
];

let sessionsData = [
  {
    id: 1,
    name: 'check tyt',
    symbol: 'XAUUSD',
    currentBalance: '$100,007.01',
    startDate: 'Aug 1, 2025',
    endDate: 'Dec 5, 2025',
    daysRemaining: 123,
    totalPnl: 7.01,
    winRate: 50,
    riskReward: 1.00,
    monthGainLoss: 7.01,
    weekGainLoss: 7.01,
    dailyGainLoss: 7.01,
  }
];

let tradesData = [
  {
    id: 1,
    name: 'Aug 4, 2025',
    date: 'Dec 5, 2025, 8:27:46 PM',
    symbol: 'XAUUSD',
    position: 'Short',
    roi: -99.90,
    entryPrice: 3377.25100,
    stopPrice: 3400.70100,
    maxRR: 1.18,
    status: 'Open'
  },
  {
    id: 2,
    name: 'Aug 3, 2025',
    date: 'Dec 5, 2025, 8:13:50 PM',
    symbol: 'XAUUSD',
    position: 'Long',
    roi: 20.23,
    entryPrice: 3360.72600,
    stopPrice: 3340.50000,
    maxRR: 2.37,
    status: 'Open'
  }
];

let activeSessionData = 'check tyt';
let activeTabData = 'Dashboard';
let rowsPerPageData = 10;
let currentPageData = 1;

export async function GET(request) {
  await connectAccountsDB();
  
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'filters':
        return NextResponse.json({ filters: filtersData });
      case 'appliedFilters':
        return NextResponse.json({ appliedFilters: appliedFiltersData });
      case 'sessions':
        return NextResponse.json({ sessions: sessionsData });
      case 'trades':
        return NextResponse.json({ trades: tradesData });
      case 'state':
        return NextResponse.json({
          filters: filtersData,
          appliedFilters: appliedFiltersData,
          sessions: sessionsData,
          activeSession: activeSessionData,
          trades: tradesData,
          activeTab: activeTabData,
          rowsPerPage: rowsPerPageData,
          currentPage: currentPageData
        });
      default:
        return NextResponse.json({
          filters: filtersData,
          appliedFilters: appliedFiltersData,
          sessions: sessionsData,
          activeSession: activeSessionData,
          trades: tradesData,
          activeTab: activeTabData,
          rowsPerPage: rowsPerPageData,
          currentPage: currentPageData
        });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await connectAccountsDB();
  
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'setFilters':
        filtersData = { ...filtersData, ...data };
        return NextResponse.json({ filters: filtersData });
      case 'setAppliedFilters':
        appliedFiltersData = data;
        return NextResponse.json({ appliedFilters: appliedFiltersData });
      case 'addAppliedFilter':
        appliedFiltersData = [...appliedFiltersData, data];
        return NextResponse.json({ appliedFilters: appliedFiltersData });
      case 'removeAppliedFilter':
        const index = data;
        appliedFiltersData.splice(index, 1);
        return NextResponse.json({ appliedFilters: appliedFiltersData });
      case 'clearAllFilters':
        appliedFiltersData = [];
        return NextResponse.json({ appliedFilters: appliedFiltersData });
      case 'setActiveSession':
        activeSessionData = data;
        return NextResponse.json({ activeSession: activeSessionData });
      case 'updateSession':
        const { id, updates } = data;
        sessionsData = sessionsData.map(session => 
          session.id === id ? { ...session, ...updates } : session
        );
        return NextResponse.json({ sessions: sessionsData });
      case 'addSession':
        sessionsData = [...sessionsData, data];
        return NextResponse.json({ sessions: sessionsData });
      case 'setActiveTab':
        activeTabData = data;
        return NextResponse.json({ activeTab: activeTabData });
      case 'setRowsPerPage':
        rowsPerPageData = data;
        return NextResponse.json({ rowsPerPage: rowsPerPageData });
      case 'setCurrentPage':
        currentPageData = data;
        return NextResponse.json({ currentPage: currentPageData });
      default:
        return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}