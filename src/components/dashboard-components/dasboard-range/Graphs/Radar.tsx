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
    const [isDark, setIsDark] = useState(true);
    const [chartColors, setChartColors] = useState<string[]>([]);

    useEffect(() => {
        const checkDarkMode = () => {
            const dark = document.documentElement.classList.contains('dark');
            setIsDark(dark);
            
            const root = document.documentElement;
            const computedStyle = getComputedStyle(root);
            const foreground = computedStyle.getPropertyValue('--foreground').trim();
            
            if (dark) {
                setChartColors([
                    'rgba(255,255,255,0.6)', 
                    'rgba(255,255,255,0.35)', 
                    'rgba(255,255,255,0.15)'
                ]);
            } else {
                setChartColors([
                    'rgba(0,0,0,0.7)', 
                    'rgba(0,0,0,0.4)', 
                    'rgba(0,0,0,0.2)'
                ]);
            }
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
            background: {
                default: 'transparent',
                paper: 'transparent',
            },
            text: {
                primary: isDark ? 'rgba(255,255,255,0.7)' : '#171717',
                secondary: isDark ? 'rgba(255,255,255,0.4)' : '#737373',
            },
        },
        typography: {
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
    });

    if (chartColors.length === 0) {
        return (
            <div className="w-full flex items-center justify-center h-[340px] bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl">
                <span className="text-muted-foreground text-sm">Loading...</span>
            </div>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <div className={cn(
                "w-full flex flex-col items-center justify-start rounded-2xl border transition-colors",
                "bg-card/50 backdrop-blur-sm border-border/50"
            )}>
                <div className="w-full flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-foreground">
                            Performance Radar
                        </h2>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Info className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                
                <div className="w-full p-4 flex flex-col items-center justify-center">
                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[0] }} />
                            <span className="text-[10px] text-muted-foreground font-medium">This Month</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[1] }} />
                            <span className="text-[10px] text-muted-foreground font-medium">Last Month</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[2] }} />
                            <span className="text-[10px] text-muted-foreground font-medium">Overall</span>
                        </div>
                    </div>
                    
                    <RadarChart
                        width={360}
                        height={260}
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
