import StrategyDropdown from "./components/StrategyDropdown";
import DateRangeDropdown from "./components/date-range/DateRangeDropdown";
import "./style/topSection.css";

const TopSection = ({ selectedTab, setSelectedTab, allStrategies, selected, setSelected, setFDate, setTDate }) => {

  const tabs = ["Strategies", "Overview", "Reports", "Compare"];

  return (

    <div className="top-section">

      <div className="top-left">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${selectedTab === tab ? "active" : ""}`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="top-right">
        <StrategyDropdown allStrategies={allStrategies} selected={selected} setSelected={setSelected} />
        <DateRangeDropdown setFDate={setFDate} setTDate={setTDate} />
      </div>

    </div>
  );

};

export default TopSection;
