"use client";

import React, { useState } from 'react';
import { GripVertical, Eye, EyeOff, Settings, RotateCcw, X, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import { WIDGET_REGISTRY, getWidgetById } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';

interface DraggableWidgetProps {
  children: React.ReactNode;
  widgetId: string;
  className?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({ 
  children, 
  widgetId,
  className,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
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
        "relative group transition-all duration-200",
        isEditMode && "ring-2 ring-dashed ring-border/50 rounded-xl",
        !layoutItem?.visible && "opacity-40",
        className
      )}
    >
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-lg p-0.5">
          {onMoveUp && canMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1.5 hover:bg-muted rounded"
              title="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {onMoveDown && canMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1.5 hover:bg-muted rounded"
              title="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => toggleWidgetVisibility(widgetId)}
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
      )}
      
      {isEditMode && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
            {widget?.name || widgetId}
          </span>
        </div>
      )}
      
      <div className={cn(isEditMode && "pt-6")}>
        {children}
      </div>
    </div>
  );
};

interface EditModeToolbarProps {
  className?: string;
}

export const EditModeToolbar: React.FC<EditModeToolbarProps> = ({ className }) => {
  const { isEditMode, toggleEditMode, resetLayout, layout, toggleWidgetVisibility, swapWidgets } = useDashboardLayoutStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const hiddenWidgets = layout.filter(l => !l.visible);
  const sortedLayout = [...layout].sort((a, b) => a.order - b.order);

  const handleMoveUp = (widgetId: string) => {
    const currentIndex = sortedLayout.findIndex(l => l.widgetId === widgetId);
    if (currentIndex > 0) {
      const prevWidgetId = sortedLayout[currentIndex - 1].widgetId;
      swapWidgets(widgetId, prevWidgetId);
    }
  };

  const handleMoveDown = (widgetId: string) => {
    const currentIndex = sortedLayout.findIndex(l => l.widgetId === widgetId);
    if (currentIndex < sortedLayout.length - 1) {
      const nextWidgetId = sortedLayout[currentIndex + 1].widgetId;
      swapWidgets(widgetId, nextWidgetId);
    }
  };

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
              onClick={resetLayout}
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
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
                Toggle visibility and use arrows to reorder widgets
              </p>
              {sortedLayout.map((layoutItem, index) => {
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
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(widget.id)}
                          disabled={index === 0}
                          className={cn(
                            "p-1 rounded hover:bg-muted transition-colors",
                            index === 0 && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          <ArrowUp className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(widget.id)}
                          disabled={index === sortedLayout.length - 1}
                          className={cn(
                            "p-1 rounded hover:bg-muted transition-colors",
                            index === sortedLayout.length - 1 && "opacity-30 cursor-not-allowed"
                          )}
                        >
                          <ArrowDown className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
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

export default DraggableWidget;
