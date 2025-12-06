"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Settings, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import { WIDGET_REGISTRY, getWidgetById } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';

interface WidgetWrapperProps {
  children: React.ReactNode;
  widgetId: string;
  className?: string;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ 
  children, 
  widgetId,
  className,
}) => {
  const { isEditMode, toggleWidgetVisibility, layout } = useDashboardLayoutStore();
  const widget = getWidgetById(widgetId);
  const layoutItem = layout.find(l => l.widgetId === widgetId);

  if (!layoutItem?.visible && !isEditMode) {
    return null;
  }

  return (
    <div 
      className={cn(
        "h-full w-full relative group",
        isEditMode && "ring-2 ring-dashed ring-primary/30 rounded-xl cursor-move",
        !layoutItem?.visible && "opacity-40",
        className
      )}
    >
      {isEditMode && (
        <>
          <div className="absolute -top-2 -right-2 z-20 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-lg p-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWidgetVisibility(widgetId);
              }}
              className="p-1.5 hover:bg-muted rounded"
              title={layoutItem?.visible ? "Hide widget" : "Show widget"}
            >
              {layoutItem?.visible ? (
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
          
          <div className="absolute top-2 left-2 z-20">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
              {widget?.name || widgetId}
            </span>
          </div>
        </>
      )}
      
      <div className={cn("h-full w-full overflow-hidden", isEditMode && "pt-6")}>
        {children}
      </div>
    </div>
  );
};

export const SortableWidget = WidgetWrapper;
export const DraggableWidget = WidgetWrapper;

interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface ResizableGridProps {
  children: React.ReactNode;
  gridItems: GridItem[];
  onLayoutChange: (layout: GridItem[]) => void;
  cols?: number;
  rowHeight?: number;
}

export const ResizableGrid: React.FC<ResizableGridProps> = ({ 
  children, 
  gridItems, 
  onLayoutChange,
  cols = 12,
  rowHeight = 100
}) => {
  const { isEditMode } = useDashboardLayoutStore();
  const [mounted, setMounted] = useState(false);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    setMounted(true);
    const updateWidth = () => {
      const container = document.getElementById('dashboard-grid-container');
      if (container) {
        setWidth(container.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!mounted) {
    return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>;
  }

  return (
    <div id="dashboard-grid-container" className="w-full">
      <GridLayout
        className="layout"
        layout={gridItems}
        cols={cols}
        rowHeight={rowHeight}
        width={width}
        onLayoutChange={(newLayout) => {
          onLayoutChange(newLayout.map(item => ({
            i: item.i,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            minW: item.minW,
            minH: item.minH
          })));
        }}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {React.Children.map(children, (child) => child)}
      </GridLayout>
    </div>
  );
};

interface EditModeToolbarProps {
  className?: string;
}

export const EditModeToolbar: React.FC<EditModeToolbarProps> = ({ className }) => {
  const { isEditMode, toggleEditMode, resetLayout, layout, toggleWidgetVisibility, resetGridPositions } = useDashboardLayoutStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const hiddenWidgets = layout.filter(l => !l.visible);
  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={toggleEditMode}
          className="gap-2"
        >
          {isEditMode ? (
            <>
              <X className="h-4 w-4" />
              Done
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              Customize
            </>
          )}
        </Button>
        
        {isEditMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetPicker(!showWidgetPicker)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Widgets {hiddenWidgets.length > 0 && `(${hiddenWidgets.length} hidden)`}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetLayout();
                resetGridPositions?.();
              }}
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <span className="text-xs text-muted-foreground ml-2">
              Drag to move, drag corners to resize
            </span>
          </>
        )}
      </div>

      {showWidgetPicker && isEditMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Manage Widgets</h3>
              <button 
                onClick={() => setShowWidgetPicker(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
              <p className="text-xs text-muted-foreground mb-3">
                Toggle widget visibility. Drag widgets to reposition, drag corners to resize.
              </p>
              {sortedLayout.map((layoutItem) => {
                const widget = WIDGET_REGISTRY.find(w => w.id === layoutItem.widgetId);
                if (!widget) return null;
                
                return (
                  <div 
                    key={widget.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      layoutItem.visible 
                        ? "bg-card border-border" 
                        : "bg-muted/30 border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className={cn("font-medium text-sm", !layoutItem.visible && "text-muted-foreground")}>
                          {widget.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        layoutItem.visible 
                          ? "bg-primary/10 text-primary hover:bg-primary/20" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {layoutItem.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const WidgetGrid = ResizableGrid;

export default WidgetWrapper;
