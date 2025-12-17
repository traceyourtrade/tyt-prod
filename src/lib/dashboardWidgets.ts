export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: 'stats' | 'charts' | 'calendar' | 'tables';
  defaultSize: WidgetSize;
  minCols: number;
  minRows: number;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'stats-overview',
    name: 'Stats Overview',
    description: 'Key metrics: P&L, Win Rate, Profit Factor, Balance, R:R',
    category: 'stats',
    defaultSize: 'full',
    minCols: 5,
    minRows: 1,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Monthly trading calendar with P&L',
    category: 'calendar',
    defaultSize: 'large',
    minCols: 2,
    minRows: 2,
  },
  {
    id: 'cumulative-pnl',
    name: 'Cumulative P&L',
    description: 'Line chart showing cumulative profit over time',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'trades-table',
    name: 'Recent Trades',
    description: 'Table of recent trades',
    category: 'tables',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'daily-pnl-bar',
    name: 'Daily P&L Bar',
    description: 'Bar chart of daily profit/loss',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'day-of-week',
    name: 'Day of Week',
    description: 'P&L breakdown by day of week',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'symbol-pnl',
    name: 'Symbol P&L',
    description: 'P&L breakdown by trading symbol',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'hourly-pnl',
    name: 'Hourly P&L',
    description: 'P&L breakdown by hour of day',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'radar',
    name: 'Performance Radar',
    description: 'Radar chart showing performance metrics',
    category: 'charts',
    defaultSize: 'large',
    minCols: 2,
    minRows: 1,
  },
  {
    id: 'trade-duration',
    name: 'Trade Duration',
    description: 'Scatter plot showing P&L vs trade duration',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'win-rate-metrics',
    name: 'Win Rate Metrics',
    description: 'Win %, Avg Win, Avg Loss over time',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'daily-cumulative-pnl',
    name: 'Daily & Cumulative P&L',
    description: 'Combined daily bars and cumulative equity line',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'drawdown',
    name: 'Drawdown',
    description: 'Peak-to-trough drawdown chart',
    category: 'charts',
    defaultSize: 'medium',
    minCols: 1,
    minRows: 1,
  },
  {
    id: 'progress-tracker',
    name: 'Progress Tracker',
    description: 'GitHub-style trading activity heatmap',
    category: 'charts',
    defaultSize: 'large',
    minCols: 2,
    minRows: 1,
  },
];

export interface WidgetLayoutItem {
  widgetId: string;
  order: number;
  visible: boolean;
  cols: number;
}

export const DEFAULT_DASHBOARD_LAYOUT: WidgetLayoutItem[] = [
  { widgetId: 'stats-overview', order: 0, visible: true, cols: 5 },
  { widgetId: 'calendar', order: 1, visible: true, cols: 2 },
  { widgetId: 'cumulative-pnl', order: 2, visible: true, cols: 1 },
  { widgetId: 'trades-table', order: 3, visible: true, cols: 1 },
  { widgetId: 'daily-pnl-bar', order: 4, visible: true, cols: 1 },
  { widgetId: 'day-of-week', order: 5, visible: true, cols: 1 },
  { widgetId: 'symbol-pnl', order: 6, visible: true, cols: 1 },
  { widgetId: 'hourly-pnl', order: 7, visible: true, cols: 1 },
  { widgetId: 'radar', order: 8, visible: true, cols: 2 },
  { widgetId: 'trade-duration', order: 9, visible: true, cols: 1 },
  { widgetId: 'win-rate-metrics', order: 10, visible: true, cols: 1 },
  { widgetId: 'daily-cumulative-pnl', order: 11, visible: true, cols: 1 },
  { widgetId: 'drawdown', order: 12, visible: true, cols: 1 },
  { widgetId: 'progress-tracker', order: 13, visible: true, cols: 2 },
];

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find(w => w.id === id);
}
