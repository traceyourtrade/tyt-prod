"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Settings, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import { WIDGET_REGISTRY, getWidgetById } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';

interface DraggableWidgetGridProps {
  children: React.ReactNode;
  widgetId: string;
  className?: string;
}

export const DraggableWidget: React.FC<DraggableWidgetGridProps> = ({ 
  children, 
  widgetId,
  className 
}) => {
  const { isEditMode, toggleWidgetVisibility, layout } = useDashboardLayoutStore();
  const widget = getWidgetById(widgetId);
  const layoutItem = layout.find(l => l.widgetId === widgetId);
  
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('widgetId', widgetId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  if (!layoutItem?.visible && !isEditMode) {
    return null;
  }

  return (
    <div 
      className={cn(
        "relative group transition-all duration-200",
        isEditMode && "ring-2 ring-dashed ring-border/50 rounded-xl",
        isDragging && "opacity-50",
        !layoutItem?.visible && "opacity-40",
        className
      )}
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {isEditMode && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1">
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

interface WidgetDropZoneProps {
  onDrop: (widgetId: string, targetIndex: number) => void;
  index: number;
  children: React.ReactNode;
}

export const WidgetDropZone: React.FC<WidgetDropZoneProps> = ({ 
  onDrop, 
  index,
  children 
}) => {
  const { isEditMode } = useDashboardLayoutStore();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetId = e.dataTransfer.getData('widgetId');
    onDrop(widgetId, index);
    setIsOver(false);
  };

  return (
    <div
      onDragOver={isEditMode ? handleDragOver : undefined}
      onDragLeave={isEditMode ? handleDragLeave : undefined}
      onDrop={isEditMode ? handleDrop : undefined}
      className={cn(
        "transition-all duration-200",
        isOver && isEditMode && "ring-2 ring-primary/50 rounded-xl bg-primary/5"
      )}
    >
      {children}
    </div>
  );
};

interface EditModeToolbarProps {
  className?: string;
}

export const EditModeToolbar: React.FC<EditModeToolbarProps> = ({ className }) => {
  const { isEditMode, toggleEditMode, resetLayout, layout, toggleWidgetVisibility } = useDashboardLayoutStore();
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const hiddenWidgets = layout.filter(l => !l.visible);

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
              {WIDGET_REGISTRY.map(widget => {
                const layoutItem = layout.find(l => l.widgetId === widget.id);
                const isVisible = layoutItem?.visible ?? true;
                
                return (
                  <div 
                    key={widget.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      isVisible 
                        ? "bg-card border-border" 
                        : "bg-muted/30 border-border/50"
                    )}
                  >
                    <div>
                      <p className={cn("font-medium text-sm", !isVisible && "text-muted-foreground")}>
                        {widget.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {widget.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        isVisible 
                          ? "bg-primary/10 text-primary hover:bg-primary/20" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
