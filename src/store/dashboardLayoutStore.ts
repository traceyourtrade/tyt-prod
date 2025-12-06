import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WidgetLayoutItem, DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboardWidgets';

interface GridPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

const DEFAULT_GRID_POSITIONS: GridPosition[] = [
  { i: 'stats-overview', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
  { i: 'calendar', x: 0, y: 2, w: 8, h: 6, minW: 4, minH: 4 },
  { i: 'cumulative-pnl', x: 8, y: 2, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'trades-table', x: 8, y: 5, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'daily-pnl-bar', x: 0, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'day-of-week', x: 4, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'symbol-pnl', x: 8, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'hourly-pnl', x: 0, y: 11, w: 4, h: 3, minW: 3, minH: 2 },
  { i: 'radar', x: 4, y: 11, w: 4, h: 3, minW: 3, minH: 2 },
];

interface DashboardLayoutState {
  layout: WidgetLayoutItem[];
  gridPositions: GridPosition[];
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
  updateLayout: (newLayout: WidgetLayoutItem[]) => void;
  updateGridPositions: (positions: GridPosition[]) => void;
  moveWidget: (widgetId: string, newOrder: number) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  resetLayout: () => void;
  resetGridPositions: () => void;
  reorderWidgets: (sourceIndex: number, destIndex: number) => void;
  swapWidgets: (widgetId1: string, widgetId2: string) => void;
}

const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_DASHBOARD_LAYOUT,
      gridPositions: DEFAULT_GRID_POSITIONS,
      isEditMode: false,
      
      setEditMode: (enabled: boolean) => set({ isEditMode: enabled }),
      
      toggleEditMode: () => set(state => ({ isEditMode: !state.isEditMode })),
      
      updateLayout: (newLayout: WidgetLayoutItem[]) => set({ layout: newLayout }),
      
      updateGridPositions: (positions: GridPosition[]) => set({ gridPositions: positions }),
      
      resetGridPositions: () => set({ gridPositions: DEFAULT_GRID_POSITIONS }),
      
      moveWidget: (widgetId: string, newOrder: number) => {
        const { layout } = get();
        const updatedLayout = layout.map(item => {
          if (item.widgetId === widgetId) {
            return { ...item, order: newOrder };
          }
          return item;
        }).sort((a, b) => a.order - b.order);
        set({ layout: updatedLayout });
      },
      
      toggleWidgetVisibility: (widgetId: string) => {
        const { layout } = get();
        const updatedLayout = layout.map(item => {
          if (item.widgetId === widgetId) {
            return { ...item, visible: !item.visible };
          }
          return item;
        });
        set({ layout: updatedLayout });
      },
      
      resetLayout: () => set({ layout: DEFAULT_DASHBOARD_LAYOUT, gridPositions: DEFAULT_GRID_POSITIONS }),
      
      reorderWidgets: (sourceIndex: number, destIndex: number) => {
        const { layout } = get();
        const visibleWidgets = [...layout].filter(w => w.visible).sort((a, b) => a.order - b.order);
        const [movedWidget] = visibleWidgets.splice(sourceIndex, 1);
        visibleWidgets.splice(destIndex, 0, movedWidget);
        
        const updatedLayout = layout.map(item => {
          const newIndex = visibleWidgets.findIndex(w => w.widgetId === item.widgetId);
          if (newIndex !== -1) {
            return { ...item, order: newIndex };
          }
          return item;
        });
        
        set({ layout: updatedLayout });
      },
      
      swapWidgets: (widgetId1: string, widgetId2: string) => {
        const { layout } = get();
        const widget1 = layout.find(l => l.widgetId === widgetId1);
        const widget2 = layout.find(l => l.widgetId === widgetId2);
        
        if (!widget1 || !widget2) return;
        
        const updatedLayout = layout.map(item => {
          if (item.widgetId === widgetId1) {
            return { ...item, order: widget2.order };
          }
          if (item.widgetId === widgetId2) {
            return { ...item, order: widget1.order };
          }
          return item;
        });
        
        set({ layout: updatedLayout });
      },
    }),
    {
      name: 'dashboard-layout-v2',
    }
  )
);

export default useDashboardLayoutStore;
export type { GridPosition };
