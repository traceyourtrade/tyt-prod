'use client';

import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Title,
} from "chart.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Title);

interface ChartData {
    time: string;
    value: number;
    Item?: string;
}

interface ChartComponentProps {
    data: ChartData[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data }) => {
    const chartData = {
        labels: data.map((d) => d.time),
        datasets: [
            {
                label: "Price",
                data: data.map((d) => d.value),
                backgroundColor: data.map((d) =>
                    d.value >= 0 ? "rgba(21, 147, 132, 0.43)" : "rgba(255, 119, 119, 0.32)"
                ),
                borderColor: data.map((d) =>
                    d.value >= 0 ? "#2fa87a" : "rgba(255, 119, 119, 1)"
                ),
                borderWidth: 0,
                barThickness: 25,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (tooltipItem: any) {
                        let item = data[tooltipItem.dataIndex];
                        return `${item.Item}: ${item.value}`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Time",
                },
                categoryPercentage: 0.5,
                barPercentage: 0.5,
            },
            y: {
                title: {
                    display: true,
                    text: "Price",
                },
                grid: {
                    drawBorder: false,
                    color: (context: any) => {
                        if (context.tick.value === 0) {
                            return "#bebebe";
                        }
                        return "rgba(0, 0, 0, 0.1)";
                    },
                },
            },
        },
    };

    return (
        <div className="vertical-graph">
            <h2 className="w-full text-white text-lg text-center border-b border-gray-500 pb-4 mt-3">
                Net Daily P&L <FontAwesomeIcon icon={faCircleInfo} className="text-xs relative -top-0.5 -right-1 cursor-pointer" />
            </h2>
            <div className="chart-container">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default ChartComponent;