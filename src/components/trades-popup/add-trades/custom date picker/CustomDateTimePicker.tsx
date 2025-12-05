'use client';

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Calendar,
  Clock,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (date: Date) => void;
}

const getHours = () => Array.from({ length: 24 }, (_, i) => i);
const getMinutes = () => Array.from({ length: 60 }, (_, i) => i);

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ 
  isOpen, 
  onClose, 
  onApply 
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'time') {
      const selectedHour = selectedDateTime.getHours();
      const selectedMinute = selectedDateTime.getMinutes();

      if (hourRef.current) {
        const hourElement = hourRef.current.children[selectedHour] as HTMLElement;
        if (hourElement) {
          hourElement.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }

      if (minuteRef.current) {
        const minuteElement = minuteRef.current.children[selectedMinute] as HTMLElement;
        if (minuteElement) {
          minuteElement.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
    }
  }, [isOpen, activeTab, selectedDateTime]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDateTime(
      new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        selectedDateTime.getHours(),
        selectedDateTime.getMinutes()
      )
    );
  };

  const handleTimeSelect = (type: "hour" | "minute", value: number) => {
    const newDate = new Date(selectedDateTime);
    if (type === "hour") newDate.setHours(value);
    if (type === "minute") newDate.setMinutes(value);
    setSelectedDateTime(newDate);
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDateTime(today);
    setViewDate(today);
  };

  const handleSetNow = () => {
    const now = new Date();
    setSelectedDateTime(now);
  };

  const handleApply = () => {
    onApply(selectedDateTime);
    onClose();
  };

  const generateCalendarGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const grid: JSX.Element[] = [];
    
    for (let i = 0; i < startDay; i++) {
      grid.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSelected =
        day === selectedDateTime.getDate() &&
        month === selectedDateTime.getMonth() &&
        year === selectedDateTime.getFullYear();
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      const isFutureDate = currentDate > today;

      grid.push(
        <motion.button
          key={day}
          whileHover={{ scale: isFutureDate ? 1 : 1.1 }}
          whileTap={{ scale: isFutureDate ? 1 : 0.95 }}
          className={cn(
            "aspect-square rounded-xl text-sm font-medium transition-all duration-200",
            "flex items-center justify-center",
            isSelected
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : isToday
                ? "bg-primary/20 text-primary border border-primary/30"
                : "hover:bg-muted/50 text-foreground",
            isFutureDate && "opacity-30 cursor-not-allowed"
          )}
          onClick={() => !isFutureDate && handleDateSelect(day)}
          disabled={isFutureDate}
        >
          {day}
        </motion.button>
      );
    }
    return grid;
  };

  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  
  const formatSelectedDate = () => {
    return selectedDateTime.toLocaleString("default", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatSelectedTime = () => {
    return selectedDateTime.toLocaleString("default", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Select Date & Time</h2>
                <p className="text-xs text-muted-foreground">{formatSelectedDate()} at {formatSelectedTime()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="p-3 border-b border-border">
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
              <button
                onClick={() => setActiveTab('date')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'date'
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="w-4 h-4" />
                Date
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'time'
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="w-4 h-4" />
                Time
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'date' ? (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handlePrevMonth}
                      className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <span className="font-semibold text-foreground">{monthName}</span>
                    <button
                      onClick={handleNextMonth}
                      className="w-9 h-9 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="aspect-square flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarGrid()}
                  </div>

                  {/* Today Button */}
                  <button
                    onClick={handleSetToday}
                    className="w-full mt-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    Jump to Today
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Time Display */}
                  <div className="text-center py-4 bg-muted/20 rounded-xl border border-border/50">
                    <div className="text-4xl font-bold text-foreground tracking-wider">
                      {String(selectedDateTime.getHours()).padStart(2, '0')}
                      <span className="text-primary mx-1">:</span>
                      {String(selectedDateTime.getMinutes()).padStart(2, '0')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">24-hour format</p>
                  </div>

                  {/* Time Wheels */}
                  <div className="flex gap-4">
                    {/* Hour Wheel */}
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-2 text-center">Hour</div>
                      <div 
                        ref={hourRef}
                        className="h-48 overflow-y-auto rounded-xl bg-muted/20 border border-border/50 scrollbar-hide"
                      >
                        <div className="p-1 space-y-0.5">
                          {getHours().map((hour) => {
                            const isSelected = hour === selectedDateTime.getHours();
                            return (
                              <button
                                key={hour}
                                onClick={() => handleTimeSelect("hour", hour)}
                                className={cn(
                                  "w-full py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                  isSelected
                                    ? "bg-primary text-white"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                {String(hour).padStart(2, "0")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Minute Wheel */}
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-2 text-center">Minute</div>
                      <div 
                        ref={minuteRef}
                        className="h-48 overflow-y-auto rounded-xl bg-muted/20 border border-border/50 scrollbar-hide"
                      >
                        <div className="p-1 space-y-0.5">
                          {getMinutes().map((minute) => {
                            const isSelected = minute === selectedDateTime.getMinutes();
                            return (
                              <button
                                key={minute}
                                onClick={() => handleTimeSelect("minute", minute)}
                                className={cn(
                                  "w-full py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                  isSelected
                                    ? "bg-primary text-white"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                              >
                                {String(minute).padStart(2, "0")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Now Button */}
                  <button
                    onClick={handleSetNow}
                    className="w-full py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    Set to Now
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              className="flex-1 py-3 rounded-xl font-medium bg-primary text-white hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <Check className="w-4 h-4" />
              Apply
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomDateTimePicker;
