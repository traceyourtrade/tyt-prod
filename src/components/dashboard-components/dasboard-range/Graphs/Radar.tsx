'use client';

import React from 'react';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

function valueFormatter(v: number | null) {
    if (v === null) {
        return 'NaN';
    }
    return `${v.toLocaleString()}t CO2eq/pers`;
}

export default function MultiSeriesRadar() {
    return (
        <ThemeProvider theme={darkTheme}>
            <div className="w-[95%] max-w-[600px] h-auto min-h-[350px] flex flex-col items-center justify-start font-['Inter'] bg-[#141414] rounded-xl mt-5 shadow-[0_25px_45px_rgba(0,0,0,0.1)] border border-[#1b1b1b]">
                <h2 className="w-full text-white text-lg text-center border-b border-gray-500 pb-4 mt-3 mb-5">
                    Radar Chart <FontAwesomeIcon icon={faCircleInfo} className="text-xs relative -top-0.5 -right-1 cursor-pointer" />
                </h2>
                <RadarChart
                    width={450}
                    height={300}
                    series={[
                        { label: 'This Month', data: [6.65, 2.76, 5.15, 0.19, 0.07, 0.12], valueFormatter }, 
                        { label: 'Last Month', data: [5.52, 5.5, 3.19, 0.51, 0.15, 0.11], valueFormatter }, 
                        { label: 'Overall', data: [2.26, 0.29, 2.03, 0.05, 0.04, 0.06], valueFormatter }
                    ]}
                    radar={{
                        metrics: ['Win %', 'Consistency', 'Profit Factor', 'RR Ratio', 'Max Drawdown', 'Recovery Factor'],
                    }}
                />
            </div>
        </ThemeProvider>
    );
}