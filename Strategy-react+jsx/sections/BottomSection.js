import React from "react";
import "./style/bottomSection.css";
import OverView from "./sections/overview/Overview";
import Reports from "./sections/reports/Reports";
import Compare from "./sections/compare/Compare";
import Strategies from "./sections/strategies/Strategies";

const BottomSection = ({ selectedTab, selected, allStrategies, strategies, strategiesDataObj }) => {

    return (

        <div className="bottom-section">

            {selectedTab === "Strategies" && <Strategies selected={selected} allStrategies={allStrategies} strategies={strategies} strategiesDataObj={strategiesDataObj} />}

            {selectedTab === "Overview" && <OverView selected={selected} strategiesDataObj={strategiesDataObj} />}

            {selectedTab === "Reports" && <Reports selected={selected} strategiesDataObj={strategiesDataObj} />}

            {selectedTab === "Compare" && <Compare selected={selected} strategiesDataObj={strategiesDataObj} />}

        </div>

    );
};

export default BottomSection;
