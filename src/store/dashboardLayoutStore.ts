import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WidgetLayoutItem, DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboardWidgets';

interface DashboardLayoutState {
  layout: WidgetLayoutItem[];
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
  updateLayout: (newLayout: WidgetLayoutItem[]) => void;
  moveWidget: (widgetId: string, newOrder: number) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  resetLayout: () => void;
  reorderWidgets: (sourceIndex: number, destIndex: number) => void;
}

const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_DASHBOARD_LAYOUT,
      isEditMode: false,
      
      setEditMode: (enabled: boolean) => set({ isEditMode: enabled }),
      
      toggleEditMode: () => set(state => ({ isEditMode: !state.isEditMode })),
      
      updateLayout: (newLayout: WidgetLayoutItem[]) => set({ layout: newLayout }),
      
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
      
      resetLayout: () => set({ layout: DEFAULT_DASHBOARD_LAYOUT }),
      
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
    }),
    {
      name: 'dashboard-layout',
    }
  )
);

export default useDashboardLayoutStore;
