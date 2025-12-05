"use client"
import DateRangeDropdown from "@/components/strategy/components/DateRangeDropdown";
import StrategyDropdown from "@/components/strategy/components/StrategyDropdown";
import { useState, useMemo, useEffect } from "react";
import Strategies from "./strategies/StrategyStrategiesMain";
import OverviewSection from "./overview/StrategyOverviewMain";
import Reports from "./reports/StrategyReportsMain";
import Compare from "./compare/StrategyCompareMain";
import useAccountDetails from "@/store/accountdetails";
import { useRouter, usePathname } from 'next/navigation'

interface StrategyType {
  strategy?: string;
  [key: string]: any;
}

interface Trade {
  date: string;
  strategy: string;
  [key: string]: any;
}

interface Account {
  tradeData?: Trade[];
  [key: string]: any;
}

interface TopSectionProps {
  selectedTab: string;
  handleTabChange: (index: number) => void;
  [key:string]:any;
  selected: string[];
  setSelected: (strategies: string[]) => void;
  setFDate: (date: string) => void;
  setTDate: (date: string) => void;
}

interface BottomSectionProps {
  selectedTab: string;
  selected: string[];
  [key:string]:any;
  strategies: StrategyType[];
  strategiesDataObj: { [key: string]: any[] };
}
type TabType = 'strategies' | 'overview' | 'reports' | 'compare' 

// Define tabs outside component or use useMemo to prevent recreation
const tabs: { id: TabType; label: string; path: string }[] = [
  { id: 'strategies', label: 'Strategies', path: '/strategies/strategies' },
  { id: 'overview', label: 'Overview', path: '/strategies/overview' },
  { id: 'reports', label: 'Reports', path: '/strategies/reports' },
  { id: 'compare', label: 'Compare', path: '/strategies/compare' },
]
const StrategyMain = () => {
  const [fDate, setFDate] = useState<string>("");
  const [toDate, setTDate] = useState<string>("");
  const { strategies, selectedAccounts, setAccounts } = useAccountDetails();
  
  useEffect(() => {
    setAccounts();
  }, [setAccounts]);
  
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState<TabType>(pathname.split('/')[2] as TabType || 'strategies');
  
  useEffect(() => {
    if (pathname.split('/')[2] === undefined) {
      router.replace('/strategies/strategies');
    }
  }, [pathname, router]);

  const handleTabChange = (tabIndex: number) => {
    const newTab = tabs[tabIndex];
    setSelectedTab(newTab.id);
    router.push(newTab.path);
  };

  // Convert strategies array to list of strategy names, filtering out undefined
  const allStrategies: string[] = strategies
    .map((s: StrategyType) => s.strategy)
    .filter((name): name is string => name !== undefined && name !== null);
  
  const [selected, setSelected] = useState<string[]>(allStrategies);

    // ✅ Memoize strategiesDataObj so it recalculates only when dependencies change
    const strategiesDataObj = useMemo(() => {
        const result: { [key: string]: Trade[] } = {};

        selectedAccounts.forEach((account: Account) => {
            if (!account.tradeData) return;

            account.tradeData.forEach((trade: Trade) => {
                const tradeDate = new Date(trade.date); // trade.date format: "YYYY-MM-DD"

                // --- 📅 Filter trades by fDate & toDate ---
                // If either fDate or toDate are blank, we include all trades
                const includeTrade =
                    (!fDate && !toDate) ||
                    (fDate && !toDate && tradeDate >= new Date(fDate)) ||
                    (!fDate && toDate && tradeDate <= new Date(toDate)) ||
                    (fDate &&
                        toDate &&
                        tradeDate >= new Date(fDate) &&
                        tradeDate <= new Date(toDate));

                if (!includeTrade) return;

                const strategy = trade.strategy || "Uncategorized";

                if (!result[strategy]) result[strategy] = [];
                result[strategy].push(trade);
            });
        });

        return result;
    }, [selectedAccounts, fDate, toDate]);

    return (
        <div className="w-full min-h-[80vh] bg-background text-foreground flex flex-col p-6">
            <TopSection
                selectedTab={selectedTab}
                handleTabChange={handleTabChange}
                allStrategies={allStrategies}
                selected={selected}
                setSelected={setSelected}
                setFDate={setFDate}
                setTDate={setTDate}
            />

            <BottomSection
                selectedTab={selectedTab}
                selected={selected}
                allStrategies={allStrategies}
                strategies={strategies}
                strategiesDataObj={strategiesDataObj}
                fDate={fDate}
                toDate={toDate}
            />
        </div>
    );
};
const TopSection = ({ 
  selectedTab, 
  handleTabChange, 
  allStrategies, 
  selected, 
  setSelected, 
  setFDate, 
  setTDate 
}: TopSectionProps) => {


  return (
    <div className="flex justify-between items-center py-4 flex-wrap gap-4 border-b border-border mb-4">
      <div className="flex gap-2">
        {tabs.map((tab,index) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-lg border cursor-pointer transition-all duration-200 text-sm font-medium ${
              selectedTab === tab.id 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => handleTabChange(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <StrategyDropdown allStrategies={allStrategies} selected={selected} setSelected={setSelected} />
        <DateRangeDropdown setFDate={setFDate} setTDate={setTDate} />
      </div>
    </div>
  );
};

const BottomSection = ({ 
  selectedTab, 
  selected, 
  allStrategies, 
  strategies, 
  strategiesDataObj 
}: BottomSectionProps) => {

    return (
        <div className="flex-1 bg-card border border-border rounded-xl p-6">
            {selectedTab === "strategies" && (
                <Strategies
                    selected={selected} 
                    allStrategies={allStrategies} 
                    strategies={strategies} 
                    strategiesDataObj={strategiesDataObj} 
                />
            )}

            {selectedTab === "overview" && (
                <OverviewSection
                    selected={selected} 
                    strategiesDataObj={strategiesDataObj} 
                />
            )}

            {selectedTab === "reports" && (
                <Reports
                    selected={selected} 
                    strategiesDataObj={strategiesDataObj} 
                />
            )}

            {selectedTab === "compare" && (
                <Compare
                    selected={selected} 
                    strategiesDataObj={strategiesDataObj} 
                />
            )}
        </div>
    );
};



export default StrategyMain;