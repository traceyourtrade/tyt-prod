"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Settings, RotateCcw, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import { WIDGET_REGISTRY, getWidgetById } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWidgetProps {
  children: React.ReactNode;
  widgetId: string;
  className?: string;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ 
  children, 
  widgetId,
  className,
}) => {
  const { isEditMode, toggleWidgetVisibility, layout } = useDashboardLayoutStore();
  const widget = getWidgetById(widgetId);
  const layoutItem = layout.find(l => l.widgetId === widgetId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widgetId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!layoutItem?.visible && !isEditMode) {
    return null;
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-200",
        isEditMode && "ring-2 ring-dashed ring-border/50 rounded-xl",
        !layoutItem?.visible && "opacity-40",
        isDragging && "opacity-50 z-50",
        className
      )}
    >
      {isEditMode && (
        <>
          <div className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-lg p-0.5">
            <button
              {...attributes}
              {...listeners}
              className="p-1.5 hover:bg-muted rounded cursor-grab active:cursor-grabbing touch-none"
              title="Drag to reorder"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
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
          
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
              {widget?.name || widgetId}
            </span>
          </div>
        </>
      )}
      
      <div className={cn(isEditMode && "pt-6")}>
        {children}
      </div>
    </div>
  );
};

export const DraggableWidget = SortableWidget;

interface WidgetGridProps {
  children: React.ReactNode;
  widgetIds: string[];
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ children, widgetIds }) => {
  const { layout, updateLayout } = useDashboardLayoutStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgetIds.indexOf(active.id as string);
      const newIndex = widgetIds.indexOf(over.id as string);
      
      const newOrder = arrayMove(widgetIds, oldIndex, newIndex);
      
      const updatedLayout = layout.map(item => {
        const newOrderIndex = newOrder.indexOf(item.widgetId);
        if (newOrderIndex !== -1) {
          return { ...item, order: newOrderIndex };
        }
        return item;
      });
      
      updateLayout(updatedLayout);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <div className="bg-card/80 backdrop-blur-sm border border-primary rounded-xl p-4 shadow-2xl">
            <div className="text-sm font-medium text-primary">
              {getWidgetById(activeId)?.name || activeId}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

interface EditModeToolbarProps {
  className?: string;
}

export const EditModeToolbar: React.FC<EditModeToolbarProps> = ({ className }) => {
  const { isEditMode, toggleEditMode, resetLayout, layout, toggleWidgetVisibility } = useDashboardLayoutStore();
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
              onClick={resetLayout}
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            
            <span className="text-xs text-muted-foreground ml-2">
              Drag widgets to reorder
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
                Toggle widget visibility. Drag widgets on dashboard to reorder.
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

export default SortableWidget;
