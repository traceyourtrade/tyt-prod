"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Settings, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import useDashboardLayoutStore from '@/store/dashboardLayoutStore';
import { WIDGET_REGISTRY } from '@/lib/dashboardWidgets';
import { Button } from '@/components/ui/button';

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
                Toggle widget visibility
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

export default EditModeToolbar;
