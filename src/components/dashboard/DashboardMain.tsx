"use client";
import React from "react";
import usePropFirmStore from "@/store/propFirmStore";
import notifications from "@/store/notifications";
import { PropFirmModeToggle, PropFirmDashboard } from "@/components/prop-firm";
import NewDashboard from "@/components/dashboard/NewDashboard";
import { cn } from "@/lib/utils";

const DashboardMain = () => {
  const { hrBarTxt, hrBarType } = notifications();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();

  const getAlertStyles = () => {
    switch (hrBarType) {
      case "Alert":
        return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
      case "Danger":
        return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {hrBarTxt && hrBarType && (
        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-3",
          getAlertStyles()
        )}>
          <div 
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: hrBarTxt }} 
          />
        </div>
      )}

      {isPropFirmMode ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <PropFirmModeToggle />
            <p className="text-muted-foreground text-sm hidden md:block">
              Track your prop firm challenge progress
            </p>
          </div>
          <PropFirmDashboard />
        </div>
      ) : (
        <NewDashboard />
      )}
    </div>
  );
};

export default DashboardMain;
