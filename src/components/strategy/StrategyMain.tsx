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
import Cookies from "js-cookie";
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
  { id: 'strategies', label: 'Strategies', path: '/strategy/strategies' },
  { id: 'overview', label: 'Overview', path: '/strategy/overview' },
  { id: 'reports', label: 'Reports', path: '/strategy/reports' },
  { id: 'compare', label: 'Compare', path: '/strategy/compare' },
]
const StrategyMain = () => {
  const [fDate, setFDate] = useState<string>("");
  const [toDate, setTDate] = useState<string>("");
  const { strategies, selectedAccounts,setAccounts } = useAccountDetails();
    const tokenn = Cookies.get("Trace Your Trades");
    const userId:string = Cookies.get("userId")||"";
  useEffect(()=>{
setAccounts(userId,tokenn||"");
  },[tokenn,userId,setAccounts])
  
  const router = useRouter()
  const pathname = usePathname()
  const [selectedTab, setSelectedTab] = useState<TabType>(pathname.split('/')[2] as TabType || 'strategies');
useEffect(()=>{
  if(pathname.split('/')[2]==undefined){
    
  router.replace('/strategy/strategies')
  }
},[])


const handleTabChange = (tabIndex: number) => {
  const newTab = tabs[tabIndex]
  setSelectedTab(newTab.id)
  router.push(newTab.path)
}

    // Convert strategies array to list of strategy names
    const allStrategies= strategies.map((s: StrategyType) => s.strategy);
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
        <div className="w-[98%] min-h-[80vh] bg-[#0f0f0f] text-white flex flex-col p-5 rounded-xl mt-[50px]">
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
    <div className="flex justify-between items-center p-[15px_0] flex-wrap">
      <div className="flex gap-[15px]">
        {tabs.map((tab,index) => (
          <button
            key={tab.id}
            className={`px-[18px] py-2 rounded-lg border-none cursor-pointer transition-all duration-200 ${
              selectedTab === tab.id 
                ? "bg-[#8477f3] text-white shadow-[0_0_24px_rgba(255,255,255,0.158)] transition-transform duration-200 ease-[ease] hover:transform hover:scale-105" 
                : "bg-[#1f1f1f] text-[#aaa]"
            }`}
            onClick={() => handleTabChange(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex">
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
        <div className="flex-1 mt-5 bg-[#1a1a1a] rounded-xl p-6">
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