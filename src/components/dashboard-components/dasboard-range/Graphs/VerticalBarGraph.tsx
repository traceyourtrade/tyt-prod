'use client';

import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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
                label: "P&L",
                data: data.map((d) => d.value),
                backgroundColor: data.map((d) =>
                    d.value >= 0 ? "rgba(78, 191, 148, 0.6)" : "rgba(239, 68, 68, 0.6)"
                ),
                borderColor: data.map((d) =>
                    d.value >= 0 ? "#4EBF94" : "#EF4444"
                ),
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 'flex' as const,
                maxBarThickness: 40,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function (tooltipItem: any) {
                        const item = data[tooltipItem.dataIndex];
                        const value = item.value >= 0 ? `+$${item.value.toFixed(2)}` : `-$${Math.abs(item.value).toFixed(2)}`;
                        return item.Item ? `${item.Item}: ${value}` : value;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: 'rgba(156, 163, 175, 0.8)',
                    font: {
                        size: 10,
                    },
                    maxRotation: 45,
                    minRotation: 0,
                },
                border: {
                    display: false,
                },
            },
            y: {
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                },
                ticks: {
                    color: 'rgba(156, 163, 175, 0.8)',
                    font: {
                        size: 10,
                    },
                    callback: function(value: number | string) {
                        const numValue = typeof value === 'string' ? parseFloat(value) : value;
                        return numValue >= 0 ? `$${numValue}` : `-$${Math.abs(numValue)}`;
                    },
                },
                border: {
                    display: false,
                },
            },
        },
    };

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No trade data available
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default ChartComponent;
