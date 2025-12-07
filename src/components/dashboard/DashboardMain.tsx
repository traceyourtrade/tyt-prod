"use client";
import React, { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

import DashboardCustom from "@/components/dashboard-components/dasboard-range/DashboardCustom";
import DashboardDay from "@/components/dashboard-components/dasboard-range/DashboardDay";
import DashboardMonth from "@/components/dashboard-components/dasboard-range/DashboardMonth";
import DashboardWeek from "@/components/dashboard-components/dasboard-range/DashboardWeek";
import useAccountDetails from "@/store/accountdetails";
import usePropFirmStore from "@/store/propFirmStore";
import notifications from "@/store/notifications";

import { PropFirmModeToggle, PropFirmDashboard } from "@/components/prop-firm";
import { EditModeToolbar } from "@/components/dashboard/DraggableWidgetGrid";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const timeRangeOptions = [
  { label: "Monthly", value: "Monthly" },
  { label: "Weekly", value: "Weekly" },
  { label: "Daily", value: "Daily" },
  { label: "Custom", value: "Custom" },
];

const DashboardMain = () => {
  const [selected, setSelected] = useState("Monthly");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setAccounts } = useAccountDetails();
  const { hrBarTxt, hrBarType } = notifications();
  const { isEnabled: isPropFirmMode } = usePropFirmStore();

  useEffect(() => {
    setAccounts();
  }, [setAccounts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PropFirmModeToggle />
          <p className="text-muted-foreground text-sm hidden md:block">
            {isPropFirmMode 
              ? "Track your prop firm challenge progress" 
              : "Overview of your trading performance"
            }
          </p>
        </div>
        
        {!isPropFirmMode && (
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="outline"
                className="min-w-[140px] justify-between"
                onClick={() => setIsOpen(!isOpen)}
              >
                {selected}
                <ChevronDown className={cn(
                  "h-4 w-4 ml-2 transition-transform",
                  isOpen && "rotate-180"
                )} />
              </Button>
              
              {isOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                  <div className="p-1">
                    {timeRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                          selected === option.value 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted text-foreground"
                        )}
                        onClick={() => {
                          setSelected(option.value);
                          setIsOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <EditModeToolbar />
          </div>
        )}
      </div>

      {hrBarTxt && hrBarType && (
        <div className={cn(
          "rounded-lg border p-4 flex items-center gap-3",
          getAlertStyles()
        )}>
          <div 
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: hrBarTxt }} 
          />
        </div>
      )}

      <div className="animate-fade-in">
        {isPropFirmMode ? (
          <PropFirmDashboard />
        ) : (
          <>
            {selected === "Daily" && <DashboardDay />}
            {selected === "Weekly" && <DashboardWeek />}
            {selected === "Monthly" && <DashboardMonth />}
            {selected === "Custom" && <DashboardCustom />}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardMain;
