'use client';

import React, { useEffect, useState } from 'react';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

function valueFormatter(v: number | null) {
    if (v === null) {
        return 'N/A';
    }
    return `${v.toFixed(2)}`;
}

export default function MultiSeriesRadar() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
        
        return () => observer.disconnect();
    }, []);

    const theme = createTheme({
        palette: {
            mode: isDark ? "dark" : "light",
            primary: {
                main: '#2563EB',
            },
            background: {
                default: isDark ? '#151515' : '#ffffff',
                paper: isDark ? '#151515' : '#ffffff',
            },
            text: {
                primary: isDark ? '#e5e5e5' : '#171717',
                secondary: isDark ? '#737373' : '#737373',
            },
        },
        typography: {
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
    });

    const chartColors = isDark 
        ? ['#2563EB', '#22C55E', '#60A5FA'] 
        : ['#2563EB', '#22C55E', '#93C5FD'];

    return (
        <ThemeProvider theme={theme}>
            <div className={cn(
                "w-full max-w-[600px] flex flex-col items-center justify-start rounded-xl border transition-colors",
                "bg-card border-border"
            )}>
                <div className="w-full flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">
                        Performance Radar
                    </h2>
                    <button className="p-1 rounded-md hover:bg-muted transition-colors">
                        <Info className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                
                <div className="w-full p-4 flex items-center justify-center">
                    <RadarChart
                        width={400}
                        height={280}
                        series={[
                            { 
                                label: 'This Month', 
                                data: [6.65, 2.76, 5.15, 0.19, 0.07, 0.12], 
                                valueFormatter,
                                color: chartColors[0]
                            }, 
                            { 
                                label: 'Last Month', 
                                data: [5.52, 5.5, 3.19, 0.51, 0.15, 0.11], 
                                valueFormatter,
                                color: chartColors[1]
                            }, 
                            { 
                                label: 'Overall', 
                                data: [2.26, 0.29, 2.03, 0.05, 0.04, 0.06], 
                                valueFormatter,
                                color: chartColors[2]
                            }
                        ]}
                        radar={{
                            metrics: ['Win %', 'Consistency', 'Profit Factor', 'RR Ratio', 'Drawdown', 'Recovery'],
                        }}
                    />
                </div>
            </div>
        </ThemeProvider>
    );
}
