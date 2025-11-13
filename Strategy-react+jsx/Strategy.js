import { useState, useMemo } from "react";
import TopSection from "./sections/TopSection";
import BottomSection from "./sections/BottomSection";
import "./Strategy.css";
import useAccountDetails from "../Store/accountdetails";

const Strategy = () => {
    const [selectedTab, setSelectedTab] = useState("Strategies");
    const [fDate, setFDate] = useState("");
    const [toDate, setTDate] = useState("");

    const { strategies, selectedAccounts } = useAccountDetails();

    // Convert strategies array to list of strategy names
    const allStrategies = strategies.map((s) => s.strategy);
    const [selected, setSelected] = useState(allStrategies);

    // ✅ Memoize strategiesDataObj so it recalculates only when dependencies change
    const strategiesDataObj = useMemo(() => {
        const result = {};

        selectedAccounts.forEach((account) => {
            if (!account.tradeData) return;

            account.tradeData.forEach((trade) => {
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
        <div className="dashboard-section">
            <TopSection
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
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

export default Strategy;