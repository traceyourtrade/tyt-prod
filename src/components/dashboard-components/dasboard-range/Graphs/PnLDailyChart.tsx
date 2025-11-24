'use client';

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

interface DataPoint {
    time: string;
    value: number;
}

interface GradientAreaChartProps {
    data: DataPoint[];
}

const GradientAreaChart: React.FC<GradientAreaChartProps> = ({ data }) => {

    const checkValueStatus = (data: DataPoint[]) => {
        const hasPositive = data.some(d => d.value > 0);
        const hasNegative = data.some(d => d.value < 0);

        if (hasPositive && hasNegative) return "both";
        if (hasPositive) return true;
        if (hasNegative) return false;

        return "both";
    };

    const status = checkValueStatus(data);

    const calculateOffset = (data: DataPoint[]) => {
        const values = data.map(d => d.value);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        if (minValue >= 0) return "0%";
        if (maxValue <= 0) return "100%";

        return `${(maxValue / (maxValue - minValue)) * 100}%`;
    };

    const zeroOffset = calculateOffset(data);

    return (
        <div className="w-[95%] max-w-[600px] h-auto min-h-[350px] flex flex-col items-center justify-start font-['Inter'] bg-[#72717122] rounded-[25px] ">
            <h2 className="w-full text-white text-lg text-center border-b border-gray-500 pb-4 mt-3">
                Net Cumulative P&L <FontAwesomeIcon icon={faCircleInfo} className="text-xs relative -top-0.5 -right-1 cursor-pointer" />
            </h2>

            {status === "both" ? (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="strictGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(96, 187, 165)" stopOpacity={1} />
                                <stop offset={zeroOffset} stopColor="rgba(96, 187, 164, 0.04)" stopOpacity={1} />
                                <stop offset={zeroOffset} stopColor="rgba(179, 22, 22, 0.08)" stopOpacity={1} />
                                <stop offset="100%" stopColor="rgb(239, 92, 92)" stopOpacity={0.7} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="time" 
                            stroke="rgba(255, 255, 255, 0.51)" 
                            tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
                        />
                        <YAxis
                            stroke="rgba(255, 255, 255, 0.51)"
                            tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
                            tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
                            interval={0}
                            minTickGap={2}
                            tickCount={10}
                        />

                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: "#222", 
                                color: "white", 
                                border: "1px solid white" 
                            }} 
                        />

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="white"
                            fill="url(#strictGradient)"
                            fillOpacity={1}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : status === true ? (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(96, 187, 165)" stopOpacity={1} />
                                <stop offset="100%" stopColor="rgba(96, 187, 164, 0.04)" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="time" 
                            stroke="rgba(255, 255, 255, 0.51)" 
                            tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
                        />
                        <YAxis
                            stroke="rgba(255, 255, 255, 0.51)"
                            tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
                            tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
                            interval={0}
                            minTickGap={2}
                            tickCount={10}
                        />

                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: "#222", 
                                color: "white", 
                                border: "1px solid white" 
                            }} 
                        />

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="white"
                            fill="url(#positiveGradient)"
                            fillOpacity={1}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : status === false ? (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(239, 92, 92, 0.35)" stopOpacity={1} />
                                <stop offset="100%" stopColor="rgba(179, 22, 22, 0.7)" stopOpacity={1} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="rgb(80, 80, 80)" strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="time" 
                            stroke="rgba(255, 255, 255, 0.51)" 
                            tick={{ fill: "rgba(255, 255, 255, 0.51)" }} 
                        />
                        <YAxis
                            stroke="rgba(255, 255, 255, 0.51)"
                            tick={{ fill: "rgba(255, 255, 255, 0.51)" }}
                            tickFormatter={(value) => value < 0 ? `-$${Math.abs(value)}` : `$${value}`}
                            interval={0}
                            minTickGap={2}
                            tickCount={10}
                        />

                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: "#222", 
                                color: "white", 
                                border: "1px solid white" 
                            }} 
                        />

                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="white"
                            fill="url(#negativeGradient)"
                            fillOpacity={1}
                            isAnimationActive={true}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : null}
        </div>
    );
};

export default GradientAreaChart;